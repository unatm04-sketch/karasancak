"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { conversations, messages, ranks, users, xpEvents } from "@/lib/db/schema";
import { pushToast, pushToasts } from "@/lib/flash";
import { newId } from "@/lib/ids";
import { authorColumns } from "@/lib/queries/forum";
import {
  getConversationAccess,
  getOrCreateDirectConversation,
  markConversationRead,
  type MessageDTO,
} from "@/lib/queries/messages";
import { consumeRateLimit } from "@/lib/rate-limit";
import { awardXp, awardsToToasts } from "@/lib/xp/award";
import { MESSAGE_XP_COOLDOWN_MS, MIN_MESSAGE_LENGTH_FOR_XP } from "@/lib/xp/rules";

const MAX_MESSAGE_LENGTH = 2000;

/** Profil sayfasındaki "Mesaj gönder" butonu */
export async function startConversation(username: string): Promise<void> {
  const me = await requireUser();
  const [other] = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  if (!other || other.status !== "active" || other.id === me.id) redirect("/mesajlar");
  const { id } = await getOrCreateDirectConversation(me.id, other.id);
  redirect(`/mesajlar/${id}`);
}

export type SendResult =
  | { ok: true; message: MessageDTO }
  | { ok: false; error: string };

export async function sendMessage(conversationId: string, rawBody: string): Promise<SendResult> {
  const me = await requireUser();
  const body = rawBody.trim();
  if (!body) return { ok: false, error: "Boş mesaj gönderilemez." };
  if (body.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.` };
  }
  if (!(await consumeRateLimit(`message:${me.id}`, 30, 60 * 1000))) {
    return { ok: false, error: "Çok hızlı yazıyorsun. Biraz bekle." };
  }

  const access = await getConversationAccess(conversationId, me.id);
  if (!access) return { ok: false, error: "Bu sohbete erişimin yok." };

  const now = Date.now();
  const id = newId();

  const [previous] = await db
    .select({ n: count() })
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.senderId, me.id)));
  const firstInConversation = (previous?.n ?? 0) === 0;

  await db.batch([
    db.insert(messages).values({ id, conversationId, senderId: me.id, body, createdAt: now }),
    db.update(conversations).set({ lastMessageAt: now }).where(eq(conversations.id, conversationId)),
  ]);
  await markConversationRead(conversationId, me.id, now);

  // Bir önceki ödüllü mesajdan bu yana bekleme süresi geçmediyse XP verilmez.
  const [recentAward] = await db
    .select({ createdAt: xpEvents.createdAt })
    .from(xpEvents)
    .where(
      and(
        eq(xpEvents.userId, me.id),
        eq(xpEvents.ruleKey, "message_sent"),
        gte(xpEvents.createdAt, now - MESSAGE_XP_COOLDOWN_MS),
      ),
    )
    .orderBy(desc(xpEvents.createdAt))
    .limit(1);

  const awards = [];
  if (body.length >= MIN_MESSAGE_LENGTH_FOR_XP && !recentAward) {
    awards.push(await awardXp(me.id, "message_sent", { dedupeKey: `message:${id}` }));
  }
  if (firstInConversation && access.type === "direct") {
    awards.push(
      await awardXp(me.id, "conversation_started", { dedupeKey: `conversation:${conversationId}:${me.id}` }),
    );
  }
  await pushToasts(awardsToToasts(awards));

  const [sender] = await db
    .select(authorColumns)
    .from(users)
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .where(eq(users.id, me.id))
    .limit(1);

  revalidatePath("/mesajlar");
  return {
    ok: true,
    message: { id, body, createdAt: now, sender: sender! },
  };
}

export async function clearMessage(messageId: string): Promise<void> {
  const me = await requireUser();
  const [row] = await db
    .select({ senderId: messages.senderId, conversationId: messages.conversationId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  if (!row) return;
  if (row.senderId !== me.id && me.role !== "admin" && me.role !== "moderator") return;
  await db.update(messages).set({ deletedAt: Date.now() }).where(eq(messages.id, messageId));
  await pushToast({ kind: "info", message: "Mesaj silindi." });
  revalidatePath("/mesajlar", "layout");
}
