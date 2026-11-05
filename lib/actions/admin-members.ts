"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, ne, or } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { destroyUserSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applications, passwordTokens, ranks, users, USER_ROLES, xpRules } from "@/lib/db/schema";
import { pushToast } from "@/lib/flash";
import { failure, fieldFailure, fromZodError, type FormState } from "@/lib/form-state";
import { newId, newReferralCode, newToken, sha256 } from "@/lib/ids";
import { notify } from "@/lib/notifications";
import { getBaseUrl } from "@/lib/request";
import {
  emailSchema,
  formToObject,
  optionalText,
  usernameSchema,
} from "@/lib/validation";
import { evaluateAchievements } from "@/lib/xp/achievements";
import { adjustXp, awardXp } from "@/lib/xp/award";

const ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const invalidate = () => revalidatePath("/", "layout");

async function resolveRank(rankId: string | null | undefined): Promise<string | null> {
  if (rankId) {
    const [rank] = await db.select({ id: ranks.id }).from(ranks).where(eq(ranks.id, rankId)).limit(1);
    if (rank) return rank.id;
  }
  const [fallback] = await db
    .select({ id: ranks.id })
    .from(ranks)
    .where(eq(ranks.isDefault, true))
    .limit(1);
  return fallback?.id ?? null;
}

/* ----------------------------- Başvurular ---------------------------- */

const ApproveSchema = z.object({
  rankId: z.string().min(1, "Rütbe seç."),
  role: z.enum(USER_ROLES),
  note: optionalText(500),
});

export async function approveApplication(
  applicationId: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = ApproveSchema.safeParse(formToObject(formData, ["rankId", "role", "note"]));
  if (!parsed.success) return fromZodError(parsed.error);

  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (!application) return failure("Başvuru bulunamadı.");
  if (application.status !== "pending") return failure("Bu başvuru zaten sonuçlanmış.");

  const [conflict] = await db
    .select({ username: users.username })
    .from(users)
    .where(or(eq(users.username, application.username), eq(users.email, application.email)))
    .limit(1);
  if (conflict) {
    return failure(
      conflict.username === application.username
        ? "Bu kullanıcı adı başvurudan sonra başka bir üyeye verilmiş."
        : "Bu e-posta başvurudan sonra başka bir üyelikte kullanılmış.",
    );
  }

  const rankId = await resolveRank(parsed.data.rankId);
  const now = Date.now();
  const userId = newId();

  await db.batch([
    db.insert(users).values({
      id: userId,
      username: application.username,
      displayName: application.fullName,
      email: application.email,
      phone: application.phone,
      passwordHash: application.passwordHash,
      role: parsed.data.role,
      rankId,
      city: application.city,
      tribune: application.tribune,
      instagram: application.instagram,
      referralCode: newReferralCode(),
      referredById: application.referrerId,
      createdAt: now,
    }),
    db
      .update(applications)
      .set({
        status: "approved",
        reviewedById: admin.id,
        reviewedAt: now,
        reviewNote: parsed.data.note,
        createdUserId: userId,
      })
      .where(and(eq(applications.id, applicationId), eq(applications.status, "pending"))),
  ]);

  await awardXp(userId, "welcome", { dedupeKey: `welcome:${userId}` });
  await notify(userId, {
    type: "application",
    title: "Sürüye hoş geldin",
    body: "Başvurun onaylandı. Yoklamanı verip ilk XP'lerini kazanmaya başla.",
    href: "/panel",
  });

  if (application.referrerId) {
    const award = await awardXp(application.referrerId, "referral_approved", {
      dedupeKey: `referral_approved:${userId}`,
      reason: application.username,
    });
    await evaluateAchievements(application.referrerId, "referral");
    if (award) {
      await notify(application.referrerId, {
        type: "referral",
        title: "Davetin sürüye katıldı",
        body: `${application.fullName} onaylandı. +${award.amount} XP senin.`,
        href: "/panel#referans",
      });
    }
  }

  await logAudit(admin.id, "application.approve", `${application.fullName} başvurusu onaylandı`, {
    type: "user",
    id: userId,
  });
  await pushToast({ kind: "info", message: `${application.fullName} sürüye katıldı.` });
  invalidate();
  redirect("/yonetim/basvurular");
}

