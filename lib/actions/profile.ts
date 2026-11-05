"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyUserSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { avatars, users } from "@/lib/db/schema";
import { pushToast, pushToasts } from "@/lib/flash";
import { failure, fieldFailure, fromZodError, type FormState } from "@/lib/form-state";
import { consumeRateLimit } from "@/lib/rate-limit";
import { formToObject, instagramSchema, optionalText, passwordSchema } from "@/lib/validation";
import { awardXp, awardsToToasts } from "@/lib/xp/award";

const ProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Adın en az 2 karakter olmalı.").max(60, "En fazla 60 karakter."),
  bio: optionalText(400),
  city: optionalText(40),
  tribune: optionalText(40),
  instagram: instagramSchema,
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = ProfileSchema.safeParse(
    formToObject(formData, ["displayName", "bio", "city", "tribune", "instagram"]),
  );
  if (!parsed.success) return fromZodError(parsed.error);

  await db.update(users).set(parsed.data).where(eq(users.id, me.id));

  const complete = parsed.data.bio && parsed.data.city && parsed.data.tribune;
  const award = complete
    ? await awardXp(me.id, "profile_completed", { dedupeKey: `profile_completed:${me.id}` })
    : null;
  await pushToasts(
    award ? awardsToToasts([award]) : [{ kind: "info", message: "Profilin güncellendi." }],
  );
  revalidatePath("/", "layout");
  return { ok: true };
}

const PasswordSchema = z
  .object({
    current: z.string().min(1, "Mevcut şifreni yaz."),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "Şifreler aynı değil.",
    path: ["passwordConfirm"],
  });

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = PasswordSchema.safeParse(
    formToObject(formData, ["current", "password", "passwordConfirm"]),
  );
  if (!parsed.success) return fromZodError(parsed.error);

  if (!(await consumeRateLimit(`password:${me.id}`, 6, 15 * 60 * 1000))) {
    return failure("Çok fazla deneme yaptın. Biraz sonra tekrar dene.");
  }

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);
  if (!(await verifyPassword(parsed.data.current, row?.passwordHash ?? null))) {
    return fieldFailure("current", "Mevcut şifren hatalı.");
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.password) })
    .where(eq(users.id, me.id));
  // Diğer cihazlardaki oturumlar kapanır, bu cihaz açık kalır.
  await destroyUserSessions(me.id);
  await createSession(me.id);
  await pushToast({ kind: "info", message: "Şifren değişti. Diğer cihazlardan çıkış yapıldı." });
  return { ok: true };
}

const MAX_AVATAR_BYTES = 256 * 1024;

/** Dosyanın gerçek türünü ilk baytlarından anlar. Tarayıcının bildirdiği türe güvenilmez. */
function sniffImageMime(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.subarray(0, 4).toString("latin1") === "RIFF" && buffer.subarray(8, 12).toString("latin1") === "WEBP") {
    return "image/webp";
  }
  return null;
}

/** Görsel tarayıcıda küçültülüp gönderilir (bkz. AvatarUploader). */
export async function uploadAvatar(formData: FormData): Promise<{ error?: string }> {
  const me = await requireUser();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Görsel seçilmedi." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Görsel çok büyük." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageMime(buffer);
  if (!mime) return { error: "Yalnızca JPEG, PNG veya WebP yükleyebilirsin." };

  const now = Date.now();
  await db.batch([
    db
      .insert(avatars)
      .values({ userId: me.id, mime, data: buffer, updatedAt: now })
      .onConflictDoUpdate({
        target: avatars.userId,
        set: { mime, data: buffer, updatedAt: now },
      }),
    db
      .update(users)
      .set({ avatarVersion: sql`${users.avatarVersion} + 1` })
      .where(eq(users.id, me.id)),
  ]);
  await pushToast({ kind: "info", message: "Profil görselin güncellendi." });
  revalidatePath("/", "layout");
  return {};
}

export async function removeAvatar(): Promise<void> {
  const me = await requireUser();
  await db.batch([
    db.delete(avatars).where(eq(avatars.userId, me.id)),
    db.update(users).set({ avatarVersion: 0 }).where(eq(users.id, me.id)),
  ]);
  revalidatePath("/", "layout");
}
