import Link from "next/link";
import { Suspense } from "react";
import { Emblem } from "@/components/brand/emblem";
import { HeaderUser } from "./header-user";
import { MobileNav } from "./mobile-nav";

export const NAV_LINKS = [
  { href: "/forum", label: "Forum" },
  { href: "/maclar", label: "Maçlar" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/siralama", label: "Sıralama" },
  { href: "/duyurular", label: "Duyurular" },
] as const;

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-30"
          : "sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex h-[68px] max-w-[1500px] items-center gap-8 px-5 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Kara Sancak ana sayfa">
          <Emblem className="h-11 w-auto" title="" />
          <span className="display hidden text-xl sm:inline">Kara Sancak</span>
        </Link>

        <nav aria-label="Ana menü" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-fog transition-colors hover:text-bone"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Suspense fallback={<div className="h-11 w-24 sm:w-44" />}>
            <HeaderUser />
          </Suspense>
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
