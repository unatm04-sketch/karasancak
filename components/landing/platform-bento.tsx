import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Emblem, RUNES, Runes } from "@/components/brand/emblem";
import { RankBadge } from "@/components/member/badges";
import { ArrowRight, ChatsCircle, SoccerBall } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { formatNumber } from "@/lib/format";
import { listRanks, listXpRules } from "@/lib/queries/members";
import { LEVEL_TIERS, xpForLevel } from "@/lib/xp/levels";

/** Üyelik sisteminin tanıtımı. Rakamlar yönetim panelindeki gerçek kurallardan gelir. */
export function PlatformBento() {
  return (
    <section aria-labelledby="platform-baslik" className="bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <Reveal>
          <h2 id="platform-baslik" className="display max-w-4xl text-[clamp(3.2rem,7vw,7rem)]">
            Sürüde yerini kazan<span className="text-al">.</span>
          </h2>
          <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-fog">
            Foruma yazdıkça, mesajlaştıkça, beğeni topladıkça ve sahaya indikçe seviye atlarsın.
            Rütbeni ise yönetim verir.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px border border-line bg-line lg:grid-cols-12">
          <LevelPath />
          <Suspense fallback={<div className="skeleton min-h-[620px] lg:col-span-5 lg:row-span-2" />}>
            <EarningList />
          </Suspense>
          <ReferralCell />
          <Suspense fallback={<div className="skeleton min-h-64 lg:col-span-7" />}>
            <RankCell />
          </Suspense>
          <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-al p-8 lg:col-span-7">
            <SoccerBall size={36} className="text-bone" />
            <div>
              <h3 className="display text-4xl md:text-5xl">Skoru bil, kazan</h3>
              <p className="mt-3 max-w-md text-bone/90">
                Her maçtan önce tahminini gir. Sonuç işlendiğinde XP otomatik hesabına geçer.
              </p>
            </div>
          </div>
          <div className="relative flex min-h-64 flex-col justify-between bg-coal p-8 lg:col-span-5">
            <ChatsCircle size={36} className="text-fog" />
            <div>
              <h3 className="display text-4xl">Tribün hep açık</h3>
              <p className="mt-3 text-fog">Ortak sohbet ve özel mesajlar.</p>
              <Link href="/forum" className="mt-4 inline-flex items-center gap-2 font-semibold hover:text-al-bright">
                Forumu Gör <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Yerden göğe altı basamak */
function LevelPath() {
  return (
    <div className="relative overflow-hidden bg-coal p-8 md:p-10 lg:col-span-7 lg:row-span-2">
      <h3 className="display text-4xl md:text-5xl">Yerden göğe altı basamak</h3>
      <p className="mt-3 max-w-md text-fog">Seviye XP ile gelir. Sürüdeki yerin kendiliğinden yükselir.</p>
      <ol className="mt-10 grid grid-cols-6 items-end gap-1.5 md:gap-3" aria-label="Seviye basamakları">
        {LEVEL_TIERS.map((tier, index) => {
          const top = index === LEVEL_TIERS.length - 1;
          return (
            <li key={tier.name} className="flex flex-col justify-end">
              <div
                className={`relative flex items-end p-2 md:p-3 ${top ? "bg-al" : index >= 4 ? "bg-bone text-ink" : "bg-steel"}`}
                style={{ height: `${90 + index * 62}px` }}
              >
                <span className="display text-lg md:text-3xl">{tier.from}+</span>
              </div>
              <p className="mt-2 text-[11px] font-semibold leading-tight md:text-sm">{tier.name}</p>
              <p className="mt-0.5 text-[10px] text-smoke md:text-xs">{formatNumber(xpForLevel(tier.from))} XP</p>
            </li>
          );
        })}
      </ol>
      <Runes className="absolute right-8 top-8 hidden text-3xl text-steel md:block">{RUNES.kokTuruk}</Runes>
    </div>
  );
}

const HIGHLIGHTED_RULES = [
  "daily_checkin",
  "topic_create",
  "post_create",
  "like_received",
  "message_sent",
  "prediction_exact",
  "event_attended",
  "referral_approved",
];

async function EarningList() {
  await connection();
  const rules = await listXpRules();
  const shown = HIGHLIGHTED_RULES.flatMap((key) => {
    const rule = rules.find((r) => r.key === key && r.active);
    return rule ? [rule] : [];
  });
  return (
    <div className="flex flex-col bg-coal p-8 md:p-10 lg:col-span-5 lg:row-span-2">
      <h3 className="display text-4xl md:text-5xl">Her hareketin karşılığı var</h3>
      <ul className="mt-8 flex-1 space-y-4">
        {shown.map((rule) => (
          <li key={rule.key} className="flex items-baseline justify-between gap-4">
            <span className="text-fog">{rule.label}</span>
            <span className="display shrink-0 text-2xl">+{formatNumber(rule.amount)}</span>
          </li>
        ))}
      </ul>
      <Link href="/gorevler" className="mt-8 inline-flex items-center gap-2 font-semibold hover:text-al-bright">
        Tüm görevler <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function ReferralCell() {
  return (
    <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-bone p-8 text-ink lg:col-span-5">
      <Emblem className="h-14 w-auto self-start" title="" />
      <div>
        <h3 className="display text-4xl">Linkini paylaş, sürüyü büyüt</h3>
        <p className="mt-3 text-ink/75">
          Her üyenin kendine özel referans linki var. Tıklayan, başvuran ve onaylanan herkes için XP kazanırsın.
        </p>
      </div>
    </div>
  );
}

async function RankCell() {
  await connection();
  const ranks = await listRanks();
  return (
    <div className="flex min-h-64 flex-col justify-between bg-coal p-8 lg:col-span-7">
      <ul className="flex flex-wrap gap-1.5">
        {ranks.map((rank) => (
          <li key={rank.id}>
            <RankBadge name={rank.name} order={rank.sortOrder} />
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <h3 className="display text-4xl">Rütbe verilir</h3>
        <p className="mt-3 text-fog">
          Başvurular tek tek incelenir. Yönetim onaylarken rütbeni de belirler.
        </p>
      </div>
    </div>
  );
}
