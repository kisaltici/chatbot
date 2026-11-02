import { NextResponse } from "next/server";
import { recentDiag, redisCheck, subscribeWaba, wabaSubscription, whatsappCheck } from "@/lib/diag";

const wabaFrom = (url: string) => new URL(url).searchParams.get("waba") || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";

/** Panel: canlı bağlantı kontrolleri ve son WhatsApp olayları (şifreli panel arkasında) */
export async function GET(request: Request) {
  const waba = wabaFrom(request.url);
  const [whatsapp, redis, events, subscription] = await Promise.all([
    whatsappCheck(),
    redisCheck(),
    recentDiag(),
    waba ? wabaSubscription(waba) : Promise.resolve(null),
  ]);
  return NextResponse.json({ whatsapp, redis, events, subscription, waba, checkedAt: new Date().toISOString() });
}

/** WhatsApp hesabını uygulamaya abone eder */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { waba?: string };
  const waba = (body.waba || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "").trim();
  return NextResponse.json(await subscribeWaba(waba));
}
