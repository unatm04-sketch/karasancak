"use server";

import { redirect } from "next/navigation";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { applications, passwordTokens, users } from "@/lib/db/schema";
import { burnPasswordTime, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, destroyUserSessions } from "@/lib/auth/session";
import { failure, fromZodError, type FormState } from "@/lib/form-state";
import { sha256 } from "@/lib/ids";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpKey } from "@/lib/request";
import { safeInternalPath } from "@/lib/safe-redirect";
import { formToObject, passwordSchema } from "@/lib/validation";

const LoginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1, "Kullanıcı adını veya e-postanı yaz."),
  password: z.string().min(1, "Şifreni yaz."),
  next: z.string().optional(),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse(formToObject(formData, ["identifier", "password", "next"]));
  if (!parsed.success) return fromZodError(parsed.error);
  const { identifier, password, next } = parsed.data;

  const ipKey = await getIpKey();
  const allowed =
    (await consumeRateLimit(`login:ip:${ipKey}`, 20, 15 * 60 * 1000)) &&
    (await consumeRateLimit(`login:id:${identifier}`, 8, 15 * 60 * 1000));
  if (!allowed) {
    return failure("Çok fazla deneme yaptın. Lütfen 15 dakika sonra tekrar dene.");
  }

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      status: users.status,
    })
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);

  if (!user) {
    // Henüz üye değil ama başvurusu varsa, şifresi doğruysa durumunu söyleyebiliriz.
    const [application] = await db
      .select({ status: applications.status, passwordHash: applications.passwordHash })
      .from(applications)
      .where(or(eq(applications.username, identifier), eq(applications.email, identifier)))
      .orderBy(desc(applications.createdAt))
      .limit(1);
    if (application && (await verifyPassword(password, application.passwordHash))) {
      if (application.status === "pending") {
        return failure("Başvurun inceleniyor. Onaylandığında bu bilgilerle giriş yapabileceksin.");
      }
      if (application.status === "rejected") {
        return failure("Başvurun bu dönem olumlu sonuçlanmadı.");
      }
    } else if (!application) {
      await burnPasswordTime(password);
    }
    return failure("Kullanıcı adı veya şifre hatalı.");
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return failure("Kullanıcı adı veya şifre hatalı.");
  }
  if (user.status !== "active") {
    return failure("Hesabın askıya alınmış. Yönetimle iletişime geç.");
  }

  await createSession(user.id);
  redirect(safeInternalPath(next));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

const ActivationSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "Şifreler aynı değil.",
    path: ["passwordConfirm"],
  });

/** Yönetimin ürettiği aktivasyon veya şifre sıfırlama linkinden gelen istek */
export async function redeemPasswordToken(
  token: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = ActivationSchema.safeParse(
    formToObject(formData, ["password", "passwordConfirm"]),
  );
  if (!parsed.success) return fromZodError(parsed.error);

  const allowed = await consumeRateLimit(`activate:${await getIpKey()}`, 10, 15 * 60 * 1000);
  if (!allowed) return failure("Çok fazla deneme yaptın. Biraz sonra tekrar dene.");

  const tokenId = sha256(token);
  const now = Date.now();
  // Tek kullanımlık: aynı linki iki sekmeden kullanmak ikinci denemede başarısız olur.
  const [claimed] = await db
    .update(passwordTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordTokens.id, tokenId),
        isNull(passwordTokens.usedAt),
        gt(passwordTokens.expiresAt, now),
      ),
    )
    .returning({ userId: passwordTokens.userId });
  if (!claimed) return failure("Bu linkin süresi dolmuş ya da daha önce kullanılmış.");

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.password) })
    .where(eq(users.id, claimed.userId));
  await destroyUserSessions(claimed.userId);
  await createSession(claimed.userId);
  redirect("/panel");
}
