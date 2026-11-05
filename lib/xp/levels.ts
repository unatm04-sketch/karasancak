/**
 * Seviye eğrisi: bir seviyeye ulaşmak için gereken toplam XP = 50 * L * (L - 1)
 *
 *   L2: 100   L5: 1.000   L10: 4.500   L20: 19.000   L30: 43.500
 *
 * Saf fonksiyonlar. Hem sunucuda hem istemcide güvenle kullanılır.
 */
export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return 50 * l * (l - 1);
}

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, xp);
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * safe) / 50)) / 2));
}

export type LevelProgress = {
  level: number;
  /** Bu seviyede kazanılan XP */
  current: number;
  /** Bir sonraki seviye için bu seviyede gereken toplam XP */
  needed: number;
  /** Sonraki seviyeye kalan XP */
  remaining: number;
  percent: number;
};

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const current = Math.max(0, xp) - floor;
  const needed = ceil - floor;
  return {
    level,
    current,
    needed,
    remaining: ceil - Math.max(0, xp),
    percent: Math.min(100, Math.round((current / needed) * 100)),
  };
}

/**
 * Sürüdeki yerin. Otomatik gelir, admin vermez.
 * Yol, sloganın kendisidir: yerde bozkurt olarak başlar, gökte kartal olarak biter.
 */
export const LEVEL_TIERS = [
  { from: 1, name: "Yavru Kurt", note: "Sürüye yeni katıldın." },
  { from: 5, name: "Genç Börü", note: "Sesin tribünde duyulmaya başladı." },
  { from: 10, name: "Bozkurt", note: "Yerde bozkurt oldun." },
  { from: 15, name: "Gökbörü", note: "Sürüye yol gösteriyorsun." },
  { from: 20, name: "Kara Kartal", note: "Artık gökte süzülüyorsun." },
  { from: 30, name: "Bürküt", note: "Aspanda Bürküt. Zirvedesin." },
] as const;

export type LevelTier = (typeof LEVEL_TIERS)[number];

export function tierForLevel(level: number): LevelTier {
  let tier: LevelTier = LEVEL_TIERS[0];
  for (const t of LEVEL_TIERS) {
    if (level >= t.from) tier = t;
  }
  return tier;
}

export function nextTier(level: number): LevelTier | null {
  return LEVEL_TIERS.find((t) => t.from > level) ?? null;
}
