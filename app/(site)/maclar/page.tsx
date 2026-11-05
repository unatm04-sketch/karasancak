import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PredictionForm } from "@/components/match/prediction-form";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, ListSkeleton, PageContainer, PageHeader, SectionTitle } from "@/components/ui/page";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate, formatTime, formatWeekday } from "@/lib/format";
import { getUserPredictions, listFinishedMatches, listScheduledMatches } from "@/lib/queries/content";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = {
  title: "Maçlar ve Tahminler",
  description: "Beşiktaş fikstürü, sonuçlar ve Kara Sancak üyelerinin maç tahminleri.",
};

export default function MatchesPage() {
  return (
    <PageContainer>
      <PageHeader title="Maçlar" description="Düdük çalmadan tahminini gir. Sonucu bilene XP, skoru tam bilene daha çok XP." />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <MatchesContent />
      </Suspense>
    </PageContainer>
  );
}

async function MatchesContent() {
  await connection();
  const [user, scheduled, finished] = await Promise.all([
    getCurrentUser(),
    listScheduledMatches(),
    listFinishedMatches(20),
  ]);
  const predictions = user ? await getUserPredictions(user.id) : new Map();
  const now = await requestTime();

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <section className="lg:col-span-7" aria-labelledby="fikstur">
        <SectionTitle>
          <span id="fikstur">Fikstür</span>
        </SectionTitle>
        {scheduled.length === 0 ? (
          <EmptyState title="Fikstür bekleniyor">Yeni maçlar eklendiğinde burada tahmin açılır.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {scheduled.map((match) => {
              const started = match.kickoffAt <= now;
              const mine = predictions.get(match.id);
              return (
                <li key={match.id} className="panel p-5 md:p-7">
                  <p className="text-sm text-fog">{match.competition}</p>
                  <h3 className="display mt-1 text-4xl md:text-5xl">
                    {match.homeTeam} <span className="text-al">-</span> {match.awayTeam}
                  </h3>
                  <p className="mt-2 text-sm text-fog">
                    {formatDate(match.kickoffAt)} {formatWeekday(match.kickoffAt)}, saat {formatTime(match.kickoffAt)}
                    {match.venue ? `, ${match.venue}` : ""}
                  </p>
                  <div className="mt-6">
                    {started ? (
                      <p className="font-semibold">
                        Maç başladı, tahminler kapandı.
                        {mine ? ` Tahminin: ${mine.homeScore}-${mine.awayScore}` : ""}
                      </p>
                    ) : user ? (
                      <PredictionForm
                        matchId={match.id}
                        homeTeam={match.homeTeam}
                        awayTeam={match.awayTeam}
                        current={mine}
                      />
                    ) : (
                      <Link href="/giris?devam=/maclar" className={buttonClass("primary", "md")}>
                        Tahmin için giriş yap
                      </Link>
                    )}
                  </div>
                  <p className="mt-4 text-xs text-smoke">{match.predictionCount} üye tahmin yaptı</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="lg:col-span-5" aria-labelledby="sonuclar">
        <SectionTitle>
          <span id="sonuclar">Sonuçlar</span>
        </SectionTitle>
        {finished.length === 0 ? (
          <p className="panel p-5 text-fog">Henüz işlenmiş sonuç yok.</p>
        ) : (
          <ul className="panel divide-y divide-line">
            {finished.map((match) => {
              const mine = predictions.get(match.id);
              return (
                <li key={match.id} className="p-4">
                  <p className="display text-2xl">
                    {match.homeTeam} {match.homeScore}-{match.awayScore} {match.awayTeam}
                  </p>
                  <p className="mt-1 text-xs text-smoke">
                    {match.competition}, {formatDate(match.kickoffAt)}
                  </p>
                  {mine && (
                    <p className="mt-2 text-sm text-fog">
                      Tahminin {mine.homeScore}-{mine.awayScore}
                      {mine.awardedXp ? (
                        <span className="ml-2 font-semibold text-bone">+{mine.awardedXp} XP</span>
                      ) : (
                        <span className="ml-2">tutmadı</span>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
