import { NextResponse } from "next/server";
import { AI_MODEL, AI_PROVIDER, aiAvailable } from "@/lib/ai";
import { isOpen, nextOpening, nowLabel } from "@/lib/hours";

/** Kurulum ekranı için: hangi ayarlar yapılmış (değerleri asla döndürmez) */
export async function GET(request: Request) {
  const has = (k: string) => Boolean(process.env[k]);
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    webhookUrl: `${origin}/api/webhooks/whatsapp`,
    env: {
      WHATSAPP_ACCESS_TOKEN: has("WHATSAPP_ACCESS_TOKEN"),
      WHATSAPP_PHONE_NUMBER_ID: has("WHATSAPP_PHONE_NUMBER_ID"),
      WHATSAPP_APP_SECRET: has("WHATSAPP_APP_SECRET"),
      WHATSAPP_VERIFY_TOKEN: has("WHATSAPP_VERIFY_TOKEN"),
      ALLOWED_NUMBERS: has("ALLOWED_NUMBERS"),
      OWNER_NUMBER: has("OWNER_NUMBER"),
      ADMIN_PASSWORD: has("ADMIN_PASSWORD"),
      REDIS_URL: has("REDIS_URL"),
      NVIDIA_API_KEY: has("NVIDIA_API_KEY"),
      ZUULAB_SITE_URL: has("ZUULAB_SITE_URL"),
      WHATSAPP_BRIDGE_SECRET: has("WHATSAPP_BRIDGE_SECRET"),
    },
    whatsappReady: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"].every(has),
    bridge: { configured: has("ZUULAB_SITE_URL") && has("WHATSAPP_BRIDGE_SECRET"), sendUrl: `${origin}/api/integrations/zuulab/send` },
    ai: { available: aiAvailable(), model: AI_MODEL, provider: AI_PROVIDER },
    hours: { open: isOpen(), next: nextOpening(), now: nowLabel() },
  });
}
