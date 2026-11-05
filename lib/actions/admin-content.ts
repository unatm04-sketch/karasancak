"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { requireAdmin, requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  announcements,
  eventAttendees,
  events,
  forumCategories,
  matches,
  predictions,
} from "@/lib/db/schema";
import { pushToast } from "@/lib/flash";
import { failure, fieldFailure, fromZodError, type FormState } from "@/lib/form-state";
import { parseLocalDateTime, slugify } from "@/lib/format";
import { newId, newSlugSuffix } from "@/lib/ids";
import { notify } from "@/lib/notifications";
import { formToObject } from "@/lib/validation";
import { evaluateAchievements } from "@/lib/xp/achievements";
import { awardXp, undoAward } from "@/lib/xp/award";

const invalidate = () => revalidatePath("/", "layout");

/* ----------------------------- Kategoriler --------------------------- */

const CategorySchema = z.object({
  name: z.string().trim().min(2, "Kategori adı yaz.").max(60, "En fazla 60 karakter."),
  description: z.string().trim().max(240, "En fazla 240 karakter."),
  sortOrder: z.coerce.number({ message: "Sıra numarası yaz." }).int().min(0).max(1000),
  visibility: z.enum(["public", "members"]),
});

export async function createCategory(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = CategorySchema.safeParse(
    formToObject(formData, ["name", "description", "sortOrder", "visibility"]),
  );
  if (!parsed.success) return fromZodError(parsed.error);

  const slug = slugify(parsed.data.name);
  if (!slug) return fieldFailure("name", "Bu addan adres üretilemedi.");
  // /forum/konu, /forum/yeni ve /forum/duzenle sayfa adresleridir.
  if (["konu", "yeni", "duzenle"].includes(slug)) {
    return fieldFailure("name", "Bu ad kategori olarak kullanılamaz.");
  }
  const [taken] = await db
    .select({ id: forumCategories.id })
    .from(forumCategories)
    .where(eq(forumCategories.slug, slug))
    .limit(1);
  if (taken) return fieldFailure("name", "Bu adda bir kategori var.");

  await db.insert(forumCategories).values({
    id: newId(),
    slug,
    ...parsed.data,
    createdAt: Date.now(),
  });
  await logAudit(admin.id, "category.create", `${parsed.data.name} kategorisi eklendi`);
  invalidate();
  return { ok: true, message: "Kategori eklendi." };
}

