"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { List, X } from "@/components/ui/icons";

export function MobileNav({ links }: { links: ReadonlyArray<{ href: string; label: string }> }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        onClick={() => setOpen((value) => !value)}
        className="relative z-50 inline-flex size-11 items-center justify-center text-bone"
      >
        {open ? <X size={24} /> : <List size={24} />}
      </button>
      {open && (
        <nav aria-label="Mobil menü" className="fixed inset-0 z-40 flex flex-col justify-center gap-1 bg-ink px-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={close} className="display py-2 text-5xl hover:text-al-bright">
              {link.label}
            </Link>
          ))}
          <div className="mt-8 flex gap-6 text-fog">
            <Link href="/giris" onClick={close} className="hover:text-bone">
              Giriş
            </Link>
            <Link href="/gorevler" onClick={close} className="hover:text-bone">
              XP ve görevler
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