export async function rejectApplication(
  applicationId: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  const rows = await db
    .update(applications)
    .set({
      status: "rejected",
      reviewNote: note || null,
      reviewedById: admin.id,
      reviewedAt: Date.now(),
    })
    .where(and(eq(applications.id, applicationId), eq(applications.status, "pending")))
    .returning({ fullName: applications.fullName });
  if (rows.length === 0) return failure("Bu başvuru zaten sonuçlanmış.");

  await logAudit(admin.id, "application.reject", `${rows[0]!.fullName} başvurusu reddedildi`, {
    type: "application",
    id: applicationId,
  });
  await pushToast({ kind: "info", message: "Başvuru reddedildi." });
  invalidate();
  redirect("/yonetim/basvurular");
}

/* ------------------------------- Üyeler ------------------------------ */

async function issuePasswordLink(
  userId: string,
  purpose: "activation" | "reset",
  actorId: string,
): Promise<string> {
  const token = newToken();
  const now = Date.now();
  await db.insert(passwordTokens).values({
    id: sha256(token),
    userId,
    purpose,
    expiresAt: now + ACTIVATION_TTL_MS,
    createdById: actorId,
    createdAt: now,
  });
  return `${await getBaseUrl()}/aktivasyon/${token}`;
}

const CreateMemberSchema = z.object({
  displayName: z.string().trim().min(2, "Ad soyad yaz.").max(60, "En fazla 60 karakter."),
  username: usernameSchema,
  email: z.union([z.literal(""), emailSchema]).transform((v) => (v === "" ? null : v)),
  phone: optionalText(24),
  city: optionalText(40),
  rankId: z.string().min(1, "Rütbe seç."),
  role: z.enum(USER_ROLES),
  xp: z.coerce.number().int().min(0, "Eksi olamaz.").max(1_000_000, "Çok yüksek."),
});

/** Yönetimin doğrudan üye tanımlaması. Üye şifresini tek kullanımlık linkle kendi belirler. */
export async function createMember(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = CreateMemberSchema.safeParse(
    formToObject(formData, ["displayName", "username", "email", "phone", "city", "rankId", "role", "xp"]),
  );
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;

  const [taken] = await db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(
      data.email
        ? or(eq(users.username, data.username), eq(users.email, data.email))
        : eq(users.username, data.username),
    )
    .limit(1);
  if (taken) {
    return taken.username === data.username
      ? fieldFailure("username", "Bu kullanıcı adı alınmış.")
      : fieldFailure("email", "Bu e-posta başka bir üyede kayıtlı.");
  }

  const id = newId();
  await db.insert(users).values({
    id,
    username: data.username,
    displayName: data.displayName,
    email: data.email,
    phone: data.phone,
    city: data.city,
    role: data.role,
    rankId: await resolveRank(data.rankId),
    referralCode: newReferralCode(),
    createdAt: Date.now(),
  });

  await awardXp(id, "welcome", { dedupeKey: `welcome:${id}` });
  if (data.xp > 0) await adjustXp(id, data.xp, "Başlangıç XP'si", admin.id);

  const link = await issuePasswordLink(id, "activation", admin.id);
  await logAudit(admin.id, "member.create", `${data.displayName} üye olarak tanımlandı`, {
    type: "user",
    id,
  });
  invalidate();
  return {
    ok: true,
    message: `${data.displayName} tanımlandı. Aşağıdaki aktivasyon linkini üyeye ilet.`,
    data: { link, memberPath: `/yonetim/uyeler/${id}` },
  };
}

const UpdateMemberSchema = z.object({
  displayName: z.string().trim().min(2, "Ad soyad yaz.").max(60, "En fazla 60 karakter."),
  email: z.union([z.literal(""), emailSchema]).transform((v) => (v === "" ? null : v)),
  phone: optionalText(24),
  city: optionalText(40),
  rankId: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(["active", "suspended"]),
});

