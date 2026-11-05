import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ranks, sessions, users, type UserRole } from "@/lib/db/schema";
import { newToken, sha256 } from "@/lib/ids";
import { SESSION_COOKIE } from "./constants";

const SESSION_DAYS = 30;

const sessionCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

/** Yalnızca Server Action / Route Handler içinde çağrılır. */
export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const now = Date.now();
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
  await db.insert(sessions).values({
    id: sha256(token),
    userId,
    createdAt: now,
    expiresAt: now + maxAge * 1000,
  });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(maxAge));
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  }
  store.delete(SESSION_COOKIE);
}

/** Üye askıya alındığında veya şifre değiştiğinde tüm cihazlardan çıkarır. */
export async function destroyUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  xp: number;
  level: number;
  rankId: string | null;
  rankName: string | null;
  rankOrder: number | null;
  avatarVersion: number;
  referralCode: string;
  streak: number;
  lastCheckInDay: string | null;
};

/**
 * Oturumu çerezden okur ve veritabanında doğrular. Askıya alınmış hesaplar
 * burada elenir. Aynı istek içinde tekrar tekrar sorgu atmaz.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      status: users.status,
      xp: users.xp,
      level: users.level,
      rankId: users.rankId,
      rankName: ranks.name,
      rankOrder: ranks.sortOrder,
      avatarVersion: users.avatarVersion,
      referralCode: users.referralCode,
      streak: users.streak,
      lastCheckInDay: users.lastCheckInDay,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    // Süre kontrolü veritabanı saatiyle yapılır: bu fonksiyon render sırasında çalışır,
    // Cache Components orada Date.now() çağrısına izin vermez.
    .where(and(eq(sessions.id, sha256(token)), sql`${sessions.expiresAt} > strftime('%s', 'now') * 1000`))
    .limit(1);

  return row && row.status === "active" ? row : null;
});
