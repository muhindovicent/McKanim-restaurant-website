import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const N = 1 << 17;  // OWASP-recommended memory-hard scrypt baseline
const R = 8;
const P = 1;
const KEY_BYTES = 64;
const MAXMEM = 256 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_BYTES, { N, r: R, p: P, maxmem: MAXMEM }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export function validateOwnerPassword(password: unknown): asserts password is string {
  if (typeof password !== "string") throw new TypeError("A password is required");
  const bytes = Buffer.byteLength(password, "utf8");
  if (password.length < 12 || bytes > 1024) throw new TypeError("Password length must be 12-1024 bytes");
  if (password.includes("\u0000")) throw new TypeError("Password contains an invalid character");
}

export async function hashOwnerPassword(password: string): Promise<string> {
  validateOwnerPassword(password);
  const salt = randomBytes(32);
  const key = await deriveKey(password, salt);
  return ["scrypt", String(N), String(R), String(P), salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyOwnerPassword(password: string, record: string): Promise<boolean> {
  if (typeof password !== "string" || typeof record !== "string") return false;
  const fields = record.split("$");
  if (fields.length !== 6 || fields[0] !== "scrypt") return false;
  const [n, r, p] = fields.slice(1, 4).map(Number);
  if (n !== N || r !== R || p !== P) return false;
  const salt = Buffer.from(fields[4], "base64url");
  const expected = Buffer.from(fields[5], "base64url");
  if (salt.length !== 32 || expected.length !== KEY_BYTES) return false;
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}