async function adminCount() {
  const [row] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.status, "active")));
  return row?.n ?? 0;
}

export async function updateMember(
  userId: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = UpdateMemberSchema.safeParse(
    formToObject(formData, ["displayName", "email", "phone", "city", "rankId", "role", "status"]),
  );
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;

  const [current] = await db
    .select({
      role: users.role,
      status: users.status,
      rankId: users.rankId,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!current) return failure("Üye bulunamadı.");

  const losingAdmin =
    current.role === "admin" &&
    current.status === "active" &&
    (data.role !== "admin" || data.status !== "active");
  if (losingAdmin && (await adminCount()) <= 1) {
    return failure("Sistemde en az bir aktif yönetici kalmalı.");
  }
  if (userId === admin.id && data.status !== "active") {
    return failure("Kendi hesabını askıya alamazsın.");
  }

  if (data.email) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, data.email), ne(users.id, userId)))
      .limit(1);
    if (taken) return fieldFailure("email", "Bu e-posta başka bir üyede kayıtlı.");
  }

  const rankId = data.rankId || null;
  await db
    .update(users)
    .set({
      displayName: data.displayName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      rankId,
      role: data.role,
      status: data.status,
    })
    .where(eq(users.id, userId));

  if (data.status === "suspended" && current.status !== "suspended") {
    await destroyUserSessions(userId);
  }

  if (rankId && rankId !== current.rankId) {
    const [rank] = await db
      .select({ name: ranks.name })
      .from(ranks)
      .where(eq(ranks.id, rankId))
      .limit(1);
    if (rank) {
      await notify(userId, {
        type: "rank",
        title: `Rütben güncellendi: ${rank.name}`,
        body: "Yönetim sana yeni bir rütbe verdi. Kutlu olsun.",
        href: "/panel",
      });
      await logAudit(admin.id, "member.rank", `${data.displayName} rütbesi: ${rank.name}`, {
        type: "user",
        id: userId,
      });
    }
  } else {
    await logAudit(admin.id, "member.update", `${data.displayName} bilgileri güncellendi`, {
      type: "user",
      id: userId,
    });
  }

  await pushToast({ kind: "info", message: "Üye güncellendi." });
  invalidate();
  return { ok: true };
}

const AdjustXpSchema = z.object({
  amount: z.coerce
    .number({ message: "Bir sayı yaz." })
    .int("Tam sayı olmalı.")
    .min(-1_000_000)
    .max(1_000_000)
    .refine((v) => v !== 0, "Sıfır olamaz."),
  reason: z.string().trim().min(3, "Sebep yaz.").max(160, "En fazla 160 karakter."),
});

export async function adjustMemberXp(
  userId: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = AdjustXpSchema.safeParse(formToObject(formData, ["amount", "reason"]));
  if (!parsed.success) return fromZodError(parsed.error);

  const [member] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!member) return failure("Üye bulunamadı.");

  await adjustXp(userId, parsed.data.amount, parsed.data.reason, admin.id);
  const sign = parsed.data.amount > 0 ? "+" : "";
  await notify(userId, {
    type: "xp",
    title: `${sign}${parsed.data.amount} XP`,
    body: parsed.data.reason,
    href: "/panel",
  });
  await logAudit(
    admin.id,
    "member.xp",
    `${member.displayName}: ${sign}${parsed.data.amount} XP (${parsed.data.reason})`,
    { type: "user", id: userId },
  );
  await pushToast({ kind: "info", message: `${sign}${parsed.data.amount} XP işlendi.` });
  invalidate();
  return { ok: true };
}

