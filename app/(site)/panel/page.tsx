import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TopicRow } from "@/components/forum/topic-row";
import { Avatar } from "@/components/member/avatar";
import { RankBadge, XpBar } from "@/components/member/badges";
import { ReferralShare } from "@/components/member/referral-share";
import { PredictionForm } from "@/components/match/prediction-form";
import { buttonClass } from "@/components/ui/button";
import { ArrowRight, CalendarDots, Check, Fire, MapPin, ShieldStar } from "@/components/ui/icons";
import { ListSkeleton, PageContainer, SectionTitle, Skeleton, StatTile } from "@/components/ui/page";
import { dailyCheckIn } from "@/lib/actions/engagement";
import { requireUser } from "@/lib/auth/dal";
import { formatDate, formatDateTime, formatNumber, formatTime, istanbulDay, timeAgo } from "@/lib/format";
import { getNextMatch, getUserPredictions, listUpcomingEvents, getUserRsvp } from "@/lib/queries/content";
import { latestTopics } from "@/lib/queries/forum";
import {
  getProfileStats,
  listAchievements,
  listXpRules,
  recentXpEvents,
  referralStats,
  todaysRuleCounts,
} from "@/lib/queries/members";
import { getBaseUrl, requestTime } from "@/lib/request";
import { nextTier, tierForLevel } from "@/lib/xp/levels";
import { ACHIEVEMENTS, type AchievementKey } from "@/lib/xp/rules";

export const metadata: Metadata = { title: "Panelim", robots: { index: false } };

export default function PanelPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <>
            <Skeleton className="mb-10 h-48 w-full" />
            <ListSkeleton rows={5} />
          </>
        }
      >
        <PanelContent />
      </Suspense>
    </PageContainer>
  );
}

/** Bugünün görevleri: panelde gösterilecek kurallar ve yönlendirdikleri yer */
const QUESTS = [
  { key: "post_create", title: "Foruma yaz", href: "/forum" },
  { key: "topic_create", title: "Yeni konu aç", href: "/forum/yeni" },
  { key: "like_given", title: "Bir yazıyı beğen", href: "/forum" },
  { key: "message_sent", title: "Tribünde yaz", href: "/mesajlar/tribun" },
  { key: "referral_share", title: "Linkini paylaş", href: "#referans" },
];

