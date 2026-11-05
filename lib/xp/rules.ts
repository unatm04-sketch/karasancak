/**
 * Varsayılan XP kuralları. Seed sırasında veritabanına yazılır, sonrasında
 * miktar ve günlük limitler yönetim panelinden değiştirilebilir.
 */
export const XP_CATEGORIES = [
  "Günlük",
  "Forum",
  "Mesajlaşma",
  "Referans",
  "Maç",
  "Etkinlik",
  "Profil",
] as const;

export type XpCategory = (typeof XP_CATEGORIES)[number];

export type XpRuleSeed = {
  key: string;
  label: string;
  description: string;
  category: XpCategory;
  amount: number;
  dailyCap: number | null;
};

export const DEFAULT_XP_RULES = [
  // Günlük
  {
    key: "daily_checkin",
    label: "Günlük yoklama",
    description: "Her gün panelden yoklama ver.",
    category: "Günlük",
    amount: 10,
    dailyCap: 1,
  },
  {
    key: "streak_7",
    label: "7 günlük seri",
    description: "Yedi gün üst üste yoklama verdiğinde.",
    category: "Günlük",
    amount: 50,
    dailyCap: 1,
  },
  {
    key: "streak_30",
    label: "30 günlük seri",
    description: "Otuz gün hiç aksatmadığında.",
    category: "Günlük",
    amount: 300,
    dailyCap: 1,
  },
  // Forum
  {
    key: "topic_create",
    label: "Konu açma",
    description: "Forumda yeni bir konu aç.",
    category: "Forum",
    amount: 25,
    dailyCap: 3,
  },
  {
    key: "post_create",
    label: "Foruma yazma",
    description: "En az 20 karakterlik bir yanıt yaz.",
    category: "Forum",
    amount: 10,
    dailyCap: 15,
  },
  {
    key: "like_received",
    label: "Beğeni toplama",
    description: "Yazın başka bir üyeden beğeni aldığında.",
    category: "Forum",
    amount: 5,
    dailyCap: 40,
  },
  {
    key: "like_given",
    label: "Beğeni verme",
    description: "Başka bir üyenin yazısını beğen.",
    category: "Forum",
    amount: 1,
    dailyCap: 20,
  },
  {
    key: "topic_pinned",
    label: "Manşete çıkma",
    description: "Konun yönetim tarafından başa tutturulduğunda.",
    category: "Forum",
    amount: 50,
    dailyCap: null,
  },
  // Mesajlaşma
  {
    key: "message_sent",
    label: "Mesaj gönderme",
    description: "Üyelerle veya Tribün sohbetinde yazış.",
    category: "Mesajlaşma",
    amount: 2,
    dailyCap: 15,
  },
  {
    key: "conversation_started",
    label: "Yeni sohbet başlatma",
    description: "Daha önce yazışmadığın bir üyeye ilk mesajını at.",
    category: "Mesajlaşma",
    amount: 5,
    dailyCap: 3,
  },
  // Referans
  {
    key: "referral_share",
    label: "Referans linkini paylaşma",
    description: "Panelden linkini WhatsApp, X, Telegram'a gönder.",
    category: "Referans",
    amount: 5,
    dailyCap: 1,
  },
  {
    key: "referral_click",
    label: "Linkine gelen ziyaretçi",
    description: "Linkine tıklayan her farklı kişi için.",
    category: "Referans",
    amount: 2,
    dailyCap: 25,
  },
  {
    key: "referral_application",
    label: "Referansınla başvuru",
    description: "Linkinden gelen biri başvuru formunu doldurduğunda.",
    category: "Referans",
    amount: 15,
    dailyCap: null,
  },
  {
    key: "referral_approved",
    label: "Referansın onaylandı",
    description: "Davet ettiğin kişinin üyeliği onaylandığında.",
    category: "Referans",
    amount: 150,
    dailyCap: null,
  },
  {
    key: "referral_level5",
    label: "Referansın Seviye 5 oldu",
    description: "Davet ettiğin üye Genç Börü olduğunda.",
    category: "Referans",
    amount: 100,
    dailyCap: null,
  },
  // Maç
  {
    key: "match_prediction",
    label: "Maç tahmini",
    description: "Maç başlamadan skor tahminini gir.",
    category: "Maç",
    amount: 5,
    dailyCap: null,
  },
  {
    key: "prediction_outcome",
    label: "Sonuç tahmini tuttu",
    description: "Galibi veya beraberliği doğru bildin.",
    category: "Maç",
    amount: 20,
    dailyCap: null,
  },
  {
    key: "prediction_exact",
    label: "Skoru tam bildin",
    description: "Maçın skorunu birebir tahmin ettin.",
    category: "Maç",
    amount: 75,
    dailyCap: null,
  },
  // Etkinlik
  {
    key: "event_rsvp",
    label: "Etkinliğe katılım bildirme",
    description: "Yürüyüş, anma ve buluşmalara \"Oradayım\" de.",
    category: "Etkinlik",
    amount: 5,
    dailyCap: null,
  },
  {
    key: "event_attended",
    label: "Sahada yoklama",
    description: "Etkinlikteki katılımın yönetimce onaylandığında. Tutar etkinliğe göre değişir.",
    category: "Etkinlik",
    amount: 150,
    dailyCap: null,
  },
  // Profil
  {
    key: "welcome",
    label: "Sürüye hoş geldin",
    description: "Üyeliğin onaylandığında bir kez.",
    category: "Profil",
    amount: 25,
    dailyCap: null,
  },
  {
    key: "profile_completed",
    label: "Profilini tamamlama",
    description: "Biyografi, şehir ve tribün bilgilerini doldur.",
    category: "Profil",
    amount: 50,
    dailyCap: null,
  },
  {
    key: "achievement",
    label: "Nişan kazanma",
    description: "Her nişan kendi XP ödülüyle gelir.",
    category: "Profil",
    amount: 25,
    dailyCap: null,
  },
] as const satisfies readonly XpRuleSeed[];

