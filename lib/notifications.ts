import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

export type NotificationInput = {
  type: string;
  title: string;
  body?: string;
  href?: string;
};

export async function notify(userId: string, input: NotificationInput): Promise<void> {
  await db.insert(notifications).values({
    id: newId(),
    userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
    createdAt: Date.now(),
  });
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}
