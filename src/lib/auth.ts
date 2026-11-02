/**
 * Panel girişi: tek şifre (ADMIN_PASSWORD) + HMAC imzalı oturum çerezi.
 * Web Crypto kullanır; hem proxy.ts hem route handler'larda çalışır.
 */

export const SESSION_COOKIE = "fa_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function secret(): string {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${exp}.${await hmac(String(exp))}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token || !secret()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(exp));
}

export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Uzunluk sızmasın diye ikisini de hash'leyip karşılaştır
  const [a, b] = await Promise.all([hmac(`pw:${input}`), hmac(`pw:${expected}`)]);
  return safeEqual(a, b);
}
