// Phosphor ikonlarının resmî yollarından saf SVG bileşenleri üretir (MIT lisanslı).
// Paketin Context kullanan bileşenleri Server Component'te çalışmadığı için ve her
// sayfaya istemci JS'i eklememek için ikonlar statik olarak üretilir.
//
// Yeni ikon eklemek: aşağıdaki listeye ekleyip `node scripts/gen-icons.mjs` çalıştırın.
import { readFileSync, writeFileSync } from "node:fs";

const ICONS = [
  "ArrowRight", "ArrowUpRight", "Bell", "CalendarDots", "CaretDown", "CaretRight",
  "ChatCircleDots", "ChatsCircle", "Check", "CheckCircle", "Clock", "Copy", "Crown", "Eye",
  "Fire", "FlagBanner", "GearSix", "House", "InstagramLogo", "Lightning", "List", "ListChecks",
  "Lock", "LockOpen", "MagnifyingGlass", "MapPin", "Medal", "Megaphone", "PaperPlaneTilt",
  "PencilSimple", "Plus", "PushPin", "ShareNetwork", "ShieldStar", "SignOut", "SoccerBall",
  "Target", "TelegramLogo", "ThumbsUp", "Trash", "Trophy", "UserCircle", "UserPlus", "Users",
  "WhatsappLogo", "X", "XLogo",
];

function pathsFor(source, weight) {
  // Ağırlık bloğunu bul: ["regular", ...createElement("path",{d:"..."})...]
  const marker = `"${weight}"`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`${weight} bulunamadı`);
  const rest = source.slice(start);
  const next = rest.slice(marker.length).search(/"(bold|duotone|fill|light|regular|thin)"/);
  const block = next === -1 ? rest : rest.slice(0, next + marker.length);
  return [...block.matchAll(/\bd:\s*"([^"]+)"/g)].map((m) => m[1]);
}

const entries = ICONS.map((name) => {
  const source = readFileSync(`node_modules/@phosphor-icons/react/dist/defs/${name}.es.js`, "utf8");
  return { name, regular: pathsFor(source, "regular").join(" "), fill: pathsFor(source, "fill").join(" ") };
});

const out = `// Bu dosya scripts/gen-icons.mjs tarafından üretilir, elle düzenlemeyin.
// İkonlar: Phosphor Icons (https://phosphoricons.com), MIT lisansı.
import type { SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
  weight?: "regular" | "fill";
};

function icon(regular: string, fill: string) {
  return function Icon({ size = "1em", weight = "regular", ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="currentColor"
        aria-hidden={props["aria-label"] ? undefined : true}
        {...props}
      >
        <path d={weight === "fill" ? fill : regular} />
      </svg>
    );
  };
}

${entries.map((e) => `export const ${e.name} = icon(\n  ${JSON.stringify(e.regular)},\n  ${JSON.stringify(e.fill)},\n);`).join("\n\n")}
`;
writeFileSync("components/ui/icons.tsx", out);
console.log(`${entries.length} ikon üretildi.`);