export type XpRuleKey = (typeof DEFAULT_XP_RULES)[number]["key"];

/**
 * Gövdesi çok kısa olan forum yazıları ve mesajlar ödül kazandırmaz.
 * "ok", "+1" gibi tekrarlarla XP kasılmasını önler.
 */
export const MIN_POST_LENGTH_FOR_XP = 20;
export const MIN_MESSAGE_LENGTH_FOR_XP = 4;
/** Mesaj başına XP için iki mesaj arasında geçmesi gereken süre */
export const MESSAGE_XP_COOLDOWN_MS = 20_000;

/** Nişanlar. Koşulları lib/xp/achievements.ts dosyasında kontrol edilir. */
export const ACHIEVEMENTS = {
  ilk_konu: { name: "İlk Söz", description: "Forumda ilk konunu açtın.", xp: 25 },
  yazar_50: { name: "Kalem", description: "Foruma 50 yazı yazdın.", xp: 100 },
  begeni_100: { name: "Tribünün Sesi", description: "Yazıların 100 beğeni topladı.", xp: 150 },
  davet_1: { name: "Sürü Kurucu", description: "İlk davetin üye oldu.", xp: 50 },
  davet_10: { name: "Asena", description: "On kişiyi sürüye kattın.", xp: 500 },
  seri_7: { name: "Nöbetçi", description: "Yedi gün üst üste yoklama verdin.", xp: 25 },
  seri_30: { name: "Sancaktar", description: "Otuz gün sancağı bırakmadın.", xp: 150 },
  kahin: { name: "Kâhin", description: "Bir maçın skorunu tam bildin.", xp: 50 },
  sahada_1: { name: "Sahadayım", description: "İlk etkinliğine katıldın.", xp: 50 },
  sahada_5: { name: "Alanların Kurdu", description: "Beş etkinlikte saflarda yer aldın.", xp: 250 },
} as const;

export type AchievementKey = keyof typeof ACHIEVEMENTS;
