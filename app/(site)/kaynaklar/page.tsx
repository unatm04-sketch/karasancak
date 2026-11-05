import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { IMAGES } from "@/lib/brand/images";

export const metadata: Metadata = { title: "Görsel ve Metin Kaynakları" };

const TEXT_SOURCES = [
  {
    label: "Atatürk ve Beşiktaş",
    detail: "1903, Akaretler ve 16 Mayıs 1919 anlatıları",
    href: "https://bjk.com.tr/en/news/26696/besiktas_memories_of_the_great_leader_ataturk.html",
    source: "Beşiktaş JK resmî sitesi",
  },
  {
    label: "Kara Kartal lakabı",
    detail: "19 Ocak 1941 Süleymaniye maçı",
    href: "https://www.tff.org/Resources/Tamsaha/ZTK-Finali-2021/8-9/",
    source: "Türkiye Futbol Federasyonu yayını",
  },
  {
    label: "Grup metinleri ve etkinlik bilgileri",
    detail: "Slogan, duyuru ve program metinleri",
    href: "https://www.instagram.com/karasancak1903/",
    source: "@karasancak1903",
  },
];

export default function SourcesPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Kaynaklar"
        description="Sitede kullanılan fotoğrafların sahipleri, lisansları ve tarihî bilgilerin dayanakları."
      />

      <h2 className="display text-3xl">Fotoğraflar</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {Object.values(IMAGES).map((image) => (
          <li key={image.page} className="grid gap-1 py-4 md:grid-cols-3 md:gap-6">
            <p className="font-medium">{image.usedFor}</p>
            <p className="text-sm text-fog">{image.author}</p>
            <p className="text-sm text-fog md:text-right">
              {"licenseUrl" in image ? (
                <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-bone">
                  {image.license}
                </a>
              ) : (
                image.license
              )}
              {", "}
              <a href={image.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-bone">
                Wikimedia Commons
              </a>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-smoke">
        Dosyaların kopyaları bu sitede barındırılır. Fotoğraflar sitede siyah beyaz ve yüksek karşıtlıkla gösterilir.
      </p>

      <h2 className="display mt-12 text-3xl">Metinler</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {TEXT_SOURCES.map((source) => (
          <li key={source.href} className="grid gap-1 py-4 md:grid-cols-3 md:gap-6">
            <p className="font-medium">{source.label}</p>
            <p className="text-sm text-fog">{source.detail}</p>
            <p className="text-sm md:text-right">
              <a href={source.href} target="_blank" rel="noopener noreferrer" className="text-fog underline underline-offset-2 hover:text-bone">
                {source.source}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
