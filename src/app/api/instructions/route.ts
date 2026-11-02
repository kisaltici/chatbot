import { buildInstructions } from "@/lib/ai";
import { getKnowledge } from "@/lib/kb-store";

/** AI'ye gönderilen talimatın önizlemesi (panelde gösterilir) */
export async function GET() {
  return new Response(buildInstructions(await getKnowledge()), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
