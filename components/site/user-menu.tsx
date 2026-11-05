"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/member/avatar";
import {
  CaretDown,
  GearSix,
  House,
  ListChecks,
  ShieldStar,
  SignOut,
  UserCircle,
} from "@/components/ui/icons";
import { logout } from "@/lib/actions/auth";

type MenuUser = {
  id: string;
  username: string;
  displayName: string;
  avatarVersion: number;
  level: number;
  role: "member" | "moderator" | "admin";
};

export function UserMenu({ user }: { user: MenuUser }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Menünün hangi sayfada açıldığı tutulur: sayfa değişince kendiliğinden kapanmış sayılır.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpenOn(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isStaff = user.role === "admin" || user.role === "moderator";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpenOn(open ? null : pathname)}
        className="flex h-11 items-center gap-2 pl-1 pr-1 text-sm text-fog hover:text-bone"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden max-w-32 truncate font-medium md:inline">{user.displayName}</span>
        <CaretDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="sr-only">Hesap menüsü</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-60 border border-line bg-coal py-1 shadow-[0_18px_40px_rgb(0_0_0/0.55)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="truncate text-xs text-smoke">
              @{user.username} · Seviye {user.level}
            </p>
          </div>
          <MenuLink href="/panel" icon={<House size={18} />}>Panelim</MenuLink>
          <MenuLink href={`/uye/${user.username}`} icon={<UserCircle size={18} />}>Profilim</MenuLink>
          <MenuLink href="/gorevler" icon={<ListChecks size={18} />}>XP ve görevler</MenuLink>
          <MenuLink href="/ayarlar" icon={<GearSix size={18} />}>Ayarlar</MenuLink>
          {isStaff && (
            <MenuLink href="/yonetim" icon={<ShieldStar size={18} />}>Yönetim paneli</MenuLink>
          )}
          <form action={logout} className="border-t border-line">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-fog hover:bg-ash hover:text-bone"
            >
              <SignOut size={18} />
              Çıkış yap
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-fog hover:bg-ash hover:text-bone"
    >
      {icon}
      {children}
    </Link>
  );
}
