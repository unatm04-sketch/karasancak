import Link from "next/link";
import { Emblem } from "@/components/brand/emblem";
import { buttonClass } from "@/components/ui/button";
import { BannerCanvas } from "./banner-canvas";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-ink lg:justify-center">
      {/* WebGL hazır olana kadar (veya hiç yoksa) görünen statik arma */}
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <Emblem
          title=""
          className="absolute left-1/2 top-[28%] h-[44%] w-auto -translate-x-1/2 -translate-y-1/2 lg:left-[73.5%] lg:top-1/2 lg:h-[84%]"
        />
      </div>
      <BannerCanvas className="absolute inset-0 -z-10 size-full" />

      <div className="mx-auto w-full max-w-[1500px] px-5 pb-14 pt-24 md:px-10 lg:pb-16">
        <div className="lg:max-w-[58%]">
          <p className="animate-rise text-lg italic text-fog [animation-delay:80ms] md:text-xl">
            “Aspanda Bürküt, Jerde Kökbörü Bol”
          </p>
          <h1 className="display animate-rise mt-4 text-[clamp(2.9rem,13.4vw,5.8rem)] [animation-delay:160ms] lg:text-[clamp(4.9rem,7.5vw,8.3rem)]">
            <span className="block whitespace-nowrap">Gökte Kartal,</span>
            <span className="block whitespace-nowrap">
              Yerde Bozkurt<span className="text-al">.</span>
            </span>
          </h1>
          <p className="animate-rise mt-6 max-w-[34rem] text-lg leading-relaxed text-fog [animation-delay:280ms] md:text-xl">
            Kara Sancak 1903: Atatürk&apos;ün izinde, Beşiktaş&apos;ın yanında, tribünden meydana omuz
            omuza.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3 [animation-delay:400ms]">
            <Link href="/basvuru" className={buttonClass("primary", "xl")}>
              Sürüye Katıl
            </Link>
            <Link href="/forum" className={buttonClass("ghost", "xl", "bg-ink/40 backdrop-blur-sm")}>
              Forumu Gör
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
