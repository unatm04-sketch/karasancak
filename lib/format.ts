/** Tarih, sayı ve metin biçimlendirme. Zaman dilimi her yerde Türkiye saatidir. */
const TZ = "Europe/Istanbul";

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Europe/Istanbul takvim günü: YYYY-MM-DD */
export function istanbulDay(ms: number): string {
  return dayFmt.format(new Date(ms));
}

/** Bir önceki takvim günü (Türkiye'de yaz saati uygulaması olmadığı için güvenli) */
export function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00+03:00`);
  d.setUTCDate(d.getUTCDate() - 1);
  return istanbulDay(d.getTime());
}

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dateShortFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
});
const dateTimeFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const weekdayFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, weekday: "long" });
const numberFmt = new Intl.NumberFormat("tr-TR");

export const formatDate = (ms: number) => dateFmt.format(new Date(ms));
export const formatDateShort = (ms: number) => dateShortFmt.format(new Date(ms));
export const formatDateTime = (ms: number) => dateTimeFmt.format(new Date(ms));
export const formatTime = (ms: number) => timeFmt.format(new Date(ms));
export const formatWeekday = (ms: number) => weekdayFmt.format(new Date(ms));
export const formatNumber = (n: number) => numberFmt.format(n);

/** "3 saat önce" */
export function timeAgo(ms: number, now: number): string {
  const diff = Math.max(0, now - ms);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dakika önce`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} gün önce`;
  return formatDate(ms);
}

/**
 * Formlardaki <input type="datetime-local"> değeri Türkiye saati kabul edilir.
 * Sunucu hangi saat diliminde çalışırsa çalışsın aynı sonucu verir.
 */
export function parseLocalDateTime(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
  const ms = new Date(`${value.slice(0, 16)}:00+03:00`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** parseLocalDateTime'ın tersi: forma varsayılan değer basmak için */
export function toLocalDateTimeValue(ms: number): string {
  const shifted = new Date(ms + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

const TR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

export function slugify(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return `${first}${last}`.toLocaleUpperCase("tr-TR");
}
