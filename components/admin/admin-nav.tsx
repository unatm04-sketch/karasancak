"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import {
  CalendarDots,
  ChatsCircle,
  FlagBanner,
  House,
  Lightning,
  ListChecks,
  Medal,
  Megaphone,
  SoccerBall,
  UserPlus,
  Users,
} from "@/components/ui/icons";

const ITEMS = [
  { href: "/yonetim", label: "Genel bakış", icon: House, exact: true },
  { href: "/yonetim/basvurular", label: "Başvurular", icon: UserPlus, badge: true },
  { href: "/yonetim/uyeler", label: "Üyeler", icon: Users },
  { href: "/yonetim/rutbeler", label: "Rütbeler", icon: Medal },
  { href: "/yonetim/xp", label: "XP kuralları", icon: Lightning },
  { href: "/yonetim/forum", label: "Forum", icon: ChatsCircle },
  { href: "/yonetim/maclar", label: "Maçlar", icon: SoccerBall },
  { href: "/yonetim/etkinlikler", label: "Etkinlikler", icon: CalendarDots },
  { href: "/yonetim/duyurular", label: "Duyurular", icon: Megaphone },
  { href: "/yonetim/kayitlar", label: "İşlem kayıtları", icon: ListChecks },
] as const;

function NavList({ pathname, pendingBadge }: { pathname: string | null; pendingBadge: ReactNode }) {
  return (
    <ul className="scroll-clean flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map((item) => {
        const active =
          pathname !== null && ("exact" in item ? pathname === item.href : pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-bone text-ink" : "text-fog hover:bg-ash hover:text-bone"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {"badge" in item && <span className="ml-auto">{pendingBadge}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavList({ pendingBadge }: { pendingBadge: ReactNode }) {
  return <NavList pathname={usePathname()} pendingBadge={pendingBadge} />;
}

export function AdminNav({ pendingBadge }: { pendingBadge: ReactNode }) {
  return (
    <nav aria-label="Yönetim menüsü">
      <p className="mb-3 hidden items-center gap-2 px-3 text-sm font-semibold text-fog lg:flex">
        <FlagBanner size={18} />
        Yönetim
      </p>
      {/* Etkin sayfa yalnızca istek anında bilinir; o ana kadar menü işaretsiz görünür. */}
      <Suspense fallback={<NavList pathname={null} pendingBadge={null} />}>
        <ActiveNavList pendingBadge={pendingBadge} />
      </Suspense>
    </nav>
  );
}
