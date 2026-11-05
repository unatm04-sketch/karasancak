"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { applications, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { failure, fieldFailure, fromZodError, type FormState } from "@/lib/form-state";
import { newId } from "@/lib/ids";
import { notify } from "@/lib/notifications";
import { findUserByReferralCode } from "@/lib/queries/members";
import { consumeRateLimit } from "@/lib/rate-limit";
import { REFERRAL_COOKIE } from "@/lib/referral";
import { getIpKey } from "@/lib/request";
import {
  emailSchema,
  formToObject,
  instagramSchema,
  optionalText,
  passwordSchema,
  usernameSchema,
} from "@/lib/validation";
import { awardXp } from "@/lib/xp/award";

const FIELDS = [
  "fullName",
  "username",
  "email",
  "phone",
  "city",
  "tribune",
  "instagram",
  "motivation",
  "password",
  "passwordConfirm",
  "kvkk",
  "website",
] as const;

const ApplicationSchema = z
  .object({
    fullName: z.string().trim().min(3, "Ad soyadını yaz.").max(80, "En fazla 80 karakter."),
    username: usernameSchema,
    email: emailSchema,
    phone: optionalText(24),
    city: z.string().trim().min(2, "Şehrini yaz.").max(40, "En fazla 40 karakter."),
    tribune: optionalText(40),
    instagram: instagramSchema,
    motivation: z
      .string()
      .trim()
      .min(30, "Bize biraz daha anlat: en az 30 karakter.")
      .max(1200, "En fazla 1200 karakter."),
    password: passwordSchema,
    passwordConfirm: z.string(),
    kvkk: z.literal("on", { message: "Devam etmek için aydınlatma metnini onaylamalısın." }),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "Şifreler aynı değil.",
    path: ["passwordConfirm"],
  });

export async function submitApplication(_: FormState, formData: FormData): Promise<FormState> {
  const raw = formToObject(formData, FIELDS);

  // Botlar görünmeyen alanı doldurur. Hata vermeden başarılı görünüp kaydetmiyoruz.
  if (raw.website) redirect("/basvuru/alindi");

  const parsed = ApplicationSchema.safeParse(raw);
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;

  const allowed = await consumeRateLimit(`apply:${await getIpKey()}`, 5, 24 * 60 * 60 * 1000);
  if (!allowed) return failure("Bugün bu bağlantıdan çok fazla başvuru yapıldı. Yarın tekrar dene.");

  const [taken] = await db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(or(eq(users.username, data.username), eq(users.email, data.email)))
    .limit(1);
  if (taken) {
    return taken.username === data.username
      ? fieldFailure("username", "Bu kullanıcı adı alınmış.")
      : fieldFailure("email", "Bu e-posta adresiyle zaten bir üyelik var.");
  }

  const [pending] = await db
    .select({ username: applications.username, email: applications.email })
    .from(applications)
    .where(
      and(
        eq(applications.status, "pending"),
        or(eq(applications.username, data.username), eq(applications.email, data.email)),
      ),
    )
    .limit(1);
  if (pending) {
    return pending.email === data.email
      ? fieldFailure("email", "Bu e-posta ile incelenmekte olan bir başvuru var.")
      : fieldFailure("username", "Bu kullanıcı adıyla incelenmekte olan bir başvuru var.");
  }

  const code = (await cookies()).get(REFERRAL_COOKIE)?.value;
  const referrer = code ? await findUserByReferralCode(code) : null;

  const id = newId();
  const now = Date.now();
  await db.insert(applications).values({
    id,
    fullName: data.fullName,
    username: data.username,
    email: data.email,
    phone: data.phone,
    city: data.city,
    tribune: data.tribune,
    instagram: data.instagram,
    motivation: data.motivation,
    passwordHash: await hashPassword(data.password),
    referrerId: referrer?.id ?? null,
    kvkkConsentAt: now,
    createdAt: now,
  });

  if (referrer) {
    await awardXp(referrer.id, "referral_application", {
      dedupeKey: `referral_application:${id}`,
      reason: data.username,
    });
    await notify(referrer.id, {
      type: "referral",
      title: "Linkinden yeni bir başvuru geldi",
      body: `${data.fullName} sürüye katılmak için başvurdu. Onaylanınca büyük ödül senin.`,
      href: "/panel#referans",
    });
  }

  const staff = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  await Promise.all(
    staff.map((admin) =>
      notify(admin.id, {
        type: "application",
        title: "Yeni üyelik başvurusu",
        body: `${data.fullName} (${data.city})`,
        href: `/yonetim/basvurular/${id}`,
      }),
    ),
  );

  redirect("/basvuru/alindi");
}
