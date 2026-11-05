import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { listAuditLogs } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "İşlem kayıtları" };

export default function AuditLogPage() {
  return (
    <>
      <PageHeader title="İşlem kayıtları" description="Yönetimin yaptığı değişikliklerin dökümü." />
      <Suspense fallback={<ListSkeleton rows={10} />}>
        <AuditList />
      </Suspense>
    </>
  );
}

async function AuditList() {
  await requireAdmin();
  const logs = await listAuditLogs(200);
  if (logs.length === 0) return <EmptyState title="Henüz kayıt yok" />;
  return (
    <ul className="panel divide-y divide-line">
      {logs.map((log) => (
        <li key={log.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 p-4">
          <p className="text-sm">{log.summary}</p>
          <p className="text-xs text-smoke">
            {log.actorName ?? "Sistem"}, {formatDateTime(log.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