/** E-posta altyapısı olmadığı için link yöneticiye gösterilir, o da üyeye iletir. */
export async function createPasswordLink(userId: string): Promise<FormState> {
  const admin = await requireAdmin();
  const [member] = await db
    .select({ displayName: users.displayName, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!member) return failure("Üye bulunamadı.");

  const purpose = member.passwordHash ? "reset" : "activation";
  const link = await issuePasswordLink(userId, purpose, admin.id);
  await logAudit(admin.id, "member.password_link", `${member.displayName} için şifre linki üretildi`, {
    type: "user",
    id: userId,
  });
  return {
    ok: true,
    message: "Link 7 gün geçerli ve tek kullanımlık. Üyeye güvenli bir kanaldan ilet.",
    data: { link },
  };
}

/* ------------------------------ Rütbeler ----------------------------- */

const RankSchema = z.object({
  name: z.string().trim().min(2, "Rütbe adı yaz.").max(40, "En fazla 40 karakter."),
  description: z.string().trim().max(200, "En fazla 200 karakter."),
  sortOrder: z.coerce.number({ message: "Sıra numarası yaz." }).int().min(0).max(1000),
});

export async function createRank(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = RankSchema.safeParse(formToObject(formData, ["name", "description", "sortOrder"]));
  if (!parsed.success) return fromZodError(parsed.error);
  const id = newId();
  await db.insert(ranks).values({ id, ...parsed.data, createdAt: Date.now() });
  await logAudit(admin.id, "rank.create", `${parsed.data.name} rütbesi eklendi`, { type: "rank", id });
  invalidate();
  return { ok: true, message: "Rütbe eklendi." };
}

export async function updateRank(rankId: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = RankSchema.safeParse(formToObject(formData, ["name", "description", "sortOrder"]));
  if (!parsed.success) return fromZodError(parsed.error);
  await db.update(ranks).set(parsed.data).where(eq(ranks.id, rankId));
  await logAudit(admin.id, "rank.update", `${parsed.data.name} rütbesi güncellendi`, {
    type: "rank",
    id: rankId,
  });
  await pushToast({ kind: "info", message: "Rütbe güncellendi." });
  invalidate();
  return { ok: true };
}

export async function setDefaultRank(rankId: string): Promise<void> {
  await requireAdmin();
  await db.batch([
    db.update(ranks).set({ isDefault: false }).where(eq(ranks.isDefault, true)),
    db.update(ranks).set({ isDefault: true }).where(eq(ranks.id, rankId)),
  ]);
  invalidate();
}

export async function deleteRank(rankId: string): Promise<void> {
  const admin = await requireAdmin();
  const [rank] = await db
    .select({ name: ranks.name, isDefault: ranks.isDefault })
    .from(ranks)
    .where(eq(ranks.id, rankId))
    .limit(1);
  if (!rank) return;
  if (rank.isDefault) {
    await pushToast({ kind: "error", message: "Varsayılan rütbe silinemez. Önce başka bir rütbeyi varsayılan yap." });
    return;
  }
  await db.batch([
    db.update(users).set({ rankId: null }).where(eq(users.rankId, rankId)),
    db.delete(ranks).where(eq(ranks.id, rankId)),
  ]);
  await logAudit(admin.id, "rank.delete", `${rank.name} rütbesi silindi`);
  invalidate();
}

/* ----------------------------- XP kuralları -------------------------- */

const XpRuleSchema = z.object({
  amount: z.coerce.number({ message: "Bir sayı yaz." }).int().min(0, "Eksi olamaz.").max(100_000),
  dailyCap: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 10_000), "1 veya üzeri bir sayı yaz."),
  active: z.string().transform((v) => v === "on"),
});

export async function updateXpRule(ruleKey: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = XpRuleSchema.safeParse(formToObject(formData, ["amount", "dailyCap", "active"]));
  if (!parsed.success) return fromZodError(parsed.error);
  const [rule] = await db
    .update(xpRules)
    .set(parsed.data)
    .where(eq(xpRules.key, ruleKey))
    .returning({ label: xpRules.label });
  if (!rule) return failure("Kural bulunamadı.");
  await logAudit(
    admin.id,
    "xp_rule.update",
    `${rule.label}: ${parsed.data.amount} XP, günlük ${parsed.data.dailyCap ?? "sınırsız"}`,
  );
  await pushToast({ kind: "info", message: `${rule.label} kuralı kaydedildi.` });
  invalidate();
  return { ok: true };
}
