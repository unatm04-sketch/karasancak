import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDots, MapPin, Users } from "@/components/ui/icons";
import { EmptyState, ListSkeleton, PageContainer, PageHeader, SectionTitle } from "@/components/ui/page";
import { formatDate, formatDateTime } from "@/lib/format";
import { listPastEvents, listUpcomingEvents } from "@/lib/queries/content";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = {
  title: "Etkinlikler",
  description: "Kara Sancak yürüyüşleri, anma ziyaretleri ve buluşmaları.",
};

export default function EventsPage() {
  return (
    <PageContainer>
      <PageHeader title="Etkinlikler" description="Katılımını bildir, sahada yoklamanı ver, XP'ni al." />
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <EventsContent />
      </Suspense>
    </PageContainer>
  );
}

type EventItem = Awaited<ReturnType<typeof listUpcomingEvents>>[number];

function EventRow({ event }: { event: EventItem }) {
  return (
    <li>
      <Link href={`/etkinlikler/${event.slug}`} className="panel block p-5 transition-colors hover:bg-ash md:p-7">
        <h3 className="display text-3xl md:text-4xl">{event.title}</h3>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-fog">
          <span className="flex items-center gap-1.5">
            <CalendarDots size={16} />
            {event.timeAnnounced ? formatDateTime(event.startsAt) : `${formatDate(event.startsAt)}, saat duyurulacak`}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={16} />
            {event.location}
            {event.city ? `, ${event.city}` : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={16} />
            {event.goingCount} katılım
          </span>
        </div>
      </Link>
    </li>
  );
}

async function EventsContent() {
  const now = await requestTime();
  const [upcoming, past] = await Promise.all([listUpcomingEvents(20, now), listPastEvents(20, now)]);

  return (
    <div className="grid gap-12">
      <section aria-labelledby="yaklasan">
        <SectionTitle>
          <span id="yaklasan">Yaklaşan</span>
        </SectionTitle>
        {upcoming.length === 0 ? (
          <EmptyState title="Yeni çağrı yakında">Duyurulan etkinlikler burada yer alacak.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>
      {past.length > 0 && (
        <section aria-labelledby="gecmis">
          <SectionTitle>
            <span id="gecmis">Geride kalanlar</span>
          </SectionTitle>
          <ul className="space-y-3">
            {past.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
