import Link from "next/link";
import { Emblem } from "@/components/brand/emblem";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-ink px-6 text-center">
      <Emblem className="h-28 w-auto" title="" />
      <h1 className="display mt-8 text-6xl md:text-8xl">Yol burada bitiyor</h1>
      <p className="mt-4 max-w-md text-fog">Aradığın sayfa bulunamadı ya da taşınmış olabilir.</p>
      <Link href="/" className={`${buttonClass("primary", "lg")} mt-8`}>
        Ana sayfaya dön
      </Link>
    </main>
  );
}