async function PanelContent() {
  const user = await requireUser();
  const now = await requestTime();
  const today = istanbulDay(now);

  const [stats, referrals, rules, counts, events, achievements, upcoming, match, predictions, topics, baseUrl] =
    await Promise.all([
      getProfileStats(user.id),
      referralStats(user.id),
      listXpRules(),
      todaysRuleCounts(user.id, now),
      recentXpEvents(user.id, 8),
      listAchievements(user.id),
      listUpcomingEvents(1, now),
      getNextMatch(now),
      getUserPredictions(user.id),
      latestTopics(5, true),
      getBaseUrl(),
    ]);

  const tier = tierForLevel(user.level);
  const next = nextTier(user.level);
  const checkedIn = user.lastCheckInDay === today;
  const ruleOf = (key: string) => rules.find((r) => r.key === key);
  const event = upcoming[0];
  const rsvp = event ? await getUserRsvp(event.id, user.id) : null;
  const referralUrl = `${baseUrl}/r/${user.referralCode}`;

  return (
    <div className="grid gap-10">
      {/* Kimlik ve ilerleme */}
      <section className="panel stripes-soft grid gap-8 p-6 md:p-8 lg:grid-cols-12 lg:items-center">
        <div className="flex items-center gap-5 lg:col-span-5">
          <Avatar user={user} size="xl" className="max-sm:size-20 max-sm:text-2xl" />
          <div className="min-w-0">
            <h1 className="display truncate text-4xl md:text-5xl">{user.displayName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fog">
              <RankBadge name={user.rankName} order={user.rankOrder} />
              <span>@{user.username}</span>
            </div>
            <Link href={`/uye/${user.username}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-al-bright">
              Profilimi gör <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="display text-5xl md:text-6xl">Seviye {user.level}</p>
              <p className="mt-1 text-fog">
                {tier.name}. {tier.note}
              </p>
            </div>
            <p className="text-right">
              <span className="display text-3xl">{formatNumber(user.xp)}</span>
              <span className="ml-1.5 text-sm text-fog">XP</span>
            </p>
          </div>
          <XpBar xp={user.xp} />
          {next && (
            <p className="mt-2 text-xs text-smoke">
              Seviye {next.from}&apos;da {next.name} olursun.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          {/* Yoklama ve görevler */}
          <section aria-labelledby="yoklama">
            <SectionTitle>
              <span id="yoklama">Bugün</span>
            </SectionTitle>
            <div className="panel divide-y divide-line">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-4">
                  <span
                    className={`flex size-12 items-center justify-center ${checkedIn ? "bg-bone text-ink" : "bg-al text-bone"}`}
                  >
                    {checkedIn ? <Check size={24} /> : <Fire size={24} weight="fill" />}
                  </span>
                  <div>
                    <p className="font-semibold">Günlük yoklama</p>
                    <p className="text-sm text-fog">
                      {user.streak > 0 ? `${user.streak} günlük seri. ` : ""}
                      Yedi gün üst üste gelene +{ruleOf("streak_7")?.amount ?? 50} XP.
                    </p>
                  </div>
                </div>
                {checkedIn ? (
                  <span className="text-sm font-medium text-fog">Yoklaman alındı</span>
                ) : (
                  <form action={dailyCheckIn}>
                    <button type="submit" className={buttonClass("primary", "md")}>
                      Yoklama ver +{ruleOf("daily_checkin")?.amount ?? 10} XP
                    </button>
                  </form>
                )}
              </div>
              {QUESTS.map((quest) => {
                const rule = ruleOf(quest.key);
                if (!rule || !rule.active) return null;
                const done = counts.get(quest.key)?.count ?? 0;
                const cap = rule.dailyCap;
                const finished = cap !== null && done >= cap;
                return (
                  <Link
                    key={quest.key}
                    href={quest.href}
                    className="flex items-center justify-between gap-4 p-4 px-5 transition-colors hover:bg-ash"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex size-6 items-center justify-center border ${finished ? "border-bone bg-bone text-ink" : done > 0 ? "border-bone" : "border-line"}`}
                      >
                        {finished && <Check size={14} />}
                      </span>
                      <span className={finished ? "text-smoke" : ""}>{quest.title}</span>
                    </span>
                    <span className="shrink-0 text-sm text-fog">
                      {cap !== null && `${Math.min(done, cap)}/${cap} · `}
                      <span className="font-semibold text-bone">+{rule.amount} XP</span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link href="/gorevler" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-al-bright">
              Tüm XP kuralları <ArrowRight size={15} />
            </Link>
          </section>

          {/* Referans */}
          <section id="referans" className="scroll-mt-24" aria-labelledby="referans-baslik">
            <SectionTitle>
              <span id="referans-baslik">Referans linkin</span>
            </SectionTitle>
            <div className="panel p-5 md:p-6">
              <p className="mb-4 leading-relaxed text-fog">
                Linkini paylaş. Her yeni ziyaretçi +{ruleOf("referral_click")?.amount ?? 2}, her başvuru +
                {ruleOf("referral_application")?.amount ?? 15}, her onaylanan üye +
                {ruleOf("referral_approved")?.amount ?? 150} XP.
              </p>
              <ReferralShare url={referralUrl} />
              <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
                <StatTile label="Ziyaretçi" value={formatNumber(referrals.clicks)} />
                <StatTile label="Başvuru" value={formatNumber(referrals.applications)} />
                <StatTile label="Onaylanan" value={formatNumber(referrals.approved)} />
                <StatTile label="Kazanılan XP" value={formatNumber(referrals.xp)} />
              </div>
            </div>
          </section>

          {/* Son konular */}
          <section aria-labelledby="forumda">
            <SectionTitle
              aside={
                <Link href="/forum" className="text-sm font-semibold hover:text-al-bright">
                  Forumu Gör
                </Link>
              }
            >
              <span id="forumda">Forumda</span>
            </SectionTitle>
            <ul>
              {topics.map((topic) => (
                <TopicRow key={topic.id} topic={topic} now={now} showCategory />
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-10 lg:col-span-5">
          {/* Sıradaki maç */}
          {match && (
            <section aria-labelledby="siradaki-mac">
              <SectionTitle>
                <span id="siradaki-mac">Sıradaki maç</span>
              </SectionTitle>
              <div className="panel p-5 md:p-6">
                <p className="text-sm text-fog">{match.competition}</p>
                <p className="display mt-1 text-3xl">
                  {match.homeTeam} - {match.awayTeam}
                </p>
                <p className="mt-1 text-sm text-fog">
                  {formatDate(match.kickoffAt)}, {formatTime(match.kickoffAt)}
                </p>
                <div className="mt-5">
                  <PredictionForm
                    matchId={match.id}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    current={predictions.get(match.id)}
                  />
                </div>
                <p className="mt-3 text-xs text-smoke">
                  Sonuç tutarsa +{ruleOf("prediction_outcome")?.amount ?? 20}, skor tam tutarsa +
                  {ruleOf("prediction_exact")?.amount ?? 75} XP.
                </p>
              </div>
            </section>
          )}

          {/* Sıradaki etkinlik */}
          {event && (
            <section aria-labelledby="siradaki-etkinlik">
              <SectionTitle>
                <span id="siradaki-etkinlik">Sıradaki etkinlik</span>
              </SectionTitle>
              <Link href={`/etkinlikler/${event.slug}`} className="panel block p-5 transition-colors hover:bg-ash md:p-6">
                <p className="display text-3xl">{event.title}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-fog">
                  <CalendarDots size={16} />
                  {event.timeAnnounced ? formatDateTime(event.startsAt) : `${formatDate(event.startsAt)}, saat duyurulacak`}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-fog">
                  <MapPin size={16} />
                  {event.location}
                  {event.city ? `, ${event.city}` : ""}
                </p>
                <p className="mt-3 text-sm font-semibold">
                  {rsvp ? "Katılımını bildirdin" : `Katıl, yoklamada +${event.xpReward} XP kazan`}
                </p>
              </Link>
            </section>
          )}

          {/* Nişanlar */}
          <section aria-labelledby="nisanlar">
            <SectionTitle>
              <span id="nisanlar">Nişanlar</span>
            </SectionTitle>
            {achievements.length === 0 ? (
              <p className="panel p-5 text-sm text-fog">İlk nişanını kazanmak için bir konu aç ya da etkinliğe katıl.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {achievements.map((a) => {
                  const def = ACHIEVEMENTS[a.key as AchievementKey];
                  if (!def) return null;
                  return (
                    <li key={a.key} className="panel flex items-start gap-3 p-3">
                      <ShieldStar size={22} weight="fill" className="mt-0.5 shrink-0 text-al-bright" />
                      <div>
                        <p className="font-semibold leading-tight">{def.name}</p>
                        <p className="mt-0.5 text-xs text-fog">{def.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* XP hareketleri */}
          <section aria-labelledby="xp-kayit">
            <SectionTitle>
              <span id="xp-kayit">Son XP hareketleri</span>
            </SectionTitle>
            {events.length === 0 ? (
              <p className="panel p-5 text-sm text-fog">Henüz XP hareketin yok. Yoklama vererek başla.</p>
            ) : (
              <ul className="panel divide-y divide-line">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {e.ruleKey === "manual" ? (e.reason ?? "Yönetim düzeltmesi") : (e.label ?? e.reason ?? "XP")}
                      </p>
                      <p className="text-xs text-smoke">{timeAgo(e.createdAt, now)}</p>
                    </div>
                    <span className={`display text-xl ${e.amount < 0 ? "text-al-bright" : ""}`}>
                      {e.amount > 0 ? "+" : ""}
                      {e.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid grid-cols-3 gap-5">
            <StatTile label="Konu" value={formatNumber(stats.topics)} />
            <StatTile label="Yazı" value={formatNumber(stats.posts)} />
            <StatTile label="Beğeni" value={formatNumber(stats.likes)} />
          </section>
        </div>
      </div>
    </div>
  );
}
