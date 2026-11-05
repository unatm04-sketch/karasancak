import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, ListSkeleton, PageHeader, Pagination, parsePage } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth/dal";
import type { ApplicationStatus } from "@/lib/db/schema";
import { timeAgo } from "@/lib/format";
import { ADMIN_PAGE_SIZE, listApplications } from "@/lib/queries/admin";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = { title: "Başvurular" };

const TABS: Array<{ key: ApplicationStatus; label: string }> = [
  { key: "pending", label: "Bekleyen" },
  { key: "approved", label: "Onaylanan" },
  { key: "rejected", label: "Reddedilen" },
];

export default function ApplicationsPage({ searchParams }: PageProps<"/yonetim/basvurular">) {
  return (
    <>
      <PageHeader title="Başvurular" description="Her başvuruyu tek tek incele, onaylarken rütbesini ver." />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <ApplicationList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ApplicationList({ searchParams }: Pick<PageProps<"/yonetim/basvurular">, "searchParams">) {
  const [, { durum, sayfa }] = await Promise.all([requireAdmin(), searchParams]);
  const status: ApplicationStatus = durum === "approved" || durum === "rejected" ? durum : "pending";
  const page = parsePage(sayfa);
  const { items, total } = await listApplications(status, page);
  const now = await requestTime();

  return (
    <>
      <nav aria-label="Durum" className="mb-6 flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "pending" ? "/yonetim/basvurular" : `/yonetim/basvurular?durum=${tab.key}`}
            aria-current={tab.key === status ? "page" : undefined}
            className={`border px-4 py-2 text-sm font-medium ${
              tab.key === status ? "border-bone bg-bone text-ink" : "border-line text-fog hover:border-bone hover:text-bone"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState title={status === "pending" ? "Bekleyen başvuru yok" : "Kayıt yok"}>
          {status === "pending" ? "Yeni başvurular geldikçe burada listelenir." : undefined}
        </EmptyState>
      ) : (
        <ul className="panel divide-y divide-line">
          {items.map((application) => (
            <li key={application.id}>
              <Link href={`/yonetim/basvurular/${application.id}`} className="block p-4 transition-colors hover:bg-ash md:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-lg font-semibold">{application.fullName}</p>
                  <p className="text-sm text-smoke">{timeAgo(application.reviewedAt ?? application.createdAt, now)}</p>
                </div>
                <p className="mt-1 text-sm text-fog">
                  @{application.username}, {application.city}
                  {application.referrerName && (
                    <span className="ml-2 font-medium text-bone">Davet eden: {application.referrerName}</span>
                  )}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-fog">{application.motivation}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        total={total}
        perPage={ADMIN_PAGE_SIZE}
        basePath="/yonetim/basvurular"
        query={{ durum: status === "pending" ? undefined : status }}
      />
    </>
  );
}
