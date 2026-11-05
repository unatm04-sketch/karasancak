import "server-only";
import { lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";

const STALE_AFTER_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Sabit pencereli sayaç. Birden çok sunucu örneğinde de doğru çalışsın diye
 * bellekte değil veritabanında tutulur. Tek SQL ifadesi olduğu için atomiktir.
 *
 * @returns izin verildiyse true
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  const expired = now - windowMs;
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart: now, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStart} <= ${expired} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimits.windowStart} <= ${expired} THEN ${now} ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning({ count: rateLimits.count });

  // Tablo sonsuza kadar büyümesin: arada bir süresi çoktan geçmiş satırları temizle.
  if (Math.random() < 0.01) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, now - STALE_AFTER_MS));
  }
  return (row?.count ?? 1) <= limit;
}
