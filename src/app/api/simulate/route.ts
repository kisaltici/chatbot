import { NextResponse } from "next/server";
import { z } from "zod";
import { respond } from "@/lib/engine";

const Body = z.object({
  input: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("text"), text: z.string().max(2000) }),
    z.object({ kind: z.literal("action"), id: z.string().max(200), title: z.string().max(200).optional() }),
  ]),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .default([]),
  forceAi: z.boolean().optional(),
  awaiting: z.enum(["order_number"]).nullable().optional(),
});

/** Paneldeki simülatör: WhatsApp'a hiç dokunmadan aynı motoru çalıştırır */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  const { input, history, forceAi, awaiting } = parsed.data;
  // Panel şifreyle korunuyor: sipariş sorgusunda telefon eşleşmesi aranmaz
  const reply = await respond(input, { history, forceAi, awaiting: awaiting ?? null, trusted: true });
  return NextResponse.json(reply);
}
