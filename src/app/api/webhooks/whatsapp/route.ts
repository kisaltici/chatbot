import { after } from "next/server";
import { getBot } from "@/lib/bot";

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

export async function GET(request: Request) {
  return notConfigured() ?? getBot().webhooks.whatsapp(request);
}

export async function POST(request: Request) {
  return (
    notConfigured() ??
    getBot().webhooks.whatsapp(request, {
      waitUntil: (task) => after(() => task),
    })
  );
}
