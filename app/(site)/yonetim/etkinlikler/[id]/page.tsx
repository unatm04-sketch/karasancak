import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventForm } from "@/components/admin/event-form";
import { Avatar } from "@/components/member/avatar";
import { buttonClass } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/form";
import { CheckCircle, Trash } from "@/components/ui/icons";
import { PageHeader, SectionTitle, Skeleton } from "@/components/ui/page";
import { deleteEvent, setAttendance, updateEvent } from "@/lib/actions/admin-content";
import { requireStaff } from "@/lib/auth/dal";
import { toLocalDateTimeValue } from "@/lib/format";
import { getEventById } from "@/lib/queries/admin";
import { listEventAttendees } from "@/lib/queries/content";

export const metadata: Metadata = { title: "Etkinlik" };

export default function AdminEventPage({ params }: PageProps<"/yonetim/etkinlikler/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
      <EventEditor params={params} />
    </Suspense>
  );
}

async function EventEditor({ params }: Pick<PageProps<"/yonetim/etkinlikler/[id]">, "params">) {
  const [{ id }] = await Promise.all([params, requireStaff()]);
  const [event, attendees] = await Promise.all([getEventById(id), listEventAttendees(id)]);
  if (!event) notFound();
  const attended = attendees.filter((a) => a.attendedAt).length;

  return (
    <>
      <PageHeader
        title={event.title}
        breadcrumb={[{ href: "/yonetim/etkinlikler", label: "Etkinlikler" }]}
        actions={
          <>
            <Link href={`/etkinlikler/${event.slug}`} className={buttonClass("ghost", "sm")}>
              Sayfayı gör
            </Link>
            <ConfirmButton
              action={deleteEvent.bind(null, event.id)}
              message="Etkinlik ve katılım kayıtları silinecek. Emin misin?"
              className={buttonClass("danger", "sm")}
            >
              <Trash size={15} />
              Sil
            </ConfirmButton>
          </>
        }
      />
      <div className="grid gap-8 xl:grid-cols-12">
        <section className="xl:col-span-6" aria-labelledby="yoklama-baslik">
          <SectionTitle
            aside={
              <span className="text-sm text-fog">
                {attended}/{attendees.length} yoklama
              </span>
            }
          >
            <span id="yoklama-baslik">Yoklama</span>
          </SectionTitle>
          {attendees.length === 0 ? (
            <p className="panel p-5 text-fog">Henüz katılım bildiren üye yok.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {attendees.map((member) => (
                <li key={member.id} className="flex items-center gap-3 p-3">
                  <Avatar user={member} size="sm" />
                  <Link href={`/yonetim/uyeler/${member.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-al-bright">
                    {member.displayName}
                  </Link>
                  <form action={setAttendance.bind(null, event.id, member.id, !member.attendedAt)}>
                    <button
                      type="submit"
                      className={buttonClass(member.attendedAt ? "light" : "ghost", "sm")}
                    >
                      {member.attendedAt && <CheckCircle size={15} weight="fill" />}
                      {member.attendedAt ? "Geldi" : `Geldi işaretle (+${event.xpReward})`}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="xl:col-span-6" aria-labelledby="etkinlik-duzenle">
          <SectionTitle>
            <span id="etkinlik-duzenle">Düzenle</span>
          </SectionTitle>
          <EventForm
            action={updateEvent.bind(null, event.id)}
            submitLabel="Kaydet"
            values={{
              title: event.title,
              description: event.description,
              location: event.location,
              city: event.city,
              startsAtValue: toLocalDateTimeValue(event.startsAt),
              timeAnnounced: event.timeAnnounced,
              xpReward: event.xpReward,
              published: event.published,
            }}
          />
        </section>
      </div>
    </>
  );
}
