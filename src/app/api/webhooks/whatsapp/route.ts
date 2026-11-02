import { after } from "next/server";
import { getBot } from "@/lib/bot";
import { diag, maskPhone } from "@/lib/diag";

/**
 * Meta WhatsApp Cloud API webhook'u.
 * GET  → Meta'nın doğrulama isteği (hub.challenge)
 * POST → gelen mesajlar (X-Hub-Signature-256 ile imzası doğrulanır)
 */

const REQUIRED = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN"];

function notConfigured() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (!missing.length) return null;
  console.error(`[webhook] Eksik ortam değişkenleri: ${missing.join(", ")}`);
  return new Response("WhatsApp bağlantısı yapılandırılmamış", { status: 503 });
}

type WaValue = {
  messages?: { from?: string; type?: string }[];
  statuses?: { status?: string; recipient_id?: string; errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[] }[];
};

/** Tanılama için gelen olayın kısa özeti (mesaj içeriği yazılmaz) */
async function summarize(request: Request) {
  try {
    const body = (await request.json()) as { entry?: { changes?: { value?: WaValue }[] }[] };
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const v = change.value ?? {};
        for (const m of v.messages ?? []) await diag("in", `Mesaj geldi: ${maskPhone(m.from ?? "?")} (${m.type ?? "?"})`);
        for (const s of v.statuses ?? []) {
          if (s.errors?.length) {
            const e = s.errors[0];
            await diag("error", `Meta iletemedi → ${maskPhone(s.recipient_id ?? "?")}: ${e.code ?? ""} ${e.title ?? e.message ?? ""} ${e.error_data?.details ?? ""}`.trim());
          } else if (s.status === "delivered" || s.status === "read") {
            await diag("out", `Mesaj ${s.status === "read" ? "okundu" : "iletildi"}: ${maskPhone(s.recipient_id ?? "?")}`);
          }
        }
      }
    }
  } catch {
    // özet çıkarılamazsa sorun değil
  }
}

export async function GET(request: Request) {
  return notConfigured() ?? getBot().webhooks.whatsapp(request);
}

export async function POST(request: Request) {
  const missing = notConfigured();
  if (missing) {
    await diag("error", "Webhook çağrıldı ama WhatsApp ortam değişkenleri eksik");
    return missing;
  }
  const copy = request.clone();
  const res = await getBot().webhooks.whatsapp(request, {
    waitUntil: (task) => after(() => task),
  });
  if (res.status === 401 || res.status === 403) {
    await diag("error", `Webhook imzası reddedildi (${res.status}) — WHATSAPP_APP_SECRET, Meta'daki App Secret ile aynı mı?`);
  } else {
    after(() => summarize(copy));
  }
  return res;
}
