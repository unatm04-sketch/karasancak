import "server-only";
import { and, asc, count, desc, eq, gt, gte, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  achievements,
  applications,
  eventAttendees,
  posts,
  ranks,
  referralClicks,
  topics,
  users,
  xpEvents,
  xpRules,
} from "@/lib/db/schema";
import { istanbulDay } from "@/lib/format";
import { authorColumns } from "./forum";

export async function getProfileByUsername(username: string) {
  const [row] = await db
    .select({
      ...authorColumns,
      bio: users.bio,
      city: users.city,
      instagram: users.instagram,
      tribune: users.tribune,
      status: users.status,
      streak: users.streak,
      bestStreak: users.bestStreak,
      createdAt: users.createdAt,
      rankDescription: ranks.description,
    })
    .from(users)
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function getProfileStats(userId: string) {
  const [topicRow, postRow, likeRow, inviteRow, eventRow] = await Promise.all([
    db
      .select({ n: count() })
      .from(topics)
      .where(and(eq(topics.authorId, userId), isNull(topics.deletedAt))),
    db
      .select({ n: count() })
      .from(posts)
      .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt))),
    db
      .select({ n: sql<number>`COALESCE(SUM(${posts.likeCount}), 0)` })
      .from(posts)
      .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt))),
    db.select({ n: count() }).from(users).where(eq(users.referredById, userId)),
    db
      .select({ n: count() })
      .from(eventAttendees)
      .where(and(eq(eventAttendees.userId, userId), isNotNull(eventAttendees.attendedAt))),
  ]);
  return {
    topics: topicRow[0]?.n ?? 0,
    posts: postRow[0]?.n ?? 0,
    likes: Number(likeRow[0]?.n ?? 0),
    invites: inviteRow[0]?.n ?? 0,
    events: eventRow[0]?.n ?? 0,
  };
}

export async function listAchievements(userId: string) {
  return db
    .select({ key: achievements.key, createdAt: achievements.createdAt })
    .from(achievements)
    .where(eq(achievements.userId, userId))
    .orderBy(desc(achievements.createdAt));
}

export async function recentXpEvents(userId: string, limit = 10) {
  return db
    .select({
      id: xpEvents.id,
      amount: xpEvents.amount,
      reason: xpEvents.reason,
      ruleKey: xpEvents.ruleKey,
      createdAt: xpEvents.createdAt,
      label: xpRules.label,
    })
    .from(xpEvents)
    .leftJoin(xpRules, eq(xpEvents.ruleKey, xpRules.key))
    .where(eq(xpEvents.userId, userId))
    .orderBy(desc(xpEvents.createdAt))
    .limit(limit);
}

/** Bugün hangi kuraldan kaç kez ödül alındı: panel görev listesi için */
export async function todaysRuleCounts(userId: string, now: number) {
  const rows = await db
    .select({ ruleKey: xpEvents.ruleKey, n: count(), total: sql<number>`SUM(${xpEvents.amount})` })
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, userId), eq(xpEvents.day, istanbulDay(now))))
    .groupBy(xpEvents.ruleKey);
  return new Map(rows.map((r) => [r.ruleKey, { count: r.n, total: Number(r.total) }]));
}

export async function listXpRules() {
  return db.select().from(xpRules).orderBy(asc(xpRules.sortOrder));
}

export async function listRanks() {
  return db.select().from(ranks).orderBy(asc(ranks.sortOrder));
}

export type LeaderboardPeriod = "tum" | "hafta" | "ay";

export async function leaderboard(period: LeaderboardPeriod, limit: number, now: number) {
  const base = {
    ...authorColumns,
  };
  if (period === "tum") {
    const rows = await db
      .select(base)
      .from(users)
      .leftJoin(ranks, eq(users.rankId, ranks.id))
      .where(and(eq(users.status, "active"), gt(users.xp, 0)))
      .orderBy(desc(users.xp), asc(users.createdAt))
      .limit(limit);
    return rows.map((r) => ({ ...r, periodXp: r.xp }));
  }
  const since = now - (period === "hafta" ? 7 : 30) * 24 * 60 * 60 * 1000;
  const periodXp = sql<number>`SUM(${xpEvents.amount})`;
  const rows = await db
    .select({ ...base, periodXp })
    .from(xpEvents)
    .innerJoin(users, eq(xpEvents.userId, users.id))
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .where(and(gte(xpEvents.createdAt, since), eq(users.status, "active")))
    .groupBy(users.id)
    .having(sql`SUM(${xpEvents.amount}) > 0`)
    .orderBy(desc(periodXp))
    .limit(limit);
  return rows.map((r) => ({ ...r, periodXp: Number(r.periodXp) }));
}

export async function referralLeaderboard(limit: number) {
  const invites = sql<number>`COUNT(invited.id)`;
  const rows = await db
    .select({ ...authorColumns, invites })
    .from(users)
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .innerJoin(sql`users AS invited`, sql`invited.referred_by_id = ${users.id}`)
    .where(eq(users.status, "active"))
    .groupBy(users.id)
    .orderBy(desc(invites))
    .limit(limit);
  return rows.map((r) => ({ ...r, invites: Number(r.invites) }));
}

export async function referralStats(userId: string) {
  const [clicks, apps, approved, xp] = await Promise.all([
    db.select({ n: count() }).from(referralClicks).where(eq(referralClicks.referrerId, userId)),
    db.select({ n: count() }).from(applications).where(eq(applications.referrerId, userId)),
    db.select({ n: count() }).from(users).where(eq(users.referredById, userId)),
    db
      .select({ n: sql<number>`COALESCE(SUM(${xpEvents.amount}), 0)` })
      .from(xpEvents)
      .where(and(eq(xpEvents.userId, userId), like(xpEvents.ruleKey, "referral_%"))),
  ]);
  return {
    clicks: clicks[0]?.n ?? 0,
    applications: apps[0]?.n ?? 0,
    approved: approved[0]?.n ?? 0,
    xp: Number(xp[0]?.n ?? 0),
  };
}

export async function findUserByReferralCode(code: string) {
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      status: users.status,
    })
    .from(users)
    .where(eq(users.referralCode, code.toLowerCase()))
    .limit(1);
  return row && row.status === "active" ? row : null;
}

export async function searchMembers(query: string, limit = 10, excludeUserId?: string) {
  const q = `%${query.replace(/[%_]/g, "")}%`;
  return db
    .select(authorColumns)
    .from(users)
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .where(
      and(
        eq(users.status, "active"),
        or(like(users.username, q), like(users.displayName, q)),
        excludeUserId ? sql`${users.id} <> ${excludeUserId}` : undefined,
      ),
    )
    .orderBy(desc(users.xp))
    .limit(limit);
}
