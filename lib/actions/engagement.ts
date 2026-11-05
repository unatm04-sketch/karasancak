"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { eventAttendees, events, matches, notifications, predictions, users } from "@/lib/db/schema";
import { pushToast, pushToasts } from "@/lib/flash";
import { failure, type FormState } from "@/lib/form-state";
import { istanbulDay, previousDay } from "@/lib/format";
import { evaluateAchievements } from "@/lib/xp/achievements";
import { awardXp, awardsToToasts } from "@/lib/xp/award";

/** Günlük yoklama: seri takibi ve seri bonusu burada işlenir. */
export async function dailyCheckIn(): Promise<void> {
  const me = await requireUser();
  const today = istanbulDay(Date.now());
  if (me.lastCheckInDay === today) {
    await pushToast({ kind: "info", message: "Bugünkü yoklaman alındı. Yarın yine bekleriz." });
    return;
  }

  const streak = me.lastCheckInDay === previousDay(today) ? me.streak + 1 : 1;
  const [row] = await db
    .select({ bestStreak: users.bestStreak })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);

  await db
    .update(users)
    .set({
      streak,
      bestStreak: Math.max(streak, row?.bestStreak ?? 0),
      lastCheckInDay: today,
    })
    .where(eq(users.id, me.id));

  const awards = [
    await awardXp(me.id, "daily_checkin", { dedupeKey: `checkin:${me.id}:${today}` }),
  ];
  // Her 7 ve 30 günde bir tekrar eden seri bonusu
  if (streak % 7 === 0) {
    awards.push(await awardXp(me.id, "streak_7", { dedupeKey: `streak7:${me.id}:${today}` }));
  }
  if (streak % 30 === 0) {
    awards.push(await awardXp(me.id, "streak_30", { dedupeKey: `streak30:${me.id}:${today}` }));
  }
  awards.push(...(await evaluateAchievements(me.id, "checkin")));
  await pushToasts(awardsToToasts(awards));
  revalidatePath("/", "layout");
}

/** Panelden referans linki paylaşıldığında. Günde bir kez ödül verir. */
export async function recordReferralShare(): Promise<void> {
  const me = await requireUser();
  const today = istanbulDay(Date.now());
  const award = await awardXp(me.id, "referral_share", {
    dedupeKey: `referral_share:${me.id}:${today}`,
  });
  await pushToasts(awardsToToasts([award]));
  if (award) revalidatePath("/panel");
}

/* ------------------------------ Etkinlik ----------------------------- */

export async function rsvpEvent(eventId: string): Promise<void> {
  const me = await requireUser();
  const [event] = await db
    .select({ id: events.id, startsAt: events.startsAt, published: events.published })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event || !event.published) return;

  const inserted = await db
    .insert(eventAttendees)
    .values({ eventId, userId: me.id, rsvpAt: Date.now() })
    .onConflictDoNothing()
    .returning({ eventId: eventAttendees.eventId });
  if (inserted.length > 0) {
    const award = await awardXp(me.id, "event_rsvp", { dedupeKey: `event_rsvp:${eventId}:${me.id}` });
    await pushToasts(awardsToToasts([award]));
  }
  revalidatePath("/", "layout");
}

export async function cancelRsvp(eventId: string): Promise<void> {
  const me = await requireUser();
  // Yoklaması alınmış katılım geri alınamaz.
  await db
    .delete(eventAttendees)
    .where(
      and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, me.id),
        isNull(eventAttendees.attendedAt),
      ),
    );
  revalidatePath("/", "layout");
}

/* ------------------------------- Tahmin ------------------------------ */

const ScoreSchema = z.coerce.number().int().min(0).max(30);

export async function submitPrediction(
  matchId: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireUser();
  const home = ScoreSchema.safeParse(formData.get("home"));
  const away = ScoreSchema.safeParse(formData.get("away"));
  if (!home.success || !away.success) return failure("Skoru 0 ile 30 arasında gir.");

  const [match] = await db
    .select({ kickoffAt: matches.kickoffAt, status: matches.status })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!match) return failure("Maç bulunamadı.");
  const now = Date.now();
  if (match.status !== "scheduled" || match.kickoffAt <= now) {
    return failure("Maç başladı, tahminler kapandı.");
  }

  await db
    .insert(predictions)
    .values({
      matchId,
      userId: me.id,
      homeScore: home.data,
      awayScore: away.data,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [predictions.matchId, predictions.userId],
      set: { homeScore: home.data, awayScore: away.data, updatedAt: now },
    });

  const award = await awardXp(me.id, "match_prediction", {
    dedupeKey: `prediction:${matchId}:${me.id}`,
  });
  await pushToasts(
    award ? awardsToToasts([award]) : [{ kind: "info", message: "Tahminin güncellendi." }],
  );
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------ Bildirim ----------------------------- */

export async function markAllNotificationsRead(): Promise<void> {
  const me = await requireUser();
  await db
    .update(notifications)
    .set({ readAt: Date.now() })
    .where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));
  revalidatePath("/", "layout");
}
