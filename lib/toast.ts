/** Sunucu ve istemci arasında paylaşılan bildirim tipi */
export const FLASH_COOKIE = "ks_flash";

export type Toast =
  | { kind: "xp"; amount: number; label: string }
  | { kind: "level"; level: number; tier: string }
  | { kind: "info"; message: string }
  | { kind: "error"; message: string };
