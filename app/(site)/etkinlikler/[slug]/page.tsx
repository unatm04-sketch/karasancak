import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RichText } from "@/components/forum/rich-text";
import { Avatar } from "@/components/member/avatar";
import { buttonClass } from "@/components/ui/button";
import { CalendarDots, CheckCircle, MapPin } from "@/components/ui/icons";
import { PageContainer, PageHeader, SectionTitle, Skeleton } from "@/components/ui/page";
import { cancelRsvp, rsvpEvent } from "@/lib/actions/engagement";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/format";
import { getEventBySlug, getUserRsvp, listEventAttendees } from "@/lib/queries/content";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = { title: "Etkinlik" };

export default function EventPage({ params }: PageProps<"/etkinlikler/[slug]">) {
  return (
    <PageContainer className="max-w-[1100px]">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <EventContent params={params} />
      </Suspense>
    </PageContainer>
  );
}

const GRACE_MS = 18 * 60 * 60 * 1000;

async function EventContent({ params }: Pick<PageProps<"/etkinlikler/[slug]">, "params">) {
  const [{ slug }, user] = await Promise.all([params, getCurrentUser()]);
  const event = await getEventBySlug(slug);
  if (!event || !event.published) notFound();

  const [attendees, rsvp] = await Promise.all([
    listEventAttendees(event.id),
    user ? getUserRsvp(event.id, user.id) : null,
  ]);
  const over = event.startsAt < (await requestTime()) - GRACE_MS;

  return (
    <>
      <PageHeader title={event.title} breadcrumb={[{ href: "/etkinlikler", label: "Etkinlikler" }]} />
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-fog">
            <span className="flex items-center gap-2">
              <CalendarDots size={18} />
              {event.timeAnnounced ? formatDateTime(event.startsAt) : `${formatDate(event.startsAt)}, saat duyurulacak`}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={18} />
              {event.location}
              {event.city ? `, ${event.city}` : ""}
            </span>
          </div>
          {event.description && <RichText text={event.description} className="mt-6 text-lg text-bone/90" />}
        </div>

        <aside className="lg:col-span-5">
          <div className="panel p-5 md:p-6">
            <p className="display text-4xl">+{event.xpReward} XP</p>
            <p className="mt-1 text-sm text-fog">Sahada yoklaman alındığında hesabına geçer.</p>
            <div className="mt-5">
              {over ? (
                <p className="font-semibold">Bu etkinlik tamamlandı.</p>
              ) : !user ? (
                <Link href={`/giris?devam=/etkinlikler/${slug}`} className={buttonClass("primary", "md")}>
                  Katılmak için giriş yap
                </Link>
              ) : rsvp ? (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckCircle size={20} weight="fill" className="text-al-bright" />
                    {rsvp.attendedAt ? "Yoklaman alındı" : "Oradasın"}
                  </span>
                  {!rsvp.attendedAt && (
                    <form action={cancelRsvp.bind(null, event.id)}>
                      <button type="submit" className={buttonClass("quiet", "sm")}>
                        Vazgeç
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <form action={rsvpEvent.bind(null, event.id)}>
                  <button type="submit" className={buttonClass("primary", "lg", "w-full")}>
                    Oradayım
                  </button>
                </form>
              )}
            </div>
          </div>

          <section className="mt-8" aria-labelledby="katilanlar">
            <SectionTitle>
              <span id="katilanlar">{attendees.length} katılım</span>
            </SectionTitle>
            {attendees.length === 0 ? (
              <p className="text-sm text-fog">İlk katılan sen ol.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {attendees.map((member) => (
                  <li key={member.id}>
                    <Link href={`/uye/${member.username}`} title={member.displayName}>
                      <Avatar user={member} size="md" />
                      <span className="sr-only">{member.displayName}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
