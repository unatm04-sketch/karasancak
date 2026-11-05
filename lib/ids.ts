import { createHash, createHmac, randomBytes } from "node:crypto";
import { customAlphabet, nanoid } from "nanoid";

export const newId = () => nanoid(16);

/** Karışan karakterler (0/O, 1/l) çıkarıldı: elle yazılırsa da hata olmasın. */
const referralAlphabet = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);
export const newReferralCode = () => referralAlphabet();

const slugSuffixAlphabet = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 5);
export const newSlugSuffix = () => slugSuffixAlphabet();

export const newToken = () => randomBytes(32).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const DEV_SECRET = "karasancak-yerel-gelistirme-anahtari";

function appSecret(): string {
  const secret = process.env.APP_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_SECRET ortam değişkeni tanımlı değil.");
  }
  return DEV_SECRET;
}

/** Ziyaretçi tekilleştirme gibi işlerde ham veriyi saklamadan karşılaştırma yapar. */
export const keyedHash = (value: string) =>
  createHmac("sha256", appSecret()).update(value).digest("base64url");
