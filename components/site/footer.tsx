import Link from "next/link";
import { Emblem, TurkishFlag } from "@/components/brand/emblem";
import { InstagramLogo } from "@/components/ui/icons";

const COLUMNS = [
  {
    title: "Sürü",
    links: [
      { href: "/forum", label: "Forum" },
      { href: "/siralama", label: "Sıralama" },
      { href: "/gorevler", label: "XP ve görevler" },
      { href: "/basvuru", label: "Başvuru formu" },
    ],
  },
  {
    title: "Saha",
    links: [
      { href: "/maclar", label: "Maçlar ve tahminler" },
      { href: "/etkinlikler", label: "Etkinlikler" },
      { href: "/duyurular", label: "Duyurular" },
    ],
  },
  {
    title: "Bilgi",
    links: [
      { href: "/kvkk", label: "KVKK aydınlatma metni" },
      { href: "/kaynaklar", label: "Görsel ve metin kaynakları" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-ink">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-14 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <div className="flex items-center gap-4">
            <Emblem className="h-16 w-auto" title="" />
            <div>
              <p className="display text-2xl">Kara Sancak 1903</p>
              <p className="mt-1 text-sm text-fog">Taraftar Grubu</p>
            </div>
          </div>
          <p className="mt-6 max-w-[42ch] text-sm leading-relaxed text-fog">
            “Aspanda Bürküt, Jerde Kökbörü Bol”
            <br />
            Gökte Kartal, Yerde Bozkurt ol.
          </p>
          <TurkishFlag className="mt-4 h-5 w-auto" />
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title} className="md:col-span-2">
            <p className="text-sm font-semibold">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-fog hover:text-bone">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="md:col-span-1 md:justify-self-end">
          <a
            href="https://www.instagram.com/karasancak1903/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kara Sancak Instagram hesabı"
            className="inline-flex size-11 items-center justify-center border border-line text-fog hover:border-bone hover:text-bone"
          >
            <InstagramLogo size={22} />
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1500px] px-5 py-5 text-xs leading-relaxed text-smoke md:px-10">
          Bu site Kara Sancak taraftar grubuna aittir. Beşiktaş JK&apos;nin resmî sitesi değildir.
        </p>
      </div>
    </footer>
  );
}
