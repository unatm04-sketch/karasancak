import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { RankBadge } from "@/components/member/badges";
import { ShieldStar } from "@/components/ui/icons";
import { ListSkeleton, PageContainer, PageHeader, SectionTitle } from "@/components/ui/page";
import { formatNumber } from "@/lib/format";
import { listRanks, listXpRules } from "@/lib/queries/members";
import { LEVEL_TIERS, xpForLevel } from "@/lib/xp/levels";
import { ACHIEVEMENTS, XP_CATEGORIES } from "@/lib/xp/rules";

export const metadata: Metadata = {
  title: "XP ve Görevler",
  description: "Kara Sancak'ta XP nasıl kazanılır, seviyeler ve rütbeler nasıl yükselir?",
};

export default function QuestsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="XP ve görevler"
        description="Sitede yaptığın her şey sürüdeki yerini yükseltir. Seviye otomatik gelir, rütbeyi yönetim verir."
      />
      <Suspense fallback={<ListSkeleton rows={10} />}>
        <QuestsContent />
      </Suspense>
    </PageContainer>
  );
}

async function QuestsContent() {
  await connection();
  const [rules, ranks] = await Promise.all([listXpRules(), listRanks()]);
  const active = rules.filter((r) => r.active);

  return (
    <div className="grid gap-14 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-7">
        {XP_CATEGORIES.map((category) => {
          const list = active.filter((r) => r.category === category);
          if (list.length === 0) return null;
          return (
            <section key={category}>
              <SectionTitle>{category}</SectionTitle>
              <ul className="panel divide-y divide-line">
                {list.map((rule) => (
                  <li key={rule.key} className="flex items-center justify-between gap-5 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{rule.label}</p>
                      <p className="mt-0.5 text-sm text-fog">{rule.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="display text-2xl">+{formatNumber(rule.amount)}</p>
                      {rule.dailyCap !== null && <p className="text-xs text-smoke">günde {rule.dailyCap} kez</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="space-y-12 lg:col-span-5">
        <section>
          <SectionTitle>Seviyeler</SectionTitle>
          <ol className="panel divide-y divide-line">
            {LEVEL_TIERS.map((tier) => (
              <li key={tier.name} className="p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="display text-2xl">{tier.name}</p>
                  <p className="text-sm text-fog">Seviye {tier.from}+</p>
                </div>
                <p className="mt-1 text-sm text-fog">{tier.note}</p>
                <p className="mt-1 text-xs text-smoke">{formatNumber(xpForLevel(tier.from))} XP</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionTitle>Rütbeler</SectionTitle>
          <p className="mb-3 text-sm text-fog">
            Rütbeler Göktürk unvanlarından gelir ve XP ile değil, yönetimin kararıyla verilir.
          </p>
          <ol className="panel divide-y divide-line">
            {[...ranks].reverse().map((rank) => (
              <li key={rank.id} className="flex items-start gap-3 p-4">
                <RankBadge name={rank.name} order={rank.sortOrder} className="mt-0.5 shrink-0" />
                <p className="text-sm text-fog">{rank.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionTitle>Nişanlar</SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {Object.entries(ACHIEVEMENTS).map(([key, def]) => (
              <li key={key} className="panel flex items-start gap-3 p-3">
                <ShieldStar size={22} className="mt-0.5 shrink-0 text-fog" />
                <div>
                  <p className="font-semibold leading-tight">{def.name}</p>
                  <p className="mt-0.5 text-xs text-fog">{def.description}</p>
                  <p className="mt-1 text-xs font-semibold">+{def.xp} XP</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
