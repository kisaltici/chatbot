import { NextResponse } from "next/server";
import { recentDiag, redisCheck, whatsappCheck } from "@/lib/diag";

/** Panel: canlı bağlantı kontrolleri ve son WhatsApp olayları (şifreli panel arkasında) */
export async function GET() {
  const [whatsapp, redis, events] = await Promise.all([whatsappCheck(), redisCheck(), recentDiag()]);
  return NextResponse.json({ whatsapp, redis, events, checkedAt: new Date().toISOString() });
}
