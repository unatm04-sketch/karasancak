import Link from "next/link";
import { RUNES, Runes } from "@/components/brand/emblem";
import { buttonClass } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function FinalCall() {
  return (
    <section aria-labelledby="cagri-baslik" className="relative isolate overflow-hidden bg-ink">
      <div className="stripes h-4 [--stripe:14px]" />
      <div className="stripes-soft absolute inset-0 -z-10 [--stripe:64px]" />
      <div className="mx-auto max-w-[1100px] px-5 py-28 text-center md:px-10 md:py-40">
        <Reveal>
          <Runes className="text-3xl text-smoke md:text-4xl">{RUNES.kokTuruk}</Runes>
          <h2 id="cagri-baslik" className="display mt-6 text-[clamp(3rem,7.5vw,7.5rem)]">
            Tüm yol arkadaşlarımızı saflarımıza çağırıyoruz<span className="text-al">.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-[34rem] text-lg leading-relaxed text-fog">
            Formu doldur, yönetim başvurunu incelesin. Onayla birlikte rütben ve ilk XP&apos;lerin hazır.
          </p>
          <Link href="/basvuru" className={`${buttonClass("primary", "xl")} mt-10`}>
            Sürüye Katıl
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
