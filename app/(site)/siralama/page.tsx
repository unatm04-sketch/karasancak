import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/member/avatar";
import { RankBadge } from "@/components/member/badges";
import { EmptyState, ListSkeleton, PageContainer, PageHeader, SectionTitle } from "@/components/ui/page";
import { formatNumber } from "@/lib/format";
import { leaderboard, referralLeaderboard, type LeaderboardPeriod } from "@/lib/queries/members";
import { predictionLeaderboard } from "@/lib/queries/content";
import { tierForLevel } from "@/lib/xp/levels";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = {
  title: "Sıralama",
  description: "Kara Sancak üyelerinin XP, davet ve maç tahmini sıralaması.",
};

const PERIODS: Array<{ key: LeaderboardPeriod; label: string }> = [
  { key: "tum", label: "Tüm zamanlar" },
  { key: "ay", label: "Son 30 gün" },
  { key: "hafta", label: "Son 7 gün" },
];

export default function LeaderboardPage({ searchParams }: PageProps<"/siralama">) {
  return (
    <PageContainer>
      <PageHeader title="Sürünün sıralaması" description="Forumda, sahada ve tribünde en çok ter dökenler." />
      <Suspense fallback={<ListSkeleton rows={10} />}>
        <LeaderboardContent searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function LeaderboardContent({ searchParams }: Pick<PageProps<"/siralama">, "searchParams">) {
  const [{ donem }, now] = await Promise.all([searchParams, requestTime()]);
  const period: LeaderboardPeriod = donem === "hafta" || donem === "ay" ? donem : "tum";
  const [rows, inviters, predictors] = await Promise.all([
    leaderboard(period, 50, now),
    referralLeaderboard(5),
    predictionLeaderboard(5),
  ]);

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <section className="lg:col-span-8" aria-label="XP sıralaması">
        <nav aria-label="Dönem" className="mb-6 flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={p.key === "tum" ? "/siralama" : `/siralama?donem=${p.key}`}
              aria-current={p.key === period ? "page" : undefined}
              className={`border px-4 py-2 text-sm font-medium ${
                p.key === period ? "border-bone bg-bone text-ink" : "border-line text-fog hover:border-bone hover:text-bone"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <EmptyState title="Sürünün ilk kurdu sen ol">Bu dönemde henüz XP hareketi yok.</EmptyState>
        ) : (
          <ol>
            {rows.map((member, index) => (
              <li key={member.id}>
                <Link
                  href={`/uye/${member.username}`}
                  className={`flex items-center gap-4 border-b border-line px-2 py-3.5 transition-colors hover:bg-coal ${
                    index === 0 ? "bg-coal" : ""
                  }`}
                >
                  <span className={`display w-9 shrink-0 text-center text-3xl ${index < 3 ? "text-al-bright" : "text-smoke"}`}>
                    {index + 1}
                  </span>
                  <Avatar user={member} size={index === 0 ? "lg" : "md"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{member.displayName}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-smoke">
                      <RankBadge name={member.rankName} order={member.rankOrder} />
                      Seviye {member.level}, {tierForLevel(member.level).name}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="display block text-2xl">{formatNumber(member.periodXp)}</span>
                    <span className="text-xs text-smoke">XP</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <aside className="space-y-10 lg:col-span-4">
        <SideBoard title="En çok davet edenler" unit="üye" rows={inviters.map((m) => ({ ...m, value: m.invites }))} empty="Henüz onaylanan davet yok." />
        <SideBoard title="Tahmin ustaları" unit="XP" rows={predictors.map((m) => ({ ...m, value: m.total }))} empty="Henüz sonuçlanan tahmin yok." />
      </aside>
    </div>
  );
}

function SideBoard({
  title,
  unit,
  rows,
  empty,
}: {
  title: string;
  unit: string;
  empty: string;
  rows: Array<{ id: string; username: string; displayName: string; avatarVersion: number; value: number }>;
}) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      {rows.length === 0 ? (
        <p className="panel p-4 text-sm text-fog">{empty}</p>
      ) : (
        <ol className="panel divide-y divide-line">
          {rows.map((member, index) => (
            <li key={member.id}>
              <Link href={`/uye/${member.username}`} className="flex items-center gap-3 p-3 hover:bg-ash">
                <span className="display w-5 text-xl text-smoke">{index + 1}</span>
                <Avatar user={member} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{member.displayName}</span>
                <span className="shrink-0 text-sm text-fog">
                  {formatNumber(member.value)} {unit}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
