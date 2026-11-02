import { NextResponse } from "next/server";
import { EntryInput } from "@/lib/kb";
import { deleteEntry, updateEntry } from "@/lib/kb-store";
import { knowledgeError } from "../../errors";

/** Hazır cevabı günceller */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = EntryInput.parse(await request.json());
    return NextResponse.json(await updateEntry(id, input));
  } catch (err) {
    return knowledgeError(err);
  }
}

/** Hazır cevabı siler */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await deleteEntry(id));
  } catch (err) {
    return knowledgeError(err);
  }
}
