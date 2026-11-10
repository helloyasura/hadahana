import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Accounts are not configured");
  return createHash("sha256").update(secret).digest();
}
export function configured() { return !!process.env.LUMS_API_URL && (process.env.SESSION_SECRET?.length || 0) >= 32; }
export function seal(value: unknown, purpose: string, ttl = 86400) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(purpose));
  const data = Buffer.concat([cipher.update(JSON.stringify({ value, exp: Date.now() + ttl * 1000 })), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function unseal<T>(sealed: string | undefined, purpose: string): T | null {
  if (!sealed) return null;
  try {
    const b = Buffer.from(sealed, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose)); decipher.setAuthTag(b.subarray(12, 28));
    const result = JSON.parse(Buffer.concat([decipher.update(b.subarray(28)), decipher.final()]).toString());
    return result.exp > Date.now() ? result.value as T : null;
  } catch { return null; }
}
