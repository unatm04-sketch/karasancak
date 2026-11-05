import type { Metadata } from "next";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, ListSkeleton, PageContainer, PageHeader } from "@/components/ui/page";
import { markAllNotificationsRead } from "@/lib/actions/engagement";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { timeAgo } from "@/lib/format";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = { title: "Bildirimler", robots: { index: false } };

export default function NotificationsPage() {
  return (
    <PageContainer className="max-w-3xl">
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <NotificationList />
      </Suspense>
    </PageContainer>
  );
}

async function NotificationList() {
  const user = await requireUser();
  const [items, unread] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(60),
    db
      .select({ n: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
  ]);
  const now = await requestTime();
  const hasUnread = (unread[0]?.n ?? 0) > 0;

  return (
    <>
      <PageHeader
        title="Bildirimler"
        actions={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <button type="submit" className={buttonClass("ghost", "sm")}>
                Tümünü okundu say
              </button>
            </form>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState title="Henüz bildirim yok">Biri seni andığında ya da seviye atladığında burada göreceksin.</EmptyState>
      ) : (
        <ul className="panel divide-y divide-line">
          {items.map((item) => {
            const content = (
              <div className="flex gap-3 p-4">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2 shrink-0 ${item.readAt ? "bg-transparent" : "bg-al"}`}
                />
                <div className="min-w-0">
                  <p className={item.readAt ? "text-fog" : "font-semibold"}>{item.title}</p>
                  {item.body && <p className="mt-0.5 text-sm text-fog">{item.body}</p>}
                  <p className="mt-1 text-xs text-smoke">{timeAgo(item.createdAt, now)}</p>
                </div>
              </div>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="block transition-colors hover:bg-ash">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
