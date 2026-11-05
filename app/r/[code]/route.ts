import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { referralClicks } from "@/lib/db/schema";
import { istanbulDay } from "@/lib/format";
import { newId } from "@/lib/ids";
import { findUserByReferralCode } from "@/lib/queries/members";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from "@/lib/referral";
import { getVisitorHash } from "@/lib/request";
import { awardXp } from "@/lib/xp/award";

/**
 * Referans linki: /r/kod
 * Ziyaretçiyi ana sayfaya gönderir, kodu 30 gün saklar ve her farklı ziyaretçi için
 * link sahibine XP yazar. Kendi linkine tıklamak veya aynı kişinin tekrar tıklaması sayılmaz.
 */
export async function GET(request: NextRequest, context: RouteContext<"/r/[code]">) {
  const { code } = await context.params;
  const home = new URL("/", request.url);
  const referrer = await findUserByReferralCode(code);
  if (!referrer) return NextResponse.redirect(home);

  const viewer = await getCurrentUser();
  const response = NextResponse.redirect(home);

  if (viewer?.id !== referrer.id) {
    response.cookies.set(REFERRAL_COOKIE, code.toLowerCase(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: "/",
    });

    const now = Date.now();
    const day = istanbulDay(now);
    const visitorHash = await getVisitorHash();
    const inserted = await db
      .insert(referralClicks)
      .values({ id: newId(), referrerId: referrer.id, visitorHash, day, createdAt: now })
      .onConflictDoNothing()
      .returning({ id: referralClicks.id });

    if (inserted.length > 0) {
      // Benzersiz anahtar: aynı kişi başka bir gün tekrar gelse de ödül bir kez verilir.
      await awardXp(referrer.id, "referral_click", {
        dedupeKey: `referral_click:${referrer.id}:${visitorHash}`,
      });
    }
  }
  return response;
}
