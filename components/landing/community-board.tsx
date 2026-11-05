import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Emblem } from "@/components/brand/emblem";
import { Avatar } from "@/components/member/avatar";
import { RankBadge } from "@/components/member/badges";
import { ArrowRight } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { formatDate, formatNumber } from "@/lib/format";
import { listAnnouncements } from "@/lib/queries/content";
import { leaderboard } from "@/lib/queries/members";
import { tierForLevel } from "@/lib/xp/levels";
import { requestTime } from "@/lib/request";

export function CommunityBoard() {
  return (
    <section aria-label="Duyuru ve sıralama" className="border-t border-line bg-ink py-24 md:py-32">
      <div className="mx-auto grid max-w-[1500px] gap-14 px-5 md:px-10 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Suspense fallback={<div className="skeleton aspect-[4/5] w-full" />}>
            <AnnouncementPoster />
          </Suspense>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <Reveal>
            <h2 className="display text-[clamp(3rem,6vw,6rem)]">Sürünün önündekiler</h2>
          </Reveal>
          <Suspense fallback={<div className="skeleton mt-10 h-96" />}>
            <TopMembers />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

/** Gruptaki "Kamuoyuna Duyuru" kartlarıyla aynı afiş dili */
async function AnnouncementPoster() {
  await connection();
  const announcements = await listAnnouncements(5);
  const item = announcements.find((a) => a.kicker === "Kamuoyuna Duyuru") ?? announcements[0];
  if (!item) return null;

  const [first, ...rest] = item.kicker.toLocaleUpperCase("tr-TR").split(" ");
  return (
    <Reveal>
      <article className="bg-bone px-6 pb-8 text-center text-ink md:px-10">
        <div className="stripes -mx-6 mb-8 h-3 [--stripe:9px] md:-mx-10" />
        <Emblem className="mx-auto h-24 w-auto md:h-28" title="" />
        <p className="display mt-6 text-5xl md:text-6xl">{first}</p>
        {rest.length > 0 && <p className="display mt-1 text-5xl text-al md:text-6xl">{rest.join(" ")}</p>}
        <hr className="mx-auto mt-6 w-3/4 border-t-2 border-ink" />
        <p className="display mx-auto mt-6 max-w-md bg-al px-4 py-3 text-2xl text-bone md:text-3xl">{item.title}</p>
        <p className="mx-auto mt-6 max-w-md leading-relaxed text-ink/80">{item.body}</p>
        <p className="mt-6 text-sm text-ink/70">{formatDate(item.publishedAt)}</p>
        <p className="display mt-3 text-lg tracking-[0.2em]">Kara Sancak 1903</p>
        <Link
          href="/duyurular"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Tüm duyurular <ArrowRight size={16} />
        </Link>
      </article>
    </Reveal>
  );
}

async function TopMembers() {
  const top = await leaderboard("tum", 5, await requestTime());

  if (top.length === 0) {
    return (
      <div className="mt-10 border border-line p-10">
        <p className="display text-3xl">Sürünün ilk kurdu sen ol</p>
        <p className="mt-3 text-fog">Onaylanan ilk üyeler burada yerini alacak.</p>
      </div>
    );
  }

  const [leader, ...others] = top;
  return (
    <div className="mt-10">
      {leader && (
        <Reveal>
          <Link href={`/uye/${leader.username}`} className="group flex items-center gap-5 bg-coal p-6 md:p-8">
            <Avatar user={leader} size="xl" className="max-sm:size-20 max-sm:text-2xl" />
            <div className="min-w-0">
              <p className="display truncate text-4xl group-hover:text-al-bright md:text-5xl">{leader.displayName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-fog">
                <RankBadge name={leader.rankName} order={leader.rankOrder} />
                <span>Seviye {leader.level}, {tierForLevel(leader.level).name}</span>
              </div>
              <p className="mt-3 text-2xl font-semibold">{formatNumber(leader.xp)} XP</p>
            </div>
          </Link>
        </Reveal>
      )}
      <ol start={2} className="mt-2">
        {others.map((member, i) => (
          <li key={member.id}>
            <Link
              href={`/uye/${member.username}`}
              className="flex items-center gap-4 border-b border-line py-4 hover:bg-coal/60"
            >
              <span className="display w-6 text-2xl text-smoke">{i + 2}</span>
              <Avatar user={member} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium">{member.displayName}</span>
              <RankBadge name={member.rankName} order={member.rankOrder} className="max-sm:hidden" />
              <span className="shrink-0 text-sm text-fog">{formatNumber(member.xp)} XP</span>
            </Link>
          </li>
        ))}
      </ol>
      <Link href="/siralama" className="mt-6 inline-flex items-center gap-2 font-semibold hover:text-al-bright">
        Tüm sıralama <ArrowRight size={18} />
      </Link>
    </div>
  );
}
