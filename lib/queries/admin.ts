import "server-only";
import { and, asc, count, desc, eq, gte, like, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db";
import {
  announcements,
  applications,
  auditLogs,
  events,
  forumCategories,
  posts,
  ranks,
  referralClicks,
  topics,
  users,
  xpEvents,
  xpRules,
  type ApplicationStatus,
} from "@/lib/db/schema";
import { istanbulDay } from "@/lib/format";

export const ADMIN_PAGE_SIZE = 25;

export async function adminOverview(now: number) {
  const today = istanbulDay(now);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const [members, pending, newMembers, topicCount, postCount, xpToday, clicks] = await Promise.all([
    db.select({ n: count() }).from(users).where(eq(users.status, "active")),
    db.select({ n: count() }).from(applications).where(eq(applications.status, "pending")),
    db.select({ n: count() }).from(users).where(gte(users.createdAt, weekAgo)),
    db.select({ n: count() }).from(topics).where(sql`${topics.deletedAt} IS NULL`),
    db.select({ n: count() }).from(posts).where(sql`${posts.deletedAt} IS NULL`),
    db
      .select({ n: sql<number>`COALESCE(SUM(${xpEvents.amount}), 0)` })
      .from(xpEvents)
      .where(eq(xpEvents.day, today)),
    db.select({ n: count() }).from(referralClicks).where(gte(referralClicks.createdAt, weekAgo)),
  ]);
  return {
    members: members[0]?.n ?? 0,
    pending: pending[0]?.n ?? 0,
    newMembers: newMembers[0]?.n ?? 0,
    topics: topicCount[0]?.n ?? 0,
    posts: postCount[0]?.n ?? 0,
    xpToday: Number(xpToday[0]?.n ?? 0),
    referralClicks: clicks[0]?.n ?? 0,
  };
}

const referrer = alias(users, "referrer");

export async function listApplications(status: ApplicationStatus, page: number) {
  const where = eq(applications.status, status);
  const [items, totals] = await Promise.all([
    db
      .select({
        id: applications.id,
        fullName: applications.fullName,
        username: applications.username,
        city: applications.city,
        motivation: applications.motivation,
        createdAt: applications.createdAt,
        reviewedAt: applications.reviewedAt,
        referrerName: referrer.displayName,
      })
      .from(applications)
      .leftJoin(referrer, eq(applications.referrerId, referrer.id))
      .where(where)
      .orderBy(status === "pending" ? asc(applications.createdAt) : desc(applications.reviewedAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE),
    db.select({ n: count() }).from(applications).where(where),
  ]);
  return { items, total: totals[0]?.n ?? 0 };
}

export async function getApplication(id: string) {
  const reviewer = alias(users, "reviewer");
  const [row] = await db
    .select({
      id: applications.id,
      fullName: applications.fullName,
      username: applications.username,
      email: applications.email,
      phone: applications.phone,
      city: applications.city,
      tribune: applications.tribune,
      instagram: applications.instagram,
      motivation: applications.motivation,
      status: applications.status,
      reviewNote: applications.reviewNote,
      reviewedAt: applications.reviewedAt,
      createdUserId: applications.createdUserId,
      createdAt: applications.createdAt,
      referrerName: referrer.displayName,
      referrerUsername: referrer.username,
      reviewerName: reviewer.displayName,
    })
    .from(applications)
    .leftJoin(referrer, eq(applications.referrerId, referrer.id))
    .leftJoin(reviewer, eq(applications.reviewedById, reviewer.id))
    .where(eq(applications.id, id))
    .limit(1);
  return row ?? null;
}

export async function listMembers(filters: {
  q?: string;
  rankId?: string;
  status?: string;
  page: number;
}) {
  const conditions: Array<SQL | undefined> = [];
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[%_]/g, "")}%`;
    conditions.push(
      or(like(users.username, pattern), like(users.displayName, pattern), like(users.email, pattern)),
    );
  }
  if (filters.rankId) conditions.push(eq(users.rankId, filters.rankId));
  if (filters.status === "active" || filters.status === "suspended") {
    conditions.push(eq(users.status, filters.status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totals] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        city: users.city,
        role: users.role,
        status: users.status,
        xp: users.xp,
        level: users.level,
        avatarVersion: users.avatarVersion,
        hasPassword: sql<number>`${users.passwordHash} IS NOT NULL`,
        createdAt: users.createdAt,
        lastSeenAt: users.lastSeenAt,
        rankName: ranks.name,
        rankOrder: ranks.sortOrder,
      })
      .from(users)
      .leftJoin(ranks, eq(users.rankId, ranks.id))
      .where(where)
      .orderBy(desc(users.xp))
      .limit(ADMIN_PAGE_SIZE)
      .offset((filters.page - 1) * ADMIN_PAGE_SIZE),
    db.select({ n: count() }).from(users).where(where),
  ]);
  return { items, total: totals[0]?.n ?? 0 };
}

export async function getMember(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      phone: users.phone,
      city: users.city,
      tribune: users.tribune,
      role: users.role,
      status: users.status,
      rankId: users.rankId,
      rankName: ranks.name,
      rankOrder: ranks.sortOrder,
      xp: users.xp,
      level: users.level,
      avatarVersion: users.avatarVersion,
      hasPassword: sql<number>`${users.passwordHash} IS NOT NULL`,
      referralCode: users.referralCode,
      streak: users.streak,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
      referrerName: referrer.displayName,
      referrerUsername: referrer.username,
    })
    .from(users)
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .leftJoin(referrer, eq(users.referredById, referrer.id))
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

export async function listXpLog(limit: number, userId?: string) {
  const actor = alias(users, "actor");
  return db
    .select({
      id: xpEvents.id,
      amount: xpEvents.amount,
      ruleKey: xpEvents.ruleKey,
      reason: xpEvents.reason,
      createdAt: xpEvents.createdAt,
      label: xpRules.label,
      username: users.username,
      displayName: users.displayName,
      actorName: actor.displayName,
    })
    .from(xpEvents)
    .innerJoin(users, eq(xpEvents.userId, users.id))
    .leftJoin(xpRules, eq(xpEvents.ruleKey, xpRules.key))
    .leftJoin(actor, eq(xpEvents.actorId, actor.id))
    .where(userId ? eq(xpEvents.userId, userId) : undefined)
    .orderBy(desc(xpEvents.createdAt))
    .limit(limit);
}

export async function listAuditLogs(limit: number) {
  return db
    .select({
      id: auditLogs.id,
      summary: auditLogs.summary,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
      actorName: users.displayName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function listAllCategories() {
  return db
    .select({
      id: forumCategories.id,
      slug: forumCategories.slug,
      name: forumCategories.name,
      description: forumCategories.description,
      sortOrder: forumCategories.sortOrder,
      visibility: forumCategories.visibility,
      topicCount: sql<number>`(SELECT COUNT(*) FROM topics t WHERE t.category_id = "forum_categories"."id" AND t.deleted_at IS NULL)`,
    })
    .from(forumCategories)
    .orderBy(asc(forumCategories.sortOrder));
}

export async function listAllAnnouncements() {
  return db.select().from(announcements).orderBy(desc(announcements.publishedAt));
}

export async function listAllEvents() {
  return db.select().from(events).orderBy(desc(events.startsAt));
}

export async function getEventById(id: string) {
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ?? null;
}

export async function rankMemberCounts() {
  const rows = await db
    .select({ rankId: users.rankId, n: count() })
    .from(users)
    .groupBy(users.rankId);
  return new Map(rows.map((r) => [r.rankId, r.n]));
}
