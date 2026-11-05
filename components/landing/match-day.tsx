import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { IMAGES } from "@/lib/brand/images";
import { formatDate, formatTime, formatWeekday } from "@/lib/format";
import { getLastResult, getNextMatch } from "@/lib/queries/content";
import { Countdown } from "./countdown";
import { requestTime } from "@/lib/request";

/** Instagram'daki "MAÇ GÜNÜ" afişinin canlı veriyle çalışan hali */
export function MatchDay() {
  return (
    <section aria-label="Maç günü" className="relative isolate overflow-hidden bg-ink">
      {/* Görsel çok karartıldığı için geniş ekranda da 1200 piksel yeterli, sayfa ağırlaşmasın */}
      <Image
        src={IMAGES.stadium.src}
        alt={IMAGES.stadium.alt}
        fill
        sizes="min(100vw, 1200px)"
        className="-z-20 object-cover brightness-[0.42] contrast-[1.25] grayscale"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-ink/25 to-ink" />
      <div className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
        <Suspense fallback={<MatchSkeleton />}>
          <MatchContent />
        </Suspense>
      </div>
    </section>
  );
}

function MatchSkeleton() {
  return (
    <div className="min-h-[420px]">
      <h2 className="display text-[clamp(4.5rem,13vw,13rem)]">Maç Günü</h2>
      <div className="skeleton mt-10 h-14 max-w-xl" />
    </div>
  );
}

async function MatchContent() {
  const now = await requestTime();
  const [next, last] = await Promise.all([getNextMatch(now), getLastResult()]);

  const besiktasWon =
    last &&
    last.homeScore !== null &&
    last.awayScore !== null &&
    ((last.homeTeam === "Beşiktaş" && last.homeScore > last.awayScore) ||
      (last.awayTeam === "Beşiktaş" && last.awayScore > last.homeScore));

  return (
    <div className="grid gap-14 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        {next ? (
          <>
            <p className="text-lg text-fog">{next.competition}</p>
            <h2 className="display mt-2 text-[clamp(4.5rem,13vw,13rem)]">Maç Günü</h2>
            <p className="display mt-8 text-[clamp(2.2rem,5vw,4.6rem)]">
              {next.homeTeam} <span className="text-al">-</span> {next.awayTeam}
            </p>
            <p className="mt-4 text-lg text-fog">
              {formatDate(next.kickoffAt)} {formatWeekday(next.kickoffAt)}, saat {formatTime(next.kickoffAt)}
              <br />
              {next.venue}
            </p>
            <div className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-8">
              <Countdown target={next.kickoffAt} />
              <Link href="/maclar" className={buttonClass("primary", "xl")}>
                Tahminini Yap
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="display text-[clamp(4.5rem,13vw,13rem)]">
              {besiktasWon ? "Zafer Beşiktaş'ın!" : "Son Düdük"}
            </h2>
            <p className="mt-6 max-w-xl text-lg text-fog">
              Sıradaki maç fikstüre eklendiğinde tahminler burada açılır.
            </p>
            <Link href="/maclar" className={`${buttonClass("primary", "xl")} mt-8`}>
              Tahminini Yap
            </Link>
          </>
        )}
      </div>

      {last && last.homeScore !== null && (
        <div className="lg:col-span-4 lg:justify-self-end lg:text-right">
          {next && besiktasWon && <p className="display text-3xl text-al-bright">Zafer Beşiktaş&apos;ın!</p>}
          <p className="display mt-3 text-5xl">
            {last.homeTeam} {last.homeScore}-{last.awayScore} {last.awayTeam}
          </p>
          <p className="mt-3 text-sm text-fog">
            {last.competition}, {formatDate(last.kickoffAt)}
          </p>
        </div>
      )}
    </div>
  );
}
