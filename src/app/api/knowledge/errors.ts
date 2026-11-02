import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { NotFoundError, StoreUnavailableError } from "@/lib/kb-store";

/** Düzenleme hatalarını kullanıcıya anlaşılır mesaj olarak döndürür */
export function knowledgeError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.issues[0]?.message ?? "Geçersiz bilgi", field: err.issues[0]?.path[0] }, { status: 400 });
  }
  if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
  if (err instanceof StoreUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
  console.error("[api/knowledge]", err);
  return NextResponse.json({ error: "Kaydedilemedi. Birkaç saniye sonra tekrar deneyin." }, { status: 500 });
}
