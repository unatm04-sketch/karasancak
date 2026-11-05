import Image from "next/image";
import { RUNES, Runes } from "@/components/brand/emblem";
import { Reveal } from "@/components/ui/reveal";
import { IMAGES } from "@/lib/brand/images";

/**
 * Sloganın kendisi sayfa düzenidir: üstte gök ve kartal, altta yer ve kurt,
 * arada kırmızı bir ufuk çizgisi.
 */
export function MottoBands() {
  return (
    <section aria-label="Gökte Kartal, Yerde Bozkurt" className="relative overflow-hidden bg-ink">
      {/* Gök */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <Image
            src={IMAGES.eagle.src}
            alt={IMAGES.eagle.alt}
            fill
            sizes="58vw"
            className="object-cover object-[50%_38%] brightness-[0.72] contrast-[1.35] grayscale [mask-image:linear-gradient(to_right,transparent,black_38%)]"
          />
        </div>
        <div className="relative aspect-[4/3] w-full lg:hidden">
          <Image
            src={IMAGES.eagle.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_40%] brightness-[0.72] contrast-[1.35] grayscale [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
          />
        </div>
        <div className="relative mx-auto max-w-[1500px] px-5 pb-16 pt-2 md:px-10 lg:flex lg:min-h-[74dvh] lg:items-center lg:py-24">
          <Reveal className="max-w-xl">
            <p className="text-lg italic text-fog">Aspanda Bürküt</p>
            <h2 className="display mt-3 text-[clamp(3.6rem,8vw,8rem)]">Gökte Kartal</h2>
            <p className="mt-6 text-lg leading-relaxed text-fog">
              19 Ocak 1941, Şeref Stadı. Beşiktaş, Süleymaniye kalesine yüklenirken tribünden bir ses
              yükseldi: Haydi Kara Kartallar! Lakap o gün doğdu.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Ufuk */}
      <div className="h-[3px] bg-al" />

      {/* Yer */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 hidden w-[62%] lg:block">
          <Image
            src={IMAGES.wolf.src}
            alt={IMAGES.wolf.alt}
            fill
            sizes="62vw"
            className="object-cover object-[60%_30%] brightness-[0.82] contrast-[1.3] grayscale [mask-image:linear-gradient(to_left,transparent,black_42%)]"
          />
        </div>
        <div className="relative aspect-[4/3] w-full lg:hidden">
          <Image
            src={IMAGES.wolf.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[55%_30%] brightness-[0.82] contrast-[1.3] grayscale [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
          />
        </div>
        <div className="relative mx-auto flex max-w-[1500px] justify-end px-5 pb-20 pt-2 md:px-10 lg:min-h-[74dvh] lg:items-center lg:py-24">
          <Reveal className="w-full max-w-xl">
            <p className="text-lg italic text-fog">Jerde Kökbörü</p>
            <h2 className="display mt-3 text-[clamp(3.6rem,8vw,8rem)]">Yerde Bozkurt</h2>
            <p className="mt-6 text-lg leading-relaxed text-fog">
              Ergenekon&apos;dan çıkış yolunu gösteren Bozkurt, bozkırın en eski işareti. Orhun
              Yazıtları yiğit orduyu iki sözle anlatır: börü teg, kurt gibi.
            </p>
            <Runes className="mt-8 block text-right text-5xl text-smoke md:text-6xl">{RUNES.boriTeg}</Runes>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
