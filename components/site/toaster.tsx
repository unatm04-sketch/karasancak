"use client";

import { useEffect, useState } from "react";
import { FLASH_COOKIE, type Toast } from "@/lib/toast";

type ShownToast = { id: number; toast: Toast };

let nextId = 1;

function readAndClearCookie(): Toast[] {
  const entry = document.cookie.split("; ").find((c) => c.startsWith(`${FLASH_COOKIE}=`));
  if (!entry) return [];
  document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0; samesite=lax`;
  try {
    return JSON.parse(decodeURIComponent(entry.slice(FLASH_COOKIE.length + 1))) as Toast[];
  } catch {
    return [];
  }
}

const LIFETIME_MS = { xp: 3800, level: 7000, info: 4200, error: 6000 } as const;

/**
 * Server Action'ların bıraktığı kısa ömürlü çerezi izler ve ekranda gösterir.
 * Yönlendirme yapan action'larda da çalışır. Cookie Store API varsa onu dinler,
 * yoksa saniyede bir kontrol eder.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<ShownToast[]>([]);

  useEffect(() => {
    const check = () => {
      const incoming = readAndClearCookie();
      if (incoming.length === 0) return;
      const shown = incoming.map((toast) => ({ id: nextId++, toast }));
      setToasts((current) => [...current, ...shown].slice(-5));
      for (const item of shown) {
        window.setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== item.id));
        }, LIFETIME_MS[item.toast.kind]);
      }
    };

    check();
    const store = (window as unknown as { cookieStore?: EventTarget }).cookieStore;
    if (store) {
      store.addEventListener("change", check);
      return () => store.removeEventListener("change", check);
    }
    const interval = window.setInterval(check, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,340px)] flex-col gap-2 pointer-events-none"
    >
      {toasts.map(({ id, toast }) => (
        <ToastCard key={id} toast={toast} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  switch (toast.kind) {
    case "xp":
      return (
        <div className="toast-in flex items-stretch border border-line bg-coal">
          <span className="display flex items-center bg-al px-3 py-2 text-xl text-bone">
            {toast.amount > 0 ? "+" : ""}
            {toast.amount} XP
          </span>
          <span className="flex items-center px-3 text-sm text-fog">{toast.label}</span>
        </div>
      );
    case "level":
      return (
        <div className="toast-in border border-bone bg-bone p-4 text-ink">
          <p className="display text-3xl">Seviye {toast.level}</p>
          <p className="mt-1 text-sm font-medium">Sürüdeki yerin: {toast.tier}</p>
        </div>
      );
    case "error":
      return (
        <div className="toast-in border border-al bg-coal px-4 py-3 text-sm text-bone">{toast.message}</div>
      );
    default:
      return (
        <div className="toast-in border border-line bg-coal px-4 py-3 text-sm text-bone">{toast.message}</div>
      );
  }
}
