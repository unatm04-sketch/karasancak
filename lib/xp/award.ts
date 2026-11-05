import "server-only";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, xpEvents, xpRules } from "@/lib/db/schema";
import { istanbulDay } from "@/lib/format";
import { newId } from "@/lib/ids";
import { notify } from "@/lib/notifications";
import type { Toast } from "@/lib/toast";
import { levelFromXp, tierForLevel } from "./levels";
import type { XpRuleKey } from "./rules";

export type XpAward = {
  amount: number;
  label: string;
  xp: number;
  level: number;
  leveledUp: boolean;
};

type AwardOptions = {
  /** Aynı anahtarla ikinci kez ödül verilmez (ör. `like:postId:userId`). */
  dedupeKey?: string;
  /** Kuralın varsayılan miktarı yerine kullanılır (ör. etkinlik ödülü). */
  amount?: number;
  /** Kayıt ekranında görünen açıklama */
  reason?: string;
  actorId?: string;
};

/**
 * Tüm XP kazanımlarının geçtiği tek yer.
 *
 * Kural pasifse, günlük limit dolduysa veya aynı işlem zaten ödüllendirildiyse
 * null döner ve kullanıcıya hiçbir şey yansımaz. dedupeKey benzersiz indeksle
 * korunduğu için çift tıklama veya eşzamanlı istek çift ödül üretemez.
 */
export async function awardXp(
  userId: string,
  ruleKey: XpRuleKey,
  options: AwardOptions = {},
): Promise<XpAward | null> {
  const [rule] = await db.select().from(xpRules).where(eq(xpRules.key, ruleKey)).limit(1);
  if (!rule || !rule.active) return null;

  const amount = options.amount ?? rule.amount;
  if (amount === 0) return null;

  const now = Date.now();
  const day = istanbulDay(now);

  if (rule.dailyCap !== null) {
    const [row] = await db
      .select({ n: count() })
      .from(xpEvents)
      .where(
        and(eq(xpEvents.userId, userId), eq(xpEvents.ruleKey, ruleKey), eq(xpEvents.day, day)),
      );
    if ((row?.n ?? 0) >= rule.dailyCap) return null;
  }

  const inserted = await db
    .insert(xpEvents)
    .values({
      id: newId(),
      userId,
      ruleKey,
      amount,
      reason: options.reason ?? null,
      dedupeKey: options.dedupeKey ?? null,
      day,
      actorId: options.actorId ?? null,
      createdAt: now,
    })
    .onConflictDoNothing({ target: xpEvents.dedupeKey })
    .returning({ id: xpEvents.id });
  if (inserted.length === 0) return null;

  const applied = await applyXpDelta(userId, amount);
  if (!applied) return null;

  return { amount, label: rule.label, ...applied };
}

/** Elle düzeltme. Eksi değer kabul eder, toplam XP sıfırın altına inmez. */
export async function adjustXp(
  userId: string,
  amount: number,
  reason: string,
  actorId: string,
): Promise<void> {
  await db.insert(xpEvents).values({
    id: newId(),
    userId,
    ruleKey: "manual",
    amount,
    reason,
    day: istanbulDay(Date.now()),
    actorId,
    createdAt: Date.now(),
  });
  await applyXpDelta(userId, amount);
}

/**
 * Bir işlemin kazandırdığı XP'yi geri alır (moderatörün sildiği spam yazı gibi).
 * Böylece "yaz, XP'yi al, sil" yöntemiyle puan kasılamaz.
 */
export async function revokeXp(userId: string, dedupeKey: string, reason: string): Promise<void> {
  const [event] = await db
    .select({ amount: xpEvents.amount })
    .from(xpEvents)
    .where(and(eq(xpEvents.dedupeKey, dedupeKey), eq(xpEvents.userId, userId)))
    .limit(1);
  if (!event) return;

  const inserted = await db
    .insert(xpEvents)
    .values({
      id: newId(),
      userId,
      ruleKey: "revoke",
      amount: -event.amount,
      reason,
      dedupeKey: `revoke:${dedupeKey}`,
      day: istanbulDay(Date.now()),
      createdAt: Date.now(),
    })
    .onConflictDoNothing({ target: xpEvents.dedupeKey })
    .returning({ id: xpEvents.id });
  if (inserted.length > 0) await applyXpDelta(userId, -event.amount);
}

/**
 * Yanlışlıkla verilmiş bir ödülü tamamen geri alır (hatalı yoklama gibi).
 * revokeXp'ten farkı: kayıt silindiği için aynı işlem sonradan yeniden ödüllendirilebilir.
 */
export async function undoAward(userId: string, dedupeKey: string): Promise<void> {
  const [event] = await db
    .delete(xpEvents)
    .where(and(eq(xpEvents.dedupeKey, dedupeKey), eq(xpEvents.userId, userId)))
    .returning({ amount: xpEvents.amount });
  if (event) await applyXpDelta(userId, -event.amount);
}

async function applyXpDelta(
  userId: string,
  amount: number,
): Promise<{ xp: number; level: number; leveledUp: boolean } | null> {
  const [before] = await db
    .select({ level: users.level, referredById: users.referredById })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!before) return null;

  const [after] = await db
    .update(users)
    .set({ xp: sql`MAX(${users.xp} + ${amount}, 0)` })
    .where(eq(users.id, userId))
    .returning({ xp: users.xp });
  if (!after) return null;

  const level = levelFromXp(after.xp);
  if (level === before.level) {
    return { xp: after.xp, level, leveledUp: false };
  }

  await db.update(users).set({ level }).where(eq(users.id, userId));
  const leveledUp = level > before.level;

  if (leveledUp) {
    const tier = tierForLevel(level);
    await notify(userId, {
      type: "level",
      title: `Seviye ${level} oldun`,
      body: `Sürüdeki yerin: ${tier.name}. ${tier.note}`,
      href: "/panel",
    });
    if (before.level < 5 && level >= 5 && before.referredById) {
      await awardXp(before.referredById, "referral_level5", {
        dedupeKey: `referral_level5:${userId}`,
      });
    }
  }
  return { xp: after.xp, level, leveledUp };
}

/** Bir veya birkaç ödülü kullanıcıya gösterilecek bildirime çevirir. */
export function awardsToToasts(awards: Array<XpAward | null | undefined>): Toast[] {
  const toasts: Toast[] = [];
  for (const a of awards) {
    if (!a) continue;
    toasts.push({ kind: "xp", amount: a.amount, label: a.label });
    if (a.leveledUp) {
      toasts.push({ kind: "level", level: a.level, tier: tierForLevel(a.level).name });
    }
  }
  return toasts;
}
