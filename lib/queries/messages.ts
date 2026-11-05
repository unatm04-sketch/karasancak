import "server-only";
import { and, asc, desc, eq, gt, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversationMembers, conversations, messages, ranks, users } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { authorColumns, type AuthorSummary } from "./forum";

export const ROOM_ID = "tribun";

export type MessageDTO = {
  id: string;
  body: string;
  createdAt: number;
  sender: AuthorSummary;
};

export type ConversationAccess = {
  id: string;
  type: "direct" | "room";
  title: string | null;
  other: AuthorSummary | null;
};

/**
 * Sohbete erişim kontrolü. Tribün tüm üyelere açıktır, doğrudan sohbetleri
 * yalnızca iki tarafı görebilir. Erişim yoksa null döner.
 */
export async function getConversationAccess(
  conversationId: string,
  userId: string,
): Promise<ConversationAccess | null> {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!conv) return null;

  if (conv.type === "room") {
    await db
      .insert(conversationMembers)
      .values({ conversationId, userId, lastReadAt: 0 })
      .onConflictDoNothing();
    return { id: conv.id, type: "room", title: conv.title, other: null };
  }

  const members = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(eq(conversationMembers.conversationId, conversationId));
  if (!members.some((m) => m.userId === userId)) return null;

  const otherId = members.find((m) => m.userId !== userId)?.userId;
  let other: AuthorSummary | null = null;
  if (otherId) {
    const [row] = await db
      .select(authorColumns)
      .from(users)
      .leftJoin(ranks, eq(users.rankId, ranks.id))
      .where(eq(users.id, otherId))
      .limit(1);
    other = row ?? null;
  }
  return { id: conv.id, type: "direct", title: conv.title, other };
}

export async function findDirectConversation(a: string, b: string) {
  const key = [a, b].sort().join(":");
  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.directKey, key))
    .limit(1);
  return row?.id ?? null;
}

/** @returns sohbet kimliği ve daha önce var olup olmadığı */
export async function getOrCreateDirectConversation(a: string, b: string) {
  const key = [a, b].sort().join(":");
  const id = newId();
  const created = await db
    .insert(conversations)
    .values({ id, type: "direct", directKey: key, createdAt: Date.now() })
    .onConflictDoNothing({ target: conversations.directKey })
    .returning({ id: conversations.id });
  if (created.length > 0) {
    await db.insert(conversationMembers).values([
      { conversationId: id, userId: a, lastReadAt: Date.now() },
      { conversationId: id, userId: b, lastReadAt: 0 },
    ]);
    return { id, isNew: true };
  }
  const existing = await findDirectConversation(a, b);
  return { id: existing!, isNew: false };
}

export async function listConversations(userId: string) {
  const room = db
    .select({
      id: conversations.id,
      type: conversations.type,
      title: conversations.title,
      lastMessageAt: conversations.lastMessageAt,
      lastReadAt: sql<number>`COALESCE((SELECT m.last_read_at FROM conversation_members m WHERE m.conversation_id = "conversations"."id" AND m.user_id = ${userId}), 0)`,
    })
    .from(conversations)
    .where(eq(conversations.type, "room"));

  const direct = db
    .select({
      id: conversations.id,
      type: conversations.type,
      title: conversations.title,
      lastMessageAt: conversations.lastMessageAt,
      lastReadAt: conversationMembers.lastReadAt,
    })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversationMembers.conversationId, conversations.id))
    .where(
      and(
        eq(conversationMembers.userId, userId),
        eq(conversations.type, "direct"),
        sql`${conversations.lastMessageAt} IS NOT NULL`,
      ),
    )
    .orderBy(desc(conversations.lastMessageAt))
    .limit(40);

  const [roomRows, directRows] = await Promise.all([room, direct]);
  const rows = [...roomRows, ...directRows];

  return Promise.all(
    rows.map(async (row) => {
      const [last] = await db
        .select({
          body: messages.body,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
          senderName: users.displayName,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(and(eq(messages.conversationId, row.id), isNull(messages.deletedAt)))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const [unread] = await db
        .select({ n: sql<number>`COUNT(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, row.id),
            isNull(messages.deletedAt),
            gt(messages.createdAt, Number(row.lastReadAt)),
            ne(messages.senderId, userId),
          ),
        );

      let other: AuthorSummary | null = null;
      if (row.type === "direct") {
        const [otherRow] = await db
          .select(authorColumns)
          .from(conversationMembers)
          .innerJoin(users, eq(conversationMembers.userId, users.id))
          .leftJoin(ranks, eq(users.rankId, ranks.id))
          .where(
            and(
              eq(conversationMembers.conversationId, row.id),
              ne(conversationMembers.userId, userId),
            ),
          )
          .limit(1);
        other = otherRow ?? null;
      }

      return {
        id: row.id,
        type: row.type,
        title: row.title,
        lastMessageAt: row.lastMessageAt,
        last: last ?? null,
        unread: Number(unread?.n ?? 0),
        other,
      };
    }),
  );
}

const messageColumns = {
  id: messages.id,
  body: messages.body,
  createdAt: messages.createdAt,
  sender: authorColumns,
};

export async function listMessages(
  conversationId: string,
  opts: { after?: number; before?: number; limit?: number } = {},
): Promise<MessageDTO[]> {
  const limit = opts.limit ?? 50;
  const conditions = and(
    eq(messages.conversationId, conversationId),
    isNull(messages.deletedAt),
    opts.after ? gt(messages.createdAt, opts.after) : undefined,
    opts.before ? lt(messages.createdAt, opts.before) : undefined,
  );

  if (opts.after) {
    // Yeni gelenler: eskiden yeniye
    return db
      .select(messageColumns)
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .leftJoin(ranks, eq(users.rankId, ranks.id))
      .where(conditions)
      .orderBy(asc(messages.createdAt))
      .limit(limit);
  }

  // Son N mesajı al, ekrana eskiden yeniye bas.
  const rows = await db
    .select(messageColumns)
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .where(conditions)
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

export async function markConversationRead(conversationId: string, userId: string, at: number) {
  await db
    .insert(conversationMembers)
    .values({ conversationId, userId, lastReadAt: at })
    .onConflictDoUpdate({
      target: [conversationMembers.conversationId, conversationMembers.userId],
      set: { lastReadAt: at },
    });
}

/** Üst menü rozetindeki okunmamış sohbet sayısı */
export async function unreadConversationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`COUNT(DISTINCT ${messages.conversationId})` })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(
      conversationMembers,
      and(
        eq(conversationMembers.conversationId, messages.conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .where(
      and(
        eq(conversations.type, "direct"),
        isNull(messages.deletedAt),
        ne(messages.senderId, userId),
        sql`${messages.createdAt} > ${conversationMembers.lastReadAt}`,
      ),
    );
  return Number(row?.n ?? 0);
}
