import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Noto_Sans_Old_Turkic } from "next/font/google";
import { Toaster } from "@/components/site/toaster";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-anton",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-archivo",
  display: "swap",
});

// Göktürk runları yalnızca süs olarak kullanılır, ön yüklemeye gerek yok.
const oldTurkic = Noto_Sans_Old_Turkic({
  weight: "400",
  subsets: ["old-turkic"],
  variable: "--font-old-turkic",
  display: "swap",
  preload: false,
});

const DESCRIPTION =
  "Kara Sancak 1903 Taraftar Grubu. Atatürk'ün izinde, Beşiktaş'ın yanında. Gökte Kartal, Yerde Bozkurt ol.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Kara Sancak 1903 | Gökte Kartal, Yerde Bozkurt",
    template: "%s | Kara Sancak 1903",
  },
  description: DESCRIPTION,
  applicationName: "Kara Sancak 1903",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Kara Sancak 1903",
    title: "Kara Sancak 1903 | Gökte Kartal, Yerde Bozkurt",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Kara Sancak 1903",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${archivo.variable} ${oldTurkic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
