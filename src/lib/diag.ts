import "server-only";
import { createClient } from "redis";

/**
 * Tanılama kaydı: WhatsApp'tan gelen son olaylar ve gönderim hataları.
 * Panelde "WhatsApp bağlantısı" sayfasında gösterilir; böylece Vercel loglarına bakmadan sorun görülür.
 * Redis varsa orada (son 50 kayıt), yoksa sunucu belleğinde tutulur. Telefon numaraları maskelenir.
 */

export type DiagEvent = { at: string; kind: "in" | "out" | "error" | "info"; text: string };

const KEY = "zuulab:diag:v1";
const MAX = 50;
const memory: DiagEvent[] = [];

type RedisClient = ReturnType<typeof createClient>;
let clientPromise: Promise<RedisClient> | null = null;

function redis(): Promise<RedisClient> | null {
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  if (!clientPromise) {
    const c = createClient({ url, socket: { connectTimeout: 5000 } });
    c.on("error", () => {});
    clientPromise = c.connect().then(() => c).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export const maskPhone = (p: string) => (p.length > 5 ? `${p.slice(0, 4)}•••${p.slice(-2)}` : "•••");

/** Kaydı yazar; asla hata fırlatmaz */
export async function diag(kind: DiagEvent["kind"], text: string): Promise<void> {
  const ev: DiagEvent = { at: new Date().toISOString(), kind, text: text.slice(0, 400) };
  memory.unshift(ev);
  memory.length = Math.min(memory.length, MAX);
  try {
    const r = redis();
    if (r) {
      const c = await r;
      await c.lPush(KEY, JSON.stringify(ev));
      await c.lTrim(KEY, 0, MAX - 1);
    }
  } catch {
    // tanılama asla asıl akışı bozmasın
  }
}

export async function recentDiag(): Promise<DiagEvent[]> {
  try {
    const r = redis();
    if (r) return (await (await r).lRange(KEY, 0, MAX - 1)).map((s) => JSON.parse(s) as DiagEvent);
  } catch {
    // Redis'e ulaşılamazsa bellektekini göster
  }
  return memory;
}

export async function redisCheck(): Promise<{ ok: boolean; detail: string }> {
  const r = redis();
  if (!r) return { ok: false, detail: "REDIS_URL tanımlı değil" };
  try {
    const pong = await (await r).ping();
    return { ok: pong === "PONG", detail: "Bağlı" };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

/** Meta erişim anahtarı ve numara kimliği gerçekten çalışıyor mu? */
export async function whatsappCheck(): Promise<{ ok: boolean; detail: string; phone?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !id) return { ok: false, detail: "WHATSAPP_ACCESS_TOKEN veya WHATSAPP_PHONE_NUMBER_ID eksik" };
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${encodeURIComponent(id)}?fields=display_phone_number,verified_name,quality_rating`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as { display_phone_number?: string; verified_name?: string; error?: { message?: string; code?: number } };
    if (!res.ok) {
      const msg = data.error?.message ?? `HTTP ${res.status}`;
      const hint = /expired|Session has expired/i.test(msg)
        ? " → Erişim anahtarının süresi dolmuş; Meta'da yeni token oluşturup Vercel'de güncelleyin ve Redeploy yapın."
        : /Invalid OAuth|Cannot parse/i.test(msg)
          ? " → Erişim anahtarı geçersiz; Vercel'deki değeri kontrol edin."
          : "";
      return { ok: false, detail: msg + hint };
    }
    return { ok: true, detail: data.verified_name ? `${data.verified_name}` : "Geçerli", phone: data.display_phone_number };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * WhatsApp hesabı (WABA) bu uygulamaya abone mi? Abone değilse Meta gelen mesajları webhook'a HİÇ göndermez
 * (anahtar çalışır ama siteye olay gelmez). WABA kimliği: WHATSAPP_BUSINESS_ACCOUNT_ID ya da panelden girilen değer.
 */
export async function wabaSubscription(wabaId: string): Promise<{ ok: boolean; detail: string; apps: string[] }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return { ok: false, detail: "WHATSAPP_ACCESS_TOKEN eksik", apps: [] };
  if (!/^\d{5,25}$/.test(wabaId)) return { ok: false, detail: "WhatsApp hesap kimliği (WABA ID) girilmedi", apps: [] };
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${wabaId}/subscribed_apps`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      data?: { whatsapp_business_api_data?: { id?: string; name?: string } }[];
      error?: { message?: string };
    };
    if (!res.ok) return { ok: false, detail: data.error?.message ?? `HTTP ${res.status}`, apps: [] };
    const apps = (data.data ?? []).map((d) => d.whatsapp_business_api_data?.name ?? d.whatsapp_business_api_data?.id ?? "?");
    return apps.length
      ? { ok: true, detail: `Abone uygulamalar: ${apps.join(", ")}`, apps }
      : { ok: false, detail: "Bu WhatsApp hesabına abone uygulama yok — Meta mesajları webhook'a göndermiyor. Aşağıdaki butonla abone edin.", apps };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err), apps: [] };
  }
}

/** WABA'yı bu uygulamaya abone eder (token'ın ait olduğu uygulama) */
export async function subscribeWaba(wabaId: string): Promise<{ ok: boolean; detail: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return { ok: false, detail: "WHATSAPP_ACCESS_TOKEN eksik" };
  if (!/^\d{5,25}$/.test(wabaId)) return { ok: false, detail: "Geçersiz WABA ID" };
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
    if (!res.ok || !data.success) return { ok: false, detail: data.error?.message ?? `HTTP ${res.status}` };
    await diag("info", "WhatsApp hesabı uygulamaya abone edildi; gelen mesajlar artık webhook'a iletilecek");
    return { ok: true, detail: "Abone edildi" };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
