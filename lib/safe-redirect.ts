/**
 * Giriş sonrası yönlendirme adresini yalnızca site içi yollarla sınırlar.
 * "//evil.com" veya "/\evil.com" gibi açık yönlendirme denemelerini eler.
 */
export function safeInternalPath(next: string | null | undefined, fallback = "/panel"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
