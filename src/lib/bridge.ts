import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Köprü: zuulab asistan ↔ zuulab.com (zuulab-e).
 * İki yön de WHATSAPP_BRIDGE_SECRET ile imzalanır (zuulab-e/src/lib/services/whatsapp/bridge.ts ile birebir aynı):
 *   x-zuulab-signature: t=<unix saniye>,v1=<hex HMAC-SHA256("<t>.<gövde>")>
 */

export const SIGNATURE_HEADER = "x-zuulab-signature";
const MAX_SKEW_SECONDS = 300;

export function bridgeConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_BRIDGE_SECRET && process.env.ZUULAB_SITE_URL);
}

export function signBody(secret: string, body: string, at: number = Math.floor(Date.now() / 1000)): string {
  const sig = createHmac("sha256", secret).update(`${at}.${body}`).digest("hex");
  return `t=${at},v1=${sig}`;
}

export function verifySignature(secret: string, body: string, header: string | null, now: number = Math.floor(Date.now() / 1000)): boolean {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=") as [string, string]));
  const at = Number(parts.t);
  if (!Number.isFinite(at) || Math.abs(now - at) > MAX_SKEW_SECONDS || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`${at}.${body}`).digest();
  const given = Buffer.from(parts.v1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export type InboundAction = "confirm" | "cancel" | "optout";

export type InboundResult =
  | { result: "confirmed" | "already_confirmed" | "cancelled" | "cancel_requested"; orders: string[] }
  | { result: "opted_out" }
  | { result: "not_found" };

/** zuulab.com'a imzalı istek atar. Ulaşılamazsa ya da hata dönerse null. */
export async function callSite<T>(path: string, payload: unknown): Promise<T | null> {
  const base = process.env.ZUULAB_SITE_URL;
  const secret = process.env.WHATSAPP_BRIDGE_SECRET;
  if (!base || !secret) return null;
  const body = JSON.stringify(payload);
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", [SIGNATURE_HEADER]: signBody(secret, body) },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => null)) as ({ success?: boolean } & T) | null;
    if (!res.ok || !data?.success) {
      console.error(`[bridge] ${path}: site ${res.status} döndü`);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`[bridge] ${path}: siteye ulaşılamadı`, err);
    return null;
  }
}

/** Müşterinin sipariş onayı / iptal / DURDUR cevabını siteye iletir. */
export function sendInboundToSite(input: { action: InboundAction; phone: string; orderNumber?: string }): Promise<InboundResult | null> {
  return callSite<InboundResult>("/api/integrations/whatsapp/inbound", input);
}
