import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Reveal } from "@/components/ui/reveal";
import { ArrowUpRight } from "@/components/ui/icons";
import { IMAGES } from "@/lib/brand/images";
import { formatDateShort } from "@/lib/format";
import { listUpcomingEvents } from "@/lib/queries/content";
import { requestTime } from "@/lib/request";

const STEPS = [
  {
    when: "1903",
    title: "Kulüp kurulur",
    body: "Harbiye'de okuyan Mustafa Kemal, tanıdığı subayların Yıldız Sarayı'nın dibinde kurduğu jimnastik kulübünü merakla izler.",
  },
  {
    when: "Akaretler",
    title: "Duvar komşusu",
    body: "Annesi Zübeyde Hanım'ın evi kulübün yanı başındadır. Mustafa Kemal arka bahçeden antrenmanları izler, sporcuları yakından tanır.",
  },
  {
    when: "16 Mayıs 1919",
    title: "Samsun yolunda",
    body: "Samsun'a çıkmadan önce Akaretler'e gelir. Kapısında toplanan Beşiktaşlı sporcu ve subaylarla vedalaşır, annesini onlara emanet eder.",
  },
];

/** Bu bölümün anlatısı kulübün resmî sitesindeki "Atatürk ve Beşiktaş" metnine dayanır. */
export function AtaturkStory() {
  return (
    <section aria-labelledby="ata-baslik" className="relative bg-ink">
      <div className="mx-auto grid max-w-[1500px] px-5 md:px-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="pt-16 lg:sticky lg:top-0 lg:col-span-5 lg:flex lg:h-[100dvh] lg:items-center lg:pt-0">
          <figure className="relative w-full">
            <div className="relative aspect-[4/5] overflow-hidden lg:max-h-[86dvh]">
              <Image
                src={IMAGES.ataturk.src}
                alt={IMAGES.ataturk.alt}
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                quality={85}
                className="object-cover object-[50%_22%] contrast-[1.08] grayscale"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG imza, optimize edilmez */}
            <img
              src={IMAGES.signature.src}
              alt={IMAGES.signature.alt}
              width={572}
              height={205}
              loading="lazy"
              className="absolute bottom-5 right-5 h-auto w-36 md:w-48"
            />
          </figure>
        </div>

        <div className="flex flex-col gap-24 py-20 lg:col-span-6 lg:col-start-7 lg:gap-[26vh] lg:py-[18vh]">
          <Reveal>
            <h2 id="ata-baslik" className="display text-[clamp(3.4rem,7.5vw,7.5rem)]">
              Atam,
              <br />
              izindeyiz<span className="text-al">.</span>
            </h2>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-fog">
              Bağımsızlığımızın ve Cumhuriyetimizin mimarı Gazi Mustafa Kemal Atatürk&apos;ün
              Beşiktaş&apos;la hikâyesi, kulübün ilk yıllarına uzanır.
            </p>
          </Reveal>

          {STEPS.map((step) => (
            <Reveal key={step.when}>
              <p className="display text-3xl text-al-bright md:text-4xl">{step.when}</p>
              <h3 className="mt-4 text-2xl font-semibold md:text-3xl">{step.title}</h3>
              <p className="mt-3 max-w-[34rem] text-lg leading-relaxed text-fog">{step.body}</p>
            </Reveal>
          ))}

          <Reveal>
            <blockquote className="border-l-4 border-al pl-6 md:pl-8">
              <p className="display text-[clamp(2.6rem,5.2vw,5.2rem)]">
                Efendiler, yarın Cumhuriyeti ilan edeceğiz.
              </p>
              <footer className="mt-5 text-fog">Mustafa Kemal Atatürk, 28 Ekim 1923</footer>
            </blockquote>
          </Reveal>

          <Reveal>
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={IMAGES.anitkabir.src}
                alt={IMAGES.anitkabir.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover contrast-125 grayscale"
              />
            </div>
            <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-fog">
              Büyük önderimizin huzurunda olmak yalnızca bir ziyaret değil, tarihimize ve
              değerlerimize duyduğumuz bağlılığın ifadesidir. Daima saygı, daima minnetle.
            </p>
            <Suspense fallback={<div className="mt-6 h-6" />}>
              <NextCommemoration />
            </Suspense>
            <p className="mt-10 text-sm text-smoke">
              Kaynak:{" "}
              <a
                href="https://bjk.com.tr/en/news/26696/besiktas_memories_of_the_great_leader_ataturk.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-bone"
              >
                Beşiktaş JK resmî sitesi, Atatürk ve Beşiktaş
              </a>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

async function NextCommemoration() {
  const [event] = await listUpcomingEvents(1, await requestTime());
  if (!event) return null;
  return (
    <Link
      href={`/etkinlikler/${event.slug}`}
      className="mt-6 inline-flex items-center gap-2 font-semibold text-bone hover:text-al-bright"
    >
      {formatDateShort(event.startsAt)}: {event.title}
      <ArrowUpRight size={18} />
    </Link>
  );
}
