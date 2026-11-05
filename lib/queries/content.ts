import "server-only";
import { and, asc, count, desc, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  announcements,
  applications,
  eventAttendees,
  events,
  matches,
  posts,
  predictions,
  ranks,
  topics,
  users,
} from "@/lib/db/schema";
import { authorColumns } from "./forum";

/* ---------------------------- Duyurular ---------------------------- */

export async function listAnnouncements(limit: number) {
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.published, true))
    .orderBy(desc(announcements.pinned), desc(announcements.publishedAt))
    .limit(limit);
}

/* ---------------------------- Etkinlikler -------------------------- */

const eventColumns = {
  id: events.id,
  slug: events.slug,
  title: events.title,
  description: events.description,
  location: events.location,
  city: events.city,
  startsAt: events.startsAt,
  timeAnnounced: events.timeAnnounced,
  xpReward: events.xpReward,
  published: events.published,
  goingCount: sql<number>`(SELECT COUNT(*) FROM event_attendees a WHERE a.event_id = "events"."id")`,
};

/** Saati açıklanmamış etkinlik, o günün sonuna kadar "yaklaşan" sayılır. */
const EVENT_GRACE_MS = 18 * 60 * 60 * 1000;

export async function listUpcomingEvents(limit: number, now: number) {
  return db
    .select(eventColumns)
    .from(events)
    .where(and(eq(events.published, true), gte(events.startsAt, now - EVENT_GRACE_MS)))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

export async function listPastEvents(limit: number, now: number) {
  return db
    .select(eventColumns)
    .from(events)
    .where(and(eq(events.published, true), lt(events.startsAt, now - EVENT_GRACE_MS)))
    .orderBy(desc(events.startsAt))
    .limit(limit);
}

export async function getEventBySlug(slug: string) {
  const [row] = await db.select(eventColumns).from(events).where(eq(events.slug, slug)).limit(1);
  return row ?? null;
}

export async function getUserRsvp(eventId: string, userId: string) {
  const [row] = await db
    .select()
    .from(eventAttendees)
    .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function listEventAttendees(eventId: string) {
  return db
    .select({
      ...authorColumns,
      rsvpAt: eventAttendees.rsvpAt,
      attendedAt: eventAttendees.attendedAt,
    })
    .from(eventAttendees)
    .innerJoin(users, eq(eventAttendees.userId, users.id))
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .where(eq(eventAttendees.eventId, eventId))
    .orderBy(desc(users.xp));
}

/* ------------------------------ Maçlar ----------------------------- */

export async function getNextMatch(now: number) {
  const [row] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.status, "scheduled"), gte(matches.kickoffAt, now)))
    .orderBy(asc(matches.kickoffAt))
    .limit(1);
  return row ?? null;
}

export async function getLastResult() {
  const [row] = await db
    .select()
    .from(matches)
    .where(eq(matches.status, "finished"))
    .orderBy(desc(matches.kickoffAt))
    .limit(1);
  return row ?? null;
}

export async function listScheduledMatches() {
  return db
    .select({
      id: matches.id,
      competition: matches.competition,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      venue: matches.venue,
      kickoffAt: matches.kickoffAt,
      predictionCount: sql<number>`(SELECT COUNT(*) FROM predictions p WHERE p.match_id = "matches"."id")`,
    })
    .from(matches)
    .where(eq(matches.status, "scheduled"))
    .orderBy(asc(matches.kickoffAt));
}

export async function listFinishedMatches(limit: number) {
  return db
    .select()
    .from(matches)
    .where(eq(matches.status, "finished"))
    .orderBy(desc(matches.kickoffAt))
    .limit(limit);
}

export async function getUserPredictions(userId: string) {
  const rows = await db.select().from(predictions).where(eq(predictions.userId, userId));
  return new Map(rows.map((r) => [r.matchId, r]));
}

/** En çok tahmin XP'si toplayanlar */
export async function predictionLeaderboard(limit: number) {
  const total = sql<number>`COALESCE(SUM(${predictions.awardedXp}), 0)`;
  const rows = await db
    .select({ ...authorColumns, total })
    .from(predictions)
    .innerJoin(users, eq(predictions.userId, users.id))
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .where(and(isNotNull(predictions.awardedXp), eq(users.status, "active")))
    .groupBy(users.id)
    .having(sql`COALESCE(SUM(${predictions.awardedXp}), 0) > 0`)
    .orderBy(desc(total))
    .limit(limit);
  return rows.map((r) => ({ ...r, total: Number(r.total) }));
}

/* ---------------------------- Genel sayılar ------------------------ */

export async function getCommunityStats() {
  const [members, topicCount, postCount, eventCount] = await Promise.all([
    db.select({ n: count() }).from(users).where(eq(users.status, "active")),
    db.select({ n: count() }).from(topics).where(isNull(topics.deletedAt)),
    db.select({ n: count() }).from(posts).where(isNull(posts.deletedAt)),
    db.select({ n: count() }).from(events).where(eq(events.published, true)),
  ]);
  return {
    members: members[0]?.n ?? 0,
    topics: topicCount[0]?.n ?? 0,
    posts: postCount[0]?.n ?? 0,
    events: eventCount[0]?.n ?? 0,
  };
}

export async function pendingApplicationCount() {
  const [row] = await db
    .select({ n: count() })
    .from(applications)
    .where(eq(applications.status, "pending"));
  return row?.n ?? 0;
}
