import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { getCurrentUser } from "@/lib/auth/session";
import { pendingApplicationCount } from "@/lib/queries/content";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s | Yönetim" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-6 px-5 py-6 md:px-10 lg:grid-cols-[230px_1fr] lg:gap-10 lg:py-10">
      <aside className="min-w-0">
        <div className="lg:sticky lg:top-24">
          <AdminNav
            pendingBadge={
              <Suspense fallback={null}>
                <PendingBadge />
              </Suspense>
            }
          />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

async function PendingBadge() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return null;
  const pending = await pendingApplicationCount();
  if (pending === 0) return null;
  return <span className="inline-flex h-5 min-w-5 items-center justify-center bg-al px-1.5 text-xs font-bold text-bone">{pending}</span>;
}
