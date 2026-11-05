import Link from "next/link";
import type { ReactNode } from "react";
import { CaretRight } from "./icons";

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1500px] px-5 py-10 md:px-10 md:py-14 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: Array<{ href: string; label: string }>;
}) {
  return (
    <header className="mb-10">
      {breadcrumb && (
        <nav aria-label="Konum" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-smoke">
          {breadcrumb.map((item) => (
            <span key={item.href} className="flex items-center gap-1.5">
              <Link href={item.href} className="hover:text-bone">
                {item.label}
              </Link>
              <CaretRight size={12} />
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <h1 className="display text-[clamp(2.6rem,6vw,5rem)]">{title}</h1>
          {description && <p className="mt-3 max-w-[60ch] leading-relaxed text-fog">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="display text-2xl md:text-3xl">{children}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="stripes-soft border border-line px-6 py-14 text-center">
      <p className="display text-3xl">{title}</p>
      {children && <p className="mx-auto mt-3 max-w-[46ch] text-fog">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Sayfa içeriği akana kadar görünen genel iskelet */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <PageContainer>
      <Skeleton className="mb-10 h-14 w-72 max-w-full" />
      <ListSkeleton />
    </PageContainer>
  );
}

export function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="display text-3xl md:text-4xl">{value}</p>
      <p className="mt-1 text-xs text-smoke">{label}</p>
    </div>
  );
}

/** ?sayfa=2 biçimli sayfalama. Sayfa sayısı tek ise hiç görünmez. */
export function Pagination({
  page,
  total,
  perPage,
  basePath,
  query = {},
}: {
  page: number;
  total: number;
  perPage: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    if (p > 1) params.set("sayfa", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const shown = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 2,
  );

  return (
    <nav aria-label="Sayfalar" className="mt-8 flex flex-wrap items-center gap-1">
      {shown.map((p, index) => {
        const gap = index > 0 && p - shown[index - 1]! > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-smoke">...</span>}
            <Link
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={`inline-flex h-10 min-w-10 items-center justify-center border px-3 text-sm font-medium ${
                p === page ? "border-bone bg-bone text-ink" : "border-line text-fog hover:border-bone hover:text-bone"
              }`}
            >
              {p}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}

export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
