import { NextResponse } from "next/server";
import { EntryInput } from "@/lib/kb";
import { createEntry } from "@/lib/kb-store";
import { knowledgeError } from "../errors";

/** Yeni hazır cevap ekler */
export async function POST(request: Request) {
  try {
    const input = EntryInput.parse(await request.json());
    const { kb, id } = await createEntry(input);
    return NextResponse.json({ ...kb, createdId: id }, { status: 201 });
  } catch (err) {
    return knowledgeError(err);
  }
}
