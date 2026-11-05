"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Masaüstünde liste ve sohbet yan yana; mobilde aynı anda biri görünür. */
export function MessagesShell({ list, children }: { list: ReactNode; children: ReactNode }) {
  const inThread = usePathname() !== "/mesajlar";
  return (
    <div className="mx-auto grid w-full max-w-[1500px] flex-1 md:grid-cols-[340px_1fr] md:px-10 md:py-8">
      <aside className={`min-w-0 border-line md:block md:border md:border-r-0 ${inThread ? "hidden" : "block"}`}>{list}</aside>
      <section className={`min-w-0 border-line md:block md:border ${inThread ? "block" : "hidden"}`}>{children}</section>
    </div>
  );
}