export async function updateCategory(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = CategorySchema.safeParse(
    formToObject(formData, ["name", "description", "sortOrder", "visibility"]),
  );
  if (!parsed.success) return fromZodError(parsed.error);
  // Adres (slug) değişmez: paylaşılmış linkler kırılmasın.
  await db.update(forumCategories).set(parsed.data).where(eq(forumCategories.id, id));
  await logAudit(admin.id, "category.update", `${parsed.data.name} kategorisi güncellendi`);
  await pushToast({ kind: "info", message: "Kategori güncellendi." });
  invalidate();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<void> {
  const admin = await requireAdmin();
  const [row] = await db
    .delete(forumCategories)
    .where(eq(forumCategories.id, id))
    .returning({ name: forumCategories.name });
  if (row) await logAudit(admin.id, "category.delete", `${row.name} kategorisi ve konuları silindi`);
  invalidate();
}

/* ------------------------------ Duyurular ---------------------------- */

const AnnouncementSchema = z.object({
  kicker: z.string().trim().min(2, "Üst başlık yaz.").max(40, "En fazla 40 karakter."),
  title: z.string().trim().min(3, "Başlık yaz.").max(120, "En fazla 120 karakter."),
  body: z.string().trim().min(5, "Metni yaz.").max(2000, "En fazla 2000 karakter."),
  pinned: z.string().transform((v) => v === "on"),
  published: z.string().transform((v) => v === "on"),
});

const announcementFields = ["kicker", "title", "body", "pinned", "published"] as const;

export async function createAnnouncement(_: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = AnnouncementSchema.safeParse(formToObject(formData, announcementFields));
  if (!parsed.success) return fromZodError(parsed.error);
  const now = Date.now();
  await db.insert(announcements).values({
    id: newId(),
    ...parsed.data,
    publishedAt: now,
    createdById: staff.id,
    createdAt: now,
  });
  await logAudit(staff.id, "announcement.create", `Duyuru: ${parsed.data.title}`);
  invalidate();
  return { ok: true, message: "Duyuru yayınlandı." };
}

export async function updateAnnouncement(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = AnnouncementSchema.safeParse(formToObject(formData, announcementFields));
  if (!parsed.success) return fromZodError(parsed.error);
  await db.update(announcements).set(parsed.data).where(eq(announcements.id, id));
  await logAudit(staff.id, "announcement.update", `Duyuru güncellendi: ${parsed.data.title}`);
  await pushToast({ kind: "info", message: "Duyuru güncellendi." });
  invalidate();
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const staff = await requireStaff();
  const [row] = await db
    .delete(announcements)
    .where(eq(announcements.id, id))
    .returning({ title: announcements.title });
  if (row) await logAudit(staff.id, "announcement.delete", `Duyuru silindi: ${row.title}`);
  invalidate();
}

/* ----------------------------- Etkinlikler --------------------------- */

const EventSchema = z.object({
  title: z.string().trim().min(3, "Başlık yaz.").max(120, "En fazla 120 karakter."),
  description: z.string().trim().max(3000, "En fazla 3000 karakter."),
  location: z.string().trim().min(2, "Yer yaz.").max(160, "En fazla 160 karakter."),
  city: z.string().trim().max(40, "En fazla 40 karakter."),
  startsAt: z.string().min(1, "Tarih seç."),
  timeAnnounced: z.string().transform((v) => v === "on"),
  xpReward: z.coerce.number({ message: "Bir sayı yaz." }).int().min(0).max(100_000),
  published: z.string().transform((v) => v === "on"),
});

const eventFields = [
  "title",
  "description",
  "location",
  "city",
  "startsAt",
  "timeAnnounced",
  "xpReward",
  "published",
] as const;

export async function createEvent(_: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = EventSchema.safeParse(formToObject(formData, eventFields));
  if (!parsed.success) return fromZodError(parsed.error);
  const startsAt = parseLocalDateTime(parsed.data.startsAt);
  if (startsAt === null) return fieldFailure("startsAt", "Geçerli bir tarih seç.");

  const id = newId();
  await db.insert(events).values({
    id,
    slug: `${slugify(parsed.data.title) || "etkinlik"}-${newSlugSuffix()}`,
    ...parsed.data,
    city: parsed.data.city || null,
    startsAt,
    createdById: staff.id,
    createdAt: Date.now(),
  });
  await logAudit(staff.id, "event.create", `Etkinlik: ${parsed.data.title}`, { type: "event", id });
  invalidate();
  redirect(`/yonetim/etkinlikler/${id}`);
}

export async function updateEvent(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = EventSchema.safeParse(formToObject(formData, eventFields));
  if (!parsed.success) return fromZodError(parsed.error);
  const startsAt = parseLocalDateTime(parsed.data.startsAt);
  if (startsAt === null) return fieldFailure("startsAt", "Geçerli bir tarih seç.");

  await db
    .update(events)
    .set({ ...parsed.data, city: parsed.data.city || null, startsAt })
    .where(eq(events.id, id));
  await logAudit(staff.id, "event.update", `Etkinlik güncellendi: ${parsed.data.title}`, {
    type: "event",
    id,
  });
  await pushToast({ kind: "info", message: "Etkinlik güncellendi." });
  invalidate();
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<void> {
  const staff = await requireStaff();
  const [row] = await db.delete(events).where(eq(events.id, id)).returning({ title: events.title });
  if (row) await logAudit(staff.id, "event.delete", `Etkinlik silindi: ${row.title}`);
  invalidate();
  redirect("/yonetim/etkinlikler");
}

/** Sahada yoklama: katılımı onaylanan üye etkinliğin XP ödülünü alır. */
export async function setAttendance(eventId: string, userId: string, attended: boolean): Promise<void> {
  await requireStaff();
  const [event] = await db
    .select({ title: events.title, slug: events.slug, xpReward: events.xpReward })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) return;

  if (attended) {
    const updated = await db
      .update(eventAttendees)
      .set({ attendedAt: Date.now() })
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, userId),
          isNull(eventAttendees.attendedAt),
        ),
      )
      .returning({ userId: eventAttendees.userId });
    if (updated.length === 0) return;

    const award = await awardXp(userId, "event_attended", {
      amount: event.xpReward,
      reason: event.title,
      dedupeKey: `event_attended:${eventId}:${userId}`,
    });
    await evaluateAchievements(userId, "event");
    if (award) {
      await notify(userId, {
        type: "event",
        title: `Yoklaman alındı: +${award.amount} XP`,
        body: event.title,
        href: `/etkinlikler/${event.slug}`,
      });
    }
  } else {
    const updated = await db
      .update(eventAttendees)
      .set({ attendedAt: null })
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, userId),
          isNotNull(eventAttendees.attendedAt),
        ),
      )
      .returning({ userId: eventAttendees.userId });
    // Yanlışlıkla alınan yoklama geri alınırsa ödül de geri alınır, tekrar işaretlenebilir.
    if (updated.length > 0) await undoAward(userId, `event_attended:${eventId}:${userId}`);
  }
  invalidate();
}

