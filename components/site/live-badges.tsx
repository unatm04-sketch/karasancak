"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChatCircleDots } from "@/components/ui/icons";

const POLL_MS = 30_000;

function Count({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center bg-al px-1 text-[10px] font-bold leading-none text-bone">
      {value > 99 ? "99+" : value}
    </span>
  );
}

/** Mesaj ve bildirim sayaçları. Sekme açıkken arada bir sunucuya sorar. */
export function LiveBadges({
  initialNotifications,
  initialMessages,
}: {
  initialNotifications: number;
  initialMessages: number;
}) {
  const [counts, setCounts] = useState({
    notifications: initialNotifications,
    messages: initialMessages,
  });
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/ozet", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        setCounts(await res.json());
      } catch {
        // Bağlantı koptuysa bir sonraki denemeyi bekle.
      }
    };
    refresh();
    const interval = window.setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pathname]);

  return (
    <>
      <Link
        href="/mesajlar"
        aria-label={`Mesajlar${counts.messages ? `, ${counts.messages} okunmamış` : ""}`}
        className="relative inline-flex size-11 items-center justify-center text-fog hover:text-bone"
      >
        <ChatCircleDots size={22} />
        <Count value={counts.messages} />
      </Link>
      <Link
        href="/bildirimler"
        aria-label={`Bildirimler${counts.notifications ? `, ${counts.notifications} okunmamış` : ""}`}
        className="relative inline-flex size-11 items-center justify-center text-fog hover:text-bone"
      >
        <Bell size={22} />
        <Count value={counts.notifications} />
      </Link>
    </>
  );
}
