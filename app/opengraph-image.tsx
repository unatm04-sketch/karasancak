import { ImageResponse } from "next/og";
import { emblemSvgString } from "@/lib/brand/emblem";

export const alt = "Kara Sancak 1903. Gökte Kartal, Yerde Bozkurt.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Sosyal medyada paylaşılan linklerin kapak görseli */
export default function OpenGraphImage() {
  const emblem = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(emblemSvgString(520))}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 72px",
        background: "#0a0a0b",
        color: "#f2f2ef",
        borderBottom: "14px solid #e30a17",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 720 }}>
        <div style={{ fontSize: 30, color: "#bcbcc3" }}>Kara Sancak 1903</div>
        <div style={{ marginTop: 24, fontSize: 74, lineHeight: 1.1, whiteSpace: "nowrap" }}>GÖKTE KARTAL,</div>
        <div style={{ fontSize: 74, lineHeight: 1.1, whiteSpace: "nowrap" }}>YERDE BOZKURT.</div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#bcbcc3" }}>Atatürk&apos;ün izinde, Beşiktaş&apos;ın yanında.</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- ImageResponse yalnızca img destekler */}
      <img src={emblem} width={380} height={380} />
    </div>,
    size,
  );
}