/* -------------------------------- Maçlar ----------------------------- */

const MatchSchema = z.object({
  competition: z.string().trim().min(2, "Organizasyon yaz.").max(60, "En fazla 60 karakter."),
  homeTeam: z.string().trim().min(2, "Ev sahibi yaz.").max(40, "En fazla 40 karakter."),
  awayTeam: z.string().trim().min(2, "Deplasman takımı yaz.").max(40, "En fazla 40 karakter."),
  venue: z.string().trim().max(80, "En fazla 80 karakter."),
  kickoffAt: z.string().min(1, "Tarih seç."),
});

export async function createMatch(_: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = MatchSchema.safeParse(
    formToObject(formData, ["competition", "homeTeam", "awayTeam", "venue", "kickoffAt"]),
  );
  if (!parsed.success) return fromZodError(parsed.error);
  const kickoffAt = parseLocalDateTime(parsed.data.kickoffAt);
  if (kickoffAt === null) return fieldFailure("kickoffAt", "Geçerli bir tarih seç.");

  await db.insert(matches).values({
    id: newId(),
    ...parsed.data,
    kickoffAt,
    createdAt: Date.now(),
  });
  await logAudit(staff.id, "match.create", `Maç: ${parsed.data.homeTeam} - ${parsed.data.awayTeam}`);
  invalidate();
  return { ok: true, message: "Maç eklendi." };
}

export async function deleteMatch(id: string): Promise<void> {
  const staff = await requireStaff();
  const [row] = await db
    .delete(matches)
    .where(eq(matches.id, id))
    .returning({ home: matches.homeTeam, away: matches.awayTeam });
  if (row) await logAudit(staff.id, "match.delete", `Maç silindi: ${row.home} - ${row.away}`);
  invalidate();
}

const outcomeOf = (home: number, away: number) => Math.sign(home - away);

const ResultSchema = z.object({
  home: z.coerce.number({ message: "Skor gir." }).int().min(0).max(30),
  away: z.coerce.number({ message: "Skor gir." }).int().min(0).max(30),
});

/** Sonucu işler ve tutan tahminlere XP dağıtır. Tekrar çalıştırılırsa çift ödül vermez. */
export async function settleMatch(matchId: string, _: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = ResultSchema.safeParse(formToObject(formData, ["home", "away"]));
  if (!parsed.success) return fromZodError(parsed.error);

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) return failure("Maç bulunamadı.");
  if (match.status === "finished") return failure("Bu maçın sonucu daha önce işlendi.");

  const { home, away } = parsed.data;
  await db
    .update(matches)
    .set({ homeScore: home, awayScore: away, status: "finished", settledAt: Date.now() })
    .where(eq(matches.id, matchId));

  const rows = await db.select().from(predictions).where(eq(predictions.matchId, matchId));
  const score = `${match.homeTeam} ${home}-${away} ${match.awayTeam}`;
  let winners = 0;

  for (const p of rows) {
    const exact = p.homeScore === home && p.awayScore === away;
    const outcome = outcomeOf(p.homeScore, p.awayScore) === outcomeOf(home, away);
    let awarded = 0;
    if (exact) {
      const award = await awardXp(p.userId, "prediction_exact", {
        dedupeKey: `prediction_exact:${matchId}:${p.userId}`,
        reason: score,
      });
      awarded = award?.amount ?? 0;
    } else if (outcome) {
      const award = await awardXp(p.userId, "prediction_outcome", {
        dedupeKey: `prediction_outcome:${matchId}:${p.userId}`,
        reason: score,
      });
      awarded = award?.amount ?? 0;
    }
    await db
      .update(predictions)
      .set({ awardedXp: awarded })
      .where(and(eq(predictions.matchId, matchId), eq(predictions.userId, p.userId)));
    if (awarded > 0) {
      winners += 1;
      await notify(p.userId, {
        type: "match",
        title: exact ? `Skoru tam bildin: +${awarded} XP` : `Tahminin tuttu: +${awarded} XP`,
        body: score,
        href: "/maclar",
      });
      if (exact) await evaluateAchievements(p.userId, "prediction");
    }
  }

  await logAudit(staff.id, "match.settle", `${score} işlendi, ${winners} tahmin tuttu`);
  await pushToast({ kind: "info", message: `Sonuç işlendi. ${winners} tahmin tuttu.` });
  invalidate();
  return { ok: true };
}
