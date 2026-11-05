import type { Metadata } from "next";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { ActionForm, ConfirmButton, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { Trash } from "@/components/ui/icons";
import { ListSkeleton, PageHeader, SectionTitle } from "@/components/ui/page";
import { createMatch, deleteMatch, settleMatch } from "@/lib/actions/admin-content";
import { requireStaff } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { listFinishedMatches, listScheduledMatches } from "@/lib/queries/content";

export const metadata: Metadata = { title: "Maçlar" };

export default function AdminMatchesPage() {
  return (
    <>
      <PageHeader
        title="Maçlar"
        description="Fikstürü buradan yönet. Sonucu işlediğinde tutan tahminlere XP otomatik dağıtılır."
      />
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <MatchEditor />
      </Suspense>
    </>
  );
}

async function MatchEditor() {
  await requireStaff();
  const [scheduled, finished] = await Promise.all([listScheduledMatches(), listFinishedMatches(15)]);

  return (
    <div className="grid gap-8 xl:grid-cols-12">
      <div className="space-y-8 xl:col-span-8">
        <section aria-labelledby="bekleyen-mac">
          <SectionTitle>
            <span id="bekleyen-mac">Sonuç bekleyenler</span>
          </SectionTitle>
          {scheduled.length === 0 ? (
            <p className="panel p-5 text-fog">Fikstürde maç yok. Yandan yeni maç ekleyebilirsin.</p>
          ) : (
            <ul className="space-y-3">
              {scheduled.map((match) => (
                <li key={match.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="display text-3xl">
                        {match.homeTeam} - {match.awayTeam}
                      </p>
                      <p className="mt-1 text-sm text-fog">
                        {match.competition}, {formatDateTime(match.kickoffAt)}
                        {match.venue ? `, ${match.venue}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-smoke">{match.predictionCount} tahmin</p>
                    </div>
                    <ConfirmButton
                      action={deleteMatch.bind(null, match.id)}
                      message="Maç ve tahminleri silinecek. Emin misin?"
                      className={buttonClass("quiet", "sm", "hover:text-al-bright")}
                    >
                      <Trash size={15} />
                      Sil
                    </ConfirmButton>
                  </div>
                  <ActionForm action={settleMatch.bind(null, match.id)} className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="w-28">
                      <Field label={match.homeTeam} name="home" type="number" min={0} max={30} required />
                    </div>
                    <div className="w-28">
                      <Field label={match.awayTeam} name="away" type="number" min={0} max={30} required />
                    </div>
                    <SubmitButton pendingLabel="İşleniyor..." className="h-[46px]">
                      Sonucu işle
                    </SubmitButton>
                    <FormMessage className="w-full" />
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="biten-mac">
          <SectionTitle>
            <span id="biten-mac">Biten maçlar</span>
          </SectionTitle>
          {finished.length === 0 ? (
            <p className="panel p-5 text-fog">Henüz işlenmiş sonuç yok.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {finished.map((match) => (
                <li key={match.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold">
                      {match.homeTeam} {match.homeScore}-{match.awayScore} {match.awayTeam}
                    </p>
                    <p className="text-xs text-smoke">
                      {match.competition}, {formatDateTime(match.kickoffAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="xl:col-span-4">
        <div className="xl:sticky xl:top-24">
          <SectionTitle>Yeni maç</SectionTitle>
          <ActionForm action={createMatch} resetOnSuccess className="panel flex flex-col gap-4 p-5">
            <FormMessage />
            <Field label="Organizasyon" name="competition" placeholder="Trendyol Süper Lig" required />
            <Field label="Ev sahibi" name="homeTeam" required />
            <Field label="Deplasman" name="awayTeam" required />
            <Field label="Stat" name="venue" />
            <Field label="Başlama saati" name="kickoffAt" type="datetime-local" help="Türkiye saati" required />
            <div>
              <SubmitButton pendingLabel="Ekleniyor...">Maç ekle</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </aside>
    </div>
  );
}
