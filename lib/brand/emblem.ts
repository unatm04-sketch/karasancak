/**
 * Kara Sancak armasının vektör çizimi.
 * Grubun Instagram'daki logosundan elle çizildi: kurt başlı kara kalkan,
 * altında ay yıldızlı al kalkan. Her boyutta keskin kalsın diye SVG.
 * Grubun elinde asıl vektör dosya varsa buradaki yollar onunla değiştirilebilir.
 */
export const EMBLEM_VIEWBOX = { width: 340, height: 430 };

const round = (n: number) => Math.round(n * 100) / 100;

function star(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${round(cx + r * Math.cos(angle))} ${round(cy + r * Math.sin(angle))}`);
  }
  return `M${points.join("L")}Z`;
}

export const EMBLEM_PATHS = {
  /** Dış kalkan */
  shield:
    "M170 7C150 18 126 27 104 27C86 27 68 19 53 6C44 28 24 50 4 63C13 82 18 100 16 122C13 150 9 178 11 210C14 262 36 310 72 348C100 378 135 398 170 424C205 398 240 378 268 348C304 310 326 262 329 210C331 178 327 150 324 122C322 100 327 82 336 63C316 50 296 28 287 6C272 19 254 27 236 27C214 27 190 18 170 7Z",
  /** Kurt başı */
  wolf: "M71 135L158 77L164 47L172 63L179 49L191 89L213 98L275 115L259 128L240 134L238 139L190 152L131 176Z",
  /** Ağız ve dişler */
  mouth: "M181 131L250 126L242 136L235 130L228 140L220 132L213 142L205 134L198 144L191 136L186 144Z",
  eye: "M186 103L200 96L197 105Z",
  /** İç kalkan */
  crest:
    "M170 190C158 197 146 203 135 203C130 203 126 200 122 197C112 207 98 215 85 221C91 235 93 250 91 268C89 300 104 328 126 346C141 358 156 366 170 376C184 366 199 358 214 346C236 328 251 300 249 268C247 250 249 235 255 221C242 215 228 207 218 197C214 200 210 203 205 203C194 203 182 197 170 190Z",
  star: star(170, 235, 27, 10.8),
  crescent: "M124 246A61.5 61.5 0 1 0 216 246A52.9 52.9 0 1 1 124 246Z",
} as const;

export const EMBLEM_COLORS = {
  field: "#0a0a0b",
  white: "#f6f6f3",
  red: "#d40c18",
} as const;

/** WebGL dokusu için aynı armanın düz SVG metni */
export function emblemSvgString(size: number): string {
  const { width, height } = EMBLEM_VIEWBOX;
  const side = Math.max(width, height);
  const dx = (side - width) / 2;
  const { field, white, red } = EMBLEM_COLORS;
  const p = EMBLEM_PATHS;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-dx} 0 ${side} ${side}">
<path d="${p.shield}" fill="${field}" stroke="${white}" stroke-width="6" stroke-linejoin="miter"/>
<path d="${p.wolf}" fill="${white}"/>
<path d="${p.mouth}" fill="${field}"/>
<path d="${p.eye}" fill="${field}"/>
<path d="${p.crest}" fill="${red}" stroke="${white}" stroke-width="5"/>
<path d="${p.star}" fill="${white}"/>
<path d="${p.crescent}" fill="${white}"/>
</svg>`;
}
