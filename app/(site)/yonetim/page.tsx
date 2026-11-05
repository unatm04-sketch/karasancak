import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/member/avatar";
import { buttonClass } from "@/components/ui/button";
import { ListSkeleton, PageHeader, SectionTitle, StatTile } from "@/components/ui/page";
import { requireStaff } from "@/lib/auth/dal";
import { formatNumber, timeAgo } from "@/lib/format";
import { adminOverview, listApplications, listAuditLogs } from "@/lib/queries/admin";
import { referralLeaderboard } from "@/lib/queries/members";
import { requestTime } from "@/lib/request";

export default function AdminHomePage() {
  return (
    <>
      <PageHeader title="Genel bakış" />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const user = await requireStaff();
  const now = await requestTime();
  const [stats, pending, logs, inviters] = await Promise.all([
    adminOverview(now),
    user.role === "admin" ? listApplications("pending", 1) : Promise.resolve({ items: [], total: 0 }),
    listAuditLogs(8),
    referralLeaderboard(5),
  ]);

  return (
    <div className="grid gap-10">
      <section className="panel grid grid-cols-2 gap-6 p-6 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Aktif üye" value={formatNumber(stats.members)} />
        <StatTile label="Bekleyen başvuru" value={<span className={stats.pending > 0 ? "text-al-bright" : ""}>{formatNumber(stats.pending)}</span>} />
        <StatTile label="Son 7 günde yeni üye" value={formatNumber(stats.newMembers)} />
        <StatTile label="Konu / yazı" value={`${formatNumber(stats.topics)} / ${formatNumber(stats.posts)}`} />
        <StatTile label="Bugün dağıtılan XP" value={formatNumber(stats.xpToday)} />
        <StatTile label="7 günde referans ziyareti" value={formatNumber(stats.referralClicks)} />
      </section>

      <div className="grid gap-10 xl:grid-cols-2">
        {user.role === "admin" && (
          <section aria-labelledby="bekleyenler">
            <SectionTitle
              aside={
                <Link href="/yonetim/basvurular" className="text-sm font-semibold hover:text-al-bright">
                  Tümü
                </Link>
              }
            >
              <span id="bekleyenler">Onay bekleyenler</span>
            </SectionTitle>
            {pending.items.length === 0 ? (
              <p className="panel p-5 text-fog">Bekleyen başvuru yok.</p>
            ) : (
              <ul className="panel divide-y divide-line">
                {pending.items.slice(0, 6).map((application) => (
                  <li key={application.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{application.fullName}</p>
                      <p className="text-sm text-fog">
                        {application.city}, {timeAgo(application.createdAt, now)}
                        {application.referrerName ? `, davet eden ${application.referrerName}` : ""}
                      </p>
                    </div>
                    <Link href={`/yonetim/basvurular/${application.id}`} className={buttonClass("ghost", "sm")}>
                      İncele
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section aria-labelledby="son-islemler">
          <SectionTitle>
            <span id="son-islemler">Son işlemler</span>
          </SectionTitle>
          {logs.length === 0 ? (
            <p className="panel p-5 text-fog">Henüz kayıt yok.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {logs.map((log) => (
                <li key={log.id} className="p-4">
                  <p className="text-sm">{log.summary}</p>
                  <p className="mt-0.5 text-xs text-smoke">
                    {log.actorName ?? "Sistem"}, {timeAgo(log.createdAt, now)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="davetciler">
          <SectionTitle>
            <span id="davetciler">En çok davet edenler</span>
          </SectionTitle>
          {inviters.length === 0 ? (
            <p className="panel p-5 text-fog">Henüz onaylanmış davet yok.</p>
          ) : (
            <ol className="panel divide-y divide-line">
              {inviters.map((member) => (
                <li key={member.id} className="flex items-center gap-3 p-3">
                  <Avatar user={member} size="sm" />
                  <Link href={`/yonetim/uyeler/${member.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-al-bright">
                    {member.displayName}
                  </Link>
                  <span className="text-sm text-fog">{member.invites} üye</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
