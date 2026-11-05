import "server-only";
import { headers } from "next/headers";
import { connection } from "next/server";
import { keyedHash } from "@/lib/ids";

/**
 * İstek anının zamanı. Server Component'lerde Date.now() yerine bu kullanılır:
 * connection() sayesinde derleme sırasındaki ön render'da çalışmaz, her istekte tazedir.
 */
export async function requestTime(): Promise<number> {
  await connection();
  return Date.now();
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "yerel";
}

/** Oran sınırlama anahtarı olarak kullanılır. Ham IP veritabanına yazılmaz. */
export async function getIpKey(): Promise<string> {
  return keyedHash(await getClientIp());
}

/** Referans tıklamalarını kişi bazında tekilleştirmek için */
export async function getVisitorHash(): Promise<string> {
  const h = await headers();
  return keyedHash(`${await getClientIp()}|${h.get("user-agent") ?? ""}`);
}

/** Paylaşılabilir linkler için sitenin kök adresi */
export async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
