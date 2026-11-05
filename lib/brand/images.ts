/**
 * Sitede kullanılan fotoğraflar ve lisans bilgileri. Dosyalar public/img altındadır;
 * kaynakları kamu malı veya açık lisanslı Wikimedia Commons kayıtlarıdır.
 * /kaynaklar sayfası bu listeden üretilir, lisanslı bir görsel eklenirse buraya da yazılmalıdır.
 */
import type { StaticImageData } from "next/image";
import anitkabir from "@/public/img/anitkabir.jpg";
import ataturk from "@/public/img/ataturk.jpg";
import kartal from "@/public/img/kartal.jpg";
import kurt from "@/public/img/kurt.jpg";
import stadyum from "@/public/img/stadyum.jpg";

export type SiteImage = {
  src: StaticImageData | string;
  alt: string;
  usedFor: string;
  author: string;
  license: string;
  licenseUrl?: string;
  page: string;
};

export const IMAGES = {
  ataturk: {
    src: ataturk,
    alt: "Mustafa Kemal Atatürk'ün siyah beyaz portresi",
    usedFor: "Atatürk bölümü",
    author: "Nationaal Archief (Hollanda Ulusal Arşivi), fotoğrafçısı bilinmiyor",
    license: "Kamu malı",
    page: "https://commons.wikimedia.org/wiki/File:Portret_van_de_Turkse_leider_Mustafa_Kemal_Ataturk_(Atat%C3%BCrk_Kemal_Pascha)_(1881-1938)_in_westers,_SFA003017837.jpg",
  },
  signature: {
    src: "/img/ataturk-imza.svg",
    alt: "Mustafa Kemal Atatürk'ün imzası",
    usedFor: "Atatürk bölümü, imza",
    author: "Mustafa Kemal Atatürk",
    license: "Kamu malı",
    page: "https://commons.wikimedia.org/wiki/File:Signature_of_Mustafa_Kemal_Atat%C3%BCrk.svg",
  },
  anitkabir: {
    src: anitkabir,
    alt: "Anıtkabir'in önden görünümü",
    usedFor: "Atatürk bölümü, Anıtkabir",
    author: "William Neuheisel",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Ataturk%27s_Mausoleum_(6225341313).jpg",
  },
  eagle: {
    src: kartal,
    alt: "Kanatlarını açmış süzülen bir kartal",
    usedFor: "Gökte Kartal bölümü",
    author: "Giles Laurent",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:015_Wild_Golden_Eagle_in_flight_at_Pfyn-Finges_(Switzerland)_Photo_by_Giles_Laurent.jpg",
  },
  wolf: {
    src: kurt,
    alt: "Karanlık ormanda uluyan bir kurt",
    usedFor: "Yerde Bozkurt bölümü",
    author: "zoofanatic",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:-7237-_Howling_wolf_(20823670579).jpg",
  },
  stadium: {
    src: stadyum,
    alt: "Gece maçında Beşiktaş'ın stadyumu ve dolu tribünler",
    usedFor: "Maç Günü bölümü",
    author: "Sakhalinio",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Be%C5%9Fikta%C5%9F_J.K._vs_Bursaspor_11_April_2016_(3)_cropped.jpg",
  },
} as const satisfies Record<string, SiteImage>;
