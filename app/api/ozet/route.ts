import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { unreadNotificationCount } from "@/lib/notifications";
import { unreadConversationCount } from "@/lib/queries/messages";

/** Üst menü sayaçları. Sekme açıkken periyodik çağrılır; "son görülme" de burada güncellenir. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: 0, messages: 0 }, { status: 401 });

  const [notifications, messages] = await Promise.all([
    unreadNotificationCount(user.id),
    unreadConversationCount(user.id),
    db.update(users).set({ lastSeenAt: Date.now() }).where(eq(users.id, user.id)),
  ]);
  return NextResponse.json(
    { notifications, messages },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
