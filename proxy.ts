import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * İyimser kontrol: çerez yoksa boş sayfa iskeleti göstermeden girişe yönlendirir.
 * Asıl yetki kontrolü her sayfa ve Server Action içinde veritabanına karşı yapılır.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = request.nextUrl.clone();
  const target = url.pathname + url.search;
  url.pathname = "/giris";
  url.search = `?devam=${encodeURIComponent(target)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/mesajlar/:path*",
    "/bildirimler/:path*",
    "/ayarlar/:path*",
    "/yonetim/:path*",
    "/forum/yeni",
    "/forum/duzenle/:path*",
  ],
};
