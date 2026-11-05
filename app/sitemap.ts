import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/forum", "/maclar", "/etkinlikler", "/duyurular", "/siralama", "/gorevler", "/basvuru"].map((path) => ({
    url: `${BASE}${path}`,
  }));
}
