import "server-only";
import { cookies } from "next/headers";
import { FLASH_COOKIE, type Toast } from "@/lib/toast";

/**
 * Server Action sonrası kullanıcıya kısa bir geri bildirim gösterir ("+10 XP" gibi).
 * Yönlendirme yapan action'larda da çalışsın diye kısa ömürlü çerezle taşınır;
 * istemcideki <Toaster /> çerezi okur ve siler. Hassas veri konmaz.
 */
export async function pushToasts(toasts: Toast[]): Promise<void> {
  if (toasts.length === 0) return;
  const store = await cookies();
  let existing: Toast[] = [];
  const raw = store.get(FLASH_COOKIE)?.value;
  if (raw) {
    try {
      existing = JSON.parse(raw) as Toast[];
    } catch {
      existing = [];
    }
  }
  // Next.js çerez değerini kendisi kodlar ve çözer, burada ayrıca kodlanmaz.
  store.set(FLASH_COOKIE, JSON.stringify([...existing, ...toasts].slice(-6)), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
    httpOnly: false,
  });
}

export const pushToast = (toast: Toast) => pushToasts([toast]);
