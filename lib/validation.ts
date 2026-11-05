import { z } from "zod";

export const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

/** Boş metni undefined'a çeviren isteğe bağlı alan */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `En fazla ${max} karakter olabilir.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_RE, "3-24 karakter; yalnızca küçük harf, rakam ve alt çizgi. Türkçe karakter olmaz.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Geçerli bir e-posta adresi yaz.")
  .max(160, "E-posta adresi çok uzun.");

export const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı.")
  .max(128, "Şifre en fazla 128 karakter olabilir.");

export const instagramSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, ""))
  .pipe(
    z
      .string()
      .regex(/^[a-zA-Z0-9._]{0,30}$/, "Geçerli bir Instagram kullanıcı adı yaz.")
      .transform((v) => (v === "" ? null : v)),
  );

/** FormData'yı düz nesneye çevirir, eksik alanlar boş string olur. */
export function formToObject(formData: FormData, keys: readonly string[]) {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    out[key] = typeof value === "string" ? value : "";
  }
  return out;
}
