import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { levelProgress, tierForLevel } from "@/lib/xp/levels";

/** Rütbe: yönetimin verdiği unvan. Yüksek rütbeler daha belirgindir. */
export function RankBadge({
  name,
  order,
  className = "",
}: {
  name: string | null | undefined;
  order?: number | null;
  className?: string;
}) {
  if (!name) return null;
  const tone =
    (order ?? 0) >= 60
      ? "bg-al text-bone border-al"
      : (order ?? 0) >= 40
        ? "bg-bone text-ink border-bone"
        : "border-line text-fog";
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 text-[11px] font-semibold uppercase leading-none tracking-wide ${tone} ${className}`}
    >
      {name}
    </span>
  );
}

/** Seviye: kullanıma göre otomatik yükselir. */
export function LevelBadge({ level, className = "" }: { level: number; className?: string }) {
  const tier = tierForLevel(level);
  return (
    <span
      title={`Seviye ${level}, ${tier.name}`}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase leading-none tracking-wide text-smoke ${className}`}
    >
      <span className="text-bone">Sv.{level}</span>
      <span className="hidden sm:inline">{tier.name}</span>
    </span>
  );
}

export function MemberLink({
  username,
  displayName,
  className = "",
}: {
  username: string;
  displayName: string;
  className?: string;
}) {
  return (
    <Link href={`/uye/${username}`} className={`font-semibold text-bone hover:text-al-bright ${className}`}>
      {displayName}
    </Link>
  );
}

export function RoleBadge({ role }: { role: "member" | "moderator" | "admin" }) {
  if (role === "member") return null;
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-al-bright">
      {role === "admin" ? "Yönetim" : "Moderatör"}
    </span>
  );
}

/** Seviye ilerleme çubuğu. Dolgusu kartal çizgileridir. */
export function XpBar({ xp, compact = false }: { xp: number; compact?: boolean }) {
  const p = levelProgress(xp);
  return (
    <div>
      {!compact && (
        <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
          <span className="text-fog">
            <span className="font-semibold text-bone">{formatNumber(p.current)}</span> / {formatNumber(p.needed)} XP
          </span>
          <span className="text-smoke">Seviye {p.level + 1} için {formatNumber(p.remaining)} XP</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={p.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Seviye ${p.level} ilerlemesi`}
        className={`bg-ash ${compact ? "h-1.5" : "h-3"}`}
      >
        <div
          className="stripes h-full [--stripe:6px] transition-[width] duration-700"
          style={{ width: `${p.percent}%` }}
        />
      </div>
    </div>
  );
}
