import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// OWASP'ın scrypt önerisine yakın, küçük sunucuda da makul sürede çalışan değerler.
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 128 * N * R * 2;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, length: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, length, { N: n, r, p, maxmem: MAX_MEM }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEY_LENGTH);
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await derive(
    password,
    Buffer.from(salt, "base64url"),
    Number(n),
    Number(r),
    Number(p),
    expected.length,
  );
  return timingSafeEqual(actual, expected);
}

/**
 * Kullanıcı bulunamadığında da aynı süre harcansın diye boşuna hesaplanır.
 * Böylece yanıt süresine bakarak kayıtlı hesap tespit edilemez.
 */
const DUMMY_SALT = randomBytes(16);
export async function burnPasswordTime(password: string): Promise<void> {
  await derive(password, DUMMY_SALT, N, R, P, KEY_LENGTH);
}
