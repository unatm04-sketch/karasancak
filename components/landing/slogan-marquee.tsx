import { RUNES, Runes } from "@/components/brand/emblem";

const SLOGANS = [
  "Atam, izindeyiz",
  "Omuz omuza",
  "Yaşasın Cumhuriyet",
  "Gökte Kartal, Yerde Bozkurt",
  "Kara Sancak 1903",
];

/** Tribündeki pankart şeridi. Sayfadaki tek kayan öğe. */
export function SloganMarquee() {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {SLOGANS.map((slogan) => (
        <span key={slogan} className="flex items-center">
          <span className="display whitespace-nowrap px-8 text-4xl md:text-5xl">{slogan}</span>
          <Runes className="text-xl text-al md:text-2xl">{RUNES.kokBori}</Runes>
        </span>
      ))}
    </div>
  );

  return (
    <div className="border-y-2 border-ink bg-bone text-ink">
      <div className="stripes h-3 [--stripe:9px]" />
      <div className="flex overflow-hidden py-5">
        <div className="animate-marquee flex w-max">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <div className="stripes h-3 [--stripe:9px]" />
    </div>
  );
}
