import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/member/avatar";
import { RankBadge, XpBar } from "@/components/member/badges";
import { ActionForm, Field, FormMessage, GeneratedLink, SelectField, SubmitButton } from "@/components/ui/form";
import { PageHeader, SectionTitle, Skeleton, StatTile } from "@/components/ui/page";
import { adjustMemberXp, createPasswordLink, updateMember } from "@/lib/actions/admin-members";
import { requireAdmin } from "@/lib/auth/dal";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import { getMember, listXpLog } from "@/lib/queries/admin";
import { getProfileStats, listRanks, referralStats } from "@/lib/queries/members";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = { title: "Üye" };

export default function MemberDetailPage({ params }: PageProps<"/yonetim/uyeler/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
      <MemberDetail params={params} />
    </Suspense>
  );
}

async function MemberDetail({ params }: Pick<PageProps<"/yonetim/uyeler/[id]">, "params">) {
  const [{ id }] = await Promise.all([params, requireAdmin()]);
  const [member, ranks, stats, referrals, log] = await Promise.all([
    getMember(id),
    listRanks(),
    getProfileStats(id),
    referralStats(id),
    listXpLog(15, id),
  ]);
  if (!member) notFound();
  const now = await requestTime();

  return (
    <>
      <PageHeader title={member.displayName} breadcrumb={[{ href: "/yonetim/uyeler", label: "Üyeler" }]} />

      <section className="panel mb-8 flex flex-wrap items-center gap-6 p-5 md:p-6">
        <Avatar user={member} size="lg" />
        <div className="min-w-48 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm text-fog">
            <Link href={`/uye/${member.username}`} className="font-semibold text-bone underline underline-offset-2 hover:text-al-bright">
              @{member.username}
            </Link>
            <RankBadge name={member.rankName} order={member.rankOrder} />
            <span>{formatDate(member.createdAt)} tarihinde katıldı</span>
            {member.referrerName && <span>Davet eden: {member.referrerName}</span>}
          </div>
          <p className="mt-2 text-sm text-fog">
            Seviye {member.level}, {formatNumber(member.xp)} XP
            {member.lastSeenAt ? `, son görülme ${timeAgo(member.lastSeenAt, now)}` : ""}
          </p>
          <div className="mt-2 max-w-md">
            <XpBar xp={member.xp} compact />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5 md:grid-cols-6">
          <StatTile label="Konu" value={formatNumber(stats.topics)} />
          <StatTile label="Yazı" value={formatNumber(stats.posts)} />
          <StatTile label="Beğeni" value={formatNumber(stats.likes)} />
          <StatTile label="Davet" value={formatNumber(stats.invites)} />
          <StatTile label="Etkinlik" value={formatNumber(stats.events)} />
          <StatTile label="Ref. ziyaret" value={formatNumber(referrals.clicks)} />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-12">
        <section className="xl:col-span-7" aria-labelledby="uye-bilgi">
          <SectionTitle>
            <span id="uye-bilgi">Üye bilgileri</span>
          </SectionTitle>
          <ActionForm action={updateMember.bind(null, member.id)} className="panel flex flex-col gap-5 p-5 md:p-6">
            <FormMessage />
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField label="Rütbe" name="rankId" defaultValue={member.rankId ?? ""}>
                <option value="">Rütbesiz</option>
                {ranks.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Yetki" name="role" defaultValue={member.role}>
                <option value="member">Üye</option>
                <option value="moderator">Moderatör</option>
                <option value="admin">Yönetici</option>
              </SelectField>
              <Field label="Ad soyad" name="displayName" defaultValue={member.displayName} required />
              <SelectField
                label="Durum"
                name="status"
                defaultValue={member.status}
                help="Askıya alınan üye tüm cihazlardan çıkarılır."
              >
                <option value="active">Aktif</option>
                <option value="suspended">Askıda</option>
              </SelectField>
              <Field label="E-posta" name="email" type="email" defaultValue={member.email ?? ""} />
              <Field label="Telefon" name="phone" type="tel" defaultValue={member.phone ?? ""} />
              <Field label="Şehir" name="city" defaultValue={member.city ?? ""} />
            </div>
            <div>
              <SubmitButton pendingLabel="Kaydediliyor...">Kaydet</SubmitButton>
            </div>
          </ActionForm>

          <SectionTitle>
            <span className="mt-10 block">XP hareketleri</span>
          </SectionTitle>
          {log.length === 0 ? (
            <p className="panel p-5 text-fog">Henüz XP hareketi yok.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {log.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{event.ruleKey === "manual" ? `Elle: ${event.reason ?? ""}` : (event.label ?? event.reason ?? event.ruleKey)}</p>
                    <p className="text-xs text-smoke">
                      {timeAgo(event.createdAt, now)}
                      {event.actorName ? `, ${event.actorName}` : ""}
                    </p>
                  </div>
                  <span className={`display text-lg ${event.amount < 0 ? "text-al-bright" : ""}`}>
                    {event.amount > 0 ? "+" : ""}
                    {event.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-8 xl:col-span-5">
          <section aria-labelledby="xp-duzelt">
            <SectionTitle>
              <span id="xp-duzelt">XP düzelt</span>
            </SectionTitle>
            <ActionForm action={adjustMemberXp.bind(null, member.id)} resetOnSuccess className="panel flex flex-col gap-4 p-5 md:p-6">
              <FormMessage />
              <Field label="Miktar" name="amount" type="number" help="Düşmek için eksi değer gir. Örn: -50" required />
              <Field label="Sebep" name="reason" help="Üyeye bildirim olarak gider." required />
              <div>
                <SubmitButton variant="ghost" pendingLabel="İşleniyor...">
                  XP işle
                </SubmitButton>
              </div>
            </ActionForm>
          </section>

          <section aria-labelledby="sifre-link">
            <SectionTitle>
              <span id="sifre-link">{member.hasPassword ? "Şifre sıfırlama" : "Aktivasyon"}</span>
            </SectionTitle>
            <ActionForm action={createPasswordLink.bind(null, member.id)} className="panel flex flex-col gap-4 p-5 md:p-6">
              <p className="text-sm text-fog">
                {member.hasPassword
                  ? "Üye şifresini unuttuysa tek kullanımlık bir link üret."
                  : "Üye henüz şifresini belirlemedi. Yeni bir aktivasyon linki üretebilirsin."}
              </p>
              <FormMessage />
              <GeneratedLink label="Tek kullanımlık link" />
              <div>
                <SubmitButton variant="ghost" pendingLabel="Üretiliyor...">
                  Link üret
                </SubmitButton>
              </div>
            </ActionForm>
          </section>
        </aside>
      </div>
    </>
  );
}
