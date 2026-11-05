import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { Plus } from "@/components/ui/icons";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/ui/page";
import { requireStaff } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { listAllEvents } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Etkinlikler" };

export default function AdminEventsPage() {
  return (
    <>
      <PageHeader
        title="Etkinlikler"
        description="Etkinliği aç, katılımcıların yoklamasını al. Yoklaması alınan üye XP'sini otomatik kazanır."
        actions={
          <Link href="/yonetim/etkinlikler/yeni" className={buttonClass("primary", "md")}>
            <Plus size={16} />
            Yeni etkinlik
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <EventList />
      </Suspense>
    </>
  );
}

async function EventList() {
  await requireStaff();
  const events = await listAllEvents();
  if (events.length === 0) return <EmptyState title="Henüz etkinlik yok">İlk etkinliği oluştur.</EmptyState>;
  return (
    <ul className="panel divide-y divide-line">
      {events.map((event) => (
        <li key={event.id}>
          <Link href={`/yonetim/etkinlikler/${event.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-ash">
            <div className="min-w-0">
              <p className="font-semibold">{event.title}</p>
              <p className="text-sm text-fog">
                {formatDateTime(event.startsAt)}, {event.location}
              </p>
            </div>
            <span className="text-sm text-fog">
              {!event.published && <span className="mr-3 font-medium text-al-bright">Taslak</span>}+{event.xpReward} XP
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
