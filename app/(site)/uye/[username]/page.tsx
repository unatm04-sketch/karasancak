import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RichText } from "@/components/forum/rich-text";
import { Avatar } from "@/components/member/avatar";
import { RankBadge, RoleBadge, XpBar } from "@/components/member/badges";
import { buttonClass } from "@/components/ui/button";
import { ChatCircleDots, Fire, FlagBanner, InstagramLogo, MapPin, PencilSimple, ShieldStar } from "@/components/ui/icons";
import { ListSkeleton, PageContainer, SectionTitle, Skeleton, StatTile } from "@/components/ui/page";
import { startConversation } from "@/lib/actions/messages";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import { recentPostsByUser } from "@/lib/queries/forum";
import { getProfileByUsername, getProfileStats, listAchievements } from "@/lib/queries/members";
import { tierForLevel } from "@/lib/xp/levels";
import { ACHIEVEMENTS, type AchievementKey } from "@/lib/xp/rules";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = { title: "Üye profili" };

export default function ProfilePage({ params }: PageProps<"/uye/[username]">) {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <>
            <Skeleton className="mb-10 h-56 w-full" />
            <ListSkeleton rows={4} />
          </>
        }
      >
        <ProfileContent params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function ProfileContent({ params }: Pick<PageProps<"/uye/[username]">, "params">) {
  const [{ username }, viewer] = await Promise.all([params, getCurrentUser()]);
  const profile = await getProfileByUsername(decodeURIComponent(username));
  if (!profile || profile.status !== "active") notFound();

  const [stats, achievements, recent] = await Promise.all([
    getProfileStats(profile.id),
    listAchievements(profile.id),
    recentPostsByUser(profile.id, viewer !== null),
  ]);
  const now = await requestTime();
  const tier = tierForLevel(profile.level);
  const own = viewer?.id === profile.id;

  return (
    <div className="grid gap-10">
      <section className="panel stripes-soft p-6 md:p-10">
        <div className="flex flex-wrap items-start gap-6">
          <Avatar user={profile} size="xl" className="max-sm:size-20 max-sm:text-2xl" />
          <div className="min-w-0 flex-1 max-sm:order-3 max-sm:basis-full">
            <h1 className="display text-5xl md:text-6xl">{profile.displayName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-fog">
              <span>@{profile.username}</span>
              <RankBadge name={profile.rankName} order={profile.rankOrder} />
              <RoleBadge role={profile.role} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-fog">
              {profile.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  {profile.city}
                </span>
              )}
              {profile.tribune && (
                <span className="flex items-center gap-1.5">
                  <FlagBanner size={16} />
                  {profile.tribune}
                </span>
              )}
              {profile.instagram && (
                <a
                  href={`https://www.instagram.com/${profile.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1.5 hover:text-bone"
                >
                  <InstagramLogo size={16} />
                  {profile.instagram}
                </a>
              )}
              {profile.streak > 0 && (
                <span className="flex items-center gap-1.5">
                  <Fire size={16} />
                  {profile.streak} günlük seri
                </span>
              )}
              <span>{formatDate(profile.createdAt)} tarihinden beri sürüde</span>
            </div>
          </div>
          <div className="flex gap-2 max-sm:ml-auto">
            {own ? (
              <Link href="/ayarlar" className={buttonClass("ghost", "md")}>
                <PencilSimple size={16} />
                Düzenle
              </Link>
            ) : viewer ? (
              <form action={startConversation.bind(null, profile.username)}>
                <button type="submit" className={buttonClass("primary", "md")}>
                  <ChatCircleDots size={16} />
                  Mesaj gönder
                </button>
              </form>
            ) : null}
          </div>
        </div>

        {profile.bio && <RichText text={profile.bio} className="mt-6 max-w-[62ch] text-fog" />}

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="display text-4xl">
              Seviye {profile.level} <span className="text-fog">{tier.name}</span>
            </p>
            <p className="mb-3 mt-1 text-sm text-fog">{formatNumber(profile.xp)} XP</p>
            <XpBar xp={profile.xp} compact />
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-5 lg:col-span-6">
            <StatTile label="Konu" value={formatNumber(stats.topics)} />
            <StatTile label="Yazı" value={formatNumber(stats.posts)} />
            <StatTile label="Beğeni" value={formatNumber(stats.likes)} />
            <StatTile label="Davet" value={formatNumber(stats.invites)} />
            <StatTile label="Etkinlik" value={formatNumber(stats.events)} />
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="son-yazilar">
          <SectionTitle>
            <span id="son-yazilar">Son yazılar</span>
          </SectionTitle>
          {recent.length === 0 ? (
            <p className="panel p-5 text-fog">Henüz yazı yok.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {recent.map((post) => (
                <li key={post.id} className="p-4">
                  <Link href={`/forum/konu/${post.topicSlug}#yazi-${post.id}`} className="font-semibold hover:text-al-bright">
                    {post.topicTitle}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-fog">{post.body}</p>
                  <p className="mt-1 text-xs text-smoke">{timeAgo(post.createdAt, now)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="lg:col-span-5" aria-labelledby="profil-nisan">
          <SectionTitle>
            <span id="profil-nisan">Nişanlar</span>
          </SectionTitle>
          {achievements.length === 0 ? (
            <p className="panel p-5 text-fog">Henüz nişan yok.</p>
          ) : (
            <ul className="grid gap-2">
              {achievements.map((a) => {
                const def = ACHIEVEMENTS[a.key as AchievementKey];
                if (!def) return null;
                return (
                  <li key={a.key} className="panel flex items-center gap-3 p-3">
                    <ShieldStar size={24} weight="fill" className="shrink-0 text-al-bright" />
                    <div>
                      <p className="font-semibold leading-tight">{def.name}</p>
                      <p className="text-xs text-fog">{def.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
