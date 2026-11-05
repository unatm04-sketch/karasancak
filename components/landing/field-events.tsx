import Link from "next/link";
import { Suspense } from "react";
import { MapPin } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { listPastEvents, listUpcomingEvents } from "@/lib/queries/content";
import { requestTime } from "@/lib/request";

const DAY_FMT = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric" });
const MONTH_FMT = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", month: "long" });

export function FieldEvents() {
  return (
    <section aria-labelledby="saha-baslik" className="overflow-hidden border-t border-line bg-coal py-24 md:py-32">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <Reveal>
          <h2 id="saha-baslik" className="display text-[clamp(3.4rem,8vw,8rem)]">
            Sahadayız<span className="text-al">.</span>
          </h2>
          <p className="mt-5 max-w-[36rem] text-lg leading-relaxed text-fog">
            Edirne&apos;den Ankara&apos;ya, Bağdat Caddesi&apos;nden Celtic Park&apos;a. Katıldığın her
            etkinlikte yoklaman alınır, XP hesabına geçer.
          </p>
        </Reveal>
      </div>
      <Suspense fallback={<div className="skeleton mx-auto mt-12 h-80 max-w-[1500px]" />}>
        <EventRail />
      </Suspense>
    </section>
  );
}

async function EventRail() {
  const now = await requestTime();
  const [upcoming, past] = await Promise.all([listUpcomingEvents(6, now), listPastEvents(4, now)]);
  const items = [...upcoming.map((e) => ({ ...e, past: false })), ...past.map((e) => ({ ...e, past: true }))];

  if (items.length === 0) {
    return (
      <p className="mx-auto mt-12 max-w-[1500px] px-5 text-fog md:px-10">
        Yeni etkinlikler duyurulduğunda burada yer alacak.
      </p>
    );
  }

  return (
    <ul className="scroll-clean mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:px-10 lg:px-[max(2.5rem,calc((100vw-1500px)/2+2.5rem))]">
      {items.map((event) => (
        <li key={event.id} className="w-[min(82vw,430px)] shrink-0 snap-start">
          <Link
            href={`/etkinlikler/${event.slug}`}
            className={`group flex h-full min-h-80 flex-col justify-between p-7 transition-colors ${
              event.past ? "bg-ash hover:bg-steel" : "bg-bone text-ink hover:bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="display text-8xl leading-[0.85]">{DAY_FMT.format(new Date(event.startsAt))}</p>
              <p className="display text-right text-2xl">{MONTH_FMT.format(new Date(event.startsAt))}</p>
            </div>
            <div className="mt-10">
              <h3 className="display text-3xl md:text-4xl">{event.title}</h3>
              <p className={`mt-3 flex items-center gap-1.5 text-sm ${event.past ? "text-fog" : "text-ink/70"}`}>
                <MapPin size={16} />
                {event.location}
                {event.city ? `, ${event.city}` : ""}
              </p>
              <p className={`mt-1 text-sm ${event.past ? "text-fog" : "text-ink/70"}`}>
                {event.past ? "Tamamlandı" : `+${event.xpReward} XP yoklama ödülü`}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
