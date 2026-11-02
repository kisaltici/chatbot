import { NextResponse } from "next/server";
import { getKnowledge, storeKind } from "@/lib/kb-store";

/** Panel: bilgi bankasının tamamı ve hangi depoya yazıldığı */
export async function GET() {
  const kb = await getKnowledge();
  return NextResponse.json({ ...kb, store: storeKind() });
}
