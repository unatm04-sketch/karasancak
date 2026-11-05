import type { Metadata } from "next";
import Link from "next/link";
import { Emblem } from "@/components/brand/emblem";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Başvurun alındı", robots: { index: false } };

export default function ApplicationReceivedPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-20 text-center">
      <Emblem className="mx-auto h-32 w-auto" title="" />
      <h1 className="display mt-8 text-6xl md:text-7xl">Başvurun bize ulaştı</h1>
      <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-fog">
        Yönetim başvurunu inceleyecek. Onaylandığında formda yazdığın kullanıcı adı ve şifreyle giriş
        yapabilirsin. Sonucu giriş ekranında da görebilirsin.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/forum" className={buttonClass("primary", "lg")}>
          Forumu Gör
        </Link>
        <Link href="/giris" className={buttonClass("ghost", "lg")}>
          Giriş ekranı
        </Link>
      </div>
    </div>
  );
}
