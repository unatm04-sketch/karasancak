import { EMBLEM_COLORS, EMBLEM_PATHS, EMBLEM_VIEWBOX } from "@/lib/brand/emblem";

type Props = {
  className?: string;
  title?: string;
};

/** Grubun arması */
export function Emblem({ className, title = "Kara Sancak arması" }: Props) {
  const { field, white, red } = EMBLEM_COLORS;
  const p = EMBLEM_PATHS;
  return (
    <svg
      viewBox={`0 0 ${EMBLEM_VIEWBOX.width} ${EMBLEM_VIEWBOX.height}`}
      className={className}
      role="img"
      aria-label={title}
    >
      <path d={p.shield} fill={field} stroke={white} strokeWidth={6} />
      <path d={p.wolf} fill={white} />
      <path d={p.mouth} fill={field} />
      <path d={p.eye} fill={field} />
      <path d={p.crest} fill={red} stroke={white} strokeWidth={5} />
      <path d={p.star} fill={white} />
      <path d={p.crescent} fill={white} />
    </svg>
  );
}

/** Türk bayrağı. Oranlar Türk Bayrağı Kanunu'ndaki ölçülere göredir. */
export function TurkishFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -30000 90000 60000" className={className} role="img" aria-label="Türk bayrağı">
      <path fill="#e30a17" d="m0-30000h90000v60000H0z" />
      <path
        fill="#fff"
        d="m41750 0 13568-4408-8386 11541V-7133l8386 11541zm925 8021a15000 15000 0 1 1 0-16042 12000 12000 0 1 0 0 16042z"
      />
    </svg>
  );
}

/**
 * Göktürk runlarıyla yazı. Yön sağdan soladır, süs olduğu için ekran okuyucudan gizlenir.
 * Kullanılan sözcükler yazıtlarda geçen biçimleriyledir:
 * 𐰚𐰇𐰜 kök (gök), 𐱅𐰇𐰼𐰜 türük, 𐰋𐰇𐰼𐰃 böri (kurt), 𐱅𐰏 teg (gibi)
 */
export function Runes({ children, className }: { children: string; className?: string }) {
  return (
    <span dir="rtl" aria-hidden="true" className={`font-rune ${className ?? ""}`}>
      {children}
    </span>
  );
}

export const RUNES = {
  kokTuruk: "𐰚𐰇𐰜:𐱅𐰇𐰼𐰜",
  boriTeg: "𐰋𐰇𐰼𐰃:𐱅𐰏",
  kokBori: "𐰚𐰇𐰜:𐰋𐰇𐰼𐰃",
} as const;
