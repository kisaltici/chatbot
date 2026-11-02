import { NextResponse } from "next/server";
import { z } from "zod";
import { SIGNATURE_HEADER, verifySignature } from "@/lib/bridge";
import { sendTemplateMessage } from "@/lib/bot";

const Body = z.object({
  event: z.enum(["cod.request", "cod.reminder", "cod.cancelled"]),
  to: z.string().regex(/^90\d{10}$/),
  orderNumber: z.string().min(3).max(40),
  customerName: z.string().max(120).optional(),
  total: z.number().optional(),
});

/**
 * zuulab.com → WhatsApp: siparişle ilgili şablon mesajı gönderir.
 * Yalnızca WHATSAPP_BRIDGE_SECRET ile imzalı istekler kabul edilir.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifySignature(process.env.WHATSAPP_BRIDGE_SECRET ?? "", raw, request.headers.get(SIGNATURE_HEADER))) {
    return NextResponse.json({ ok: false, error: "Geçersiz imza" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });

  try {
    const messageId = await sendTemplateMessage(parsed.data);
    return NextResponse.json({ ok: true, messageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[integrations/zuulab/send]", message);
    return NextResponse.json({ ok: false, error: message.slice(0, 300) }, { status: 502 });
  }
}
