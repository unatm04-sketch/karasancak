import "server-only";
import { and, count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  achievements,
  eventAttendees,
  posts,
  predictions,
  topics,
  users,
} from "@/lib/db/schema";
import { notify } from "@/lib/notifications";
import { awardXp, type XpAward } from "./award";
import { ACHIEVEMENTS, type AchievementKey } from "./rules";

/** Nişan zaten alınmışsa sessizce geçer. */
export async function grantAchievement(
  userId: string,
  key: AchievementKey,
): Promise<XpAward | null> {
  const inserted = await db
    .insert(achievements)
    .values({ userId, key, createdAt: Date.now() })
    .onConflictDoNothing()
    .returning({ key: achievements.key });
  if (inserted.length === 0) return null;

  const def = ACHIEVEMENTS[key];
  await notify(userId, {
    type: "achievement",
    title: `Yeni nişan: ${def.name}`,
    body: def.description,
    href: "/panel",
  });
  return awardXp(userId, "achievement", {
    amount: def.xp,
    reason: def.name,
    dedupeKey: `achievement:${key}:${userId}`,
  });
}

type Trigger = "topic" | "post" | "like" | "referral" | "checkin" | "prediction" | "event";

/**
 * Bir işlemden sonra yalnızca o işlemle ilgili nişanları kontrol eder.
 * Her seferinde hepsini saymaz.
 */
export async function evaluateAchievements(
  userId: string,
  trigger: Trigger,
): Promise<Array<XpAward | null>> {
  const results: Array<XpAward | null> = [];
  const give = async (key: AchievementKey, when: boolean) => {
    if (when) results.push(await grantAchievement(userId, key));
  };

  switch (trigger) {
    case "topic": {
      const [row] = await db
        .select({ n: count() })
        .from(topics)
        .where(and(eq(topics.authorId, userId), isNull(topics.deletedAt)));
      await give("ilk_konu", (row?.n ?? 0) >= 1);
      break;
    }
    case "post": {
      const [row] = await db
        .select({ n: count() })
        .from(posts)
        .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt)));
      await give("yazar_50", (row?.n ?? 0) >= 50);
      break;
    }
    case "like": {
      const [row] = await db
        .select({ n: sql<number>`COALESCE(SUM(${posts.likeCount}), 0)` })
        .from(posts)
        .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt)));
      await give("begeni_100", Number(row?.n ?? 0) >= 100);
      break;
    }
    case "referral": {
      const [row] = await db
        .select({ n: count() })
        .from(users)
        .where(eq(users.referredById, userId));
      const n = row?.n ?? 0;
      await give("davet_1", n >= 1);
      await give("davet_10", n >= 10);
      break;
    }
    case "checkin": {
      const [row] = await db
        .select({ streak: users.streak })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const streak = row?.streak ?? 0;
      await give("seri_7", streak >= 7);
      await give("seri_30", streak >= 30);
      break;
    }
    case "prediction": {
      const [row] = await db
        .select({ n: count() })
        .from(predictions)
        .where(and(eq(predictions.userId, userId), sql`${predictions.awardedXp} >= 75`));
      await give("kahin", (row?.n ?? 0) >= 1);
      break;
    }
    case "event": {
      const [row] = await db
        .select({ n: count() })
        .from(eventAttendees)
        .where(and(eq(eventAttendees.userId, userId), isNotNull(eventAttendees.attendedAt)));
      const n = row?.n ?? 0;
      await give("sahada_1", n >= 1);
      await give("sahada_5", n >= 5);
      break;
    }
  }
  return results.filter(Boolean);
}
