import "server-only";
import { generateText, type LanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { company } from "@/data/company";
import type { Knowledge } from "@/lib/kb";
import { hoursSummary, isOpen, nowLabel } from "@/lib/hours";

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * AI sağlayıcısı:
 *  - NVIDIA_API_KEY varsa NVIDIA (build.nvidia.com, OpenAI uyumlu API)
 *  - yoksa Vercel AI Gateway (Vercel'de OIDC ile otomatik, lokalde AI_GATEWAY_API_KEY)
 */
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const provider = process.env.NVIDIA_API_KEY ? "nvidia" : "gateway";

export const AI_MODEL =
  process.env.AI_MODEL || (provider === "nvidia" ? "meta/llama-3.3-70b-instruct" : "anthropic/claude-haiku-5.5");

export const AI_PROVIDER = provider === "nvidia" ? "NVIDIA" : "Vercel AI Gateway";

function model(): LanguageModel {
  if (provider === "nvidia") {
    return createOpenAICompatible({ name: "nvidia", baseURL: NVIDIA_BASE_URL, apiKey: process.env.NVIDIA_API_KEY }).chatModel(AI_MODEL);
  }
  return AI_MODEL;
}

export function aiAvailable(): boolean {
  if (process.env.AI_DISABLED === "true") return false;
  return Boolean(process.env.NVIDIA_API_KEY || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

/** Firma bilgisinden AI talimatını üretir. Panelde de önizleme olarak gösterilir. */
export function buildInstructions(kb: Knowledge, now = new Date()): string {
  const c = company;
  const faqBlock = kb.categories
    .map((cat) => {
      const items = kb.faq.filter((f) => f.category === cat.id);
      return `### ${cat.title}\n${items.map((f) => `S: ${f.question}\nC: ${f.answer}`).join("\n\n")}`;
    })
    .join("\n\n");

  return `Sen "${c.name}" firmasının WhatsApp asistanı ${c.botName}'sın. Müşterilere firma adına cevap veriyorsun.

# Firma
${c.description}
Slogan: ${c.tagline}

# Koleksiyonlar ve hizmetler
${c.services.map((s) => `- ${s.name}: ${s.detail}`).join("\n")}

# Fiyatlar (güncel site fiyatları)
${c.pricing.map((p) => `- ${p.item}: ${p.price}${p.note ? ` (${p.note})` : ""}`).join("\n")}

# Teslimat bölgesi
${c.serviceArea.join(", ")}

# Canlı destek saatleri (sipariş 7/24 verilebilir)
${hoursSummary()}
Şu an: ${nowLabel(now)} — firma şu anda ${isOpen(now) ? "AÇIK" : "KAPALI"}.

# İletişim
Telefon: ${c.contact.phone} | E-posta: ${c.contact.email} | Web: ${c.contact.website}
Adres: ${c.contact.address}

# Politikalar
${c.policies.map((p) => `- ${p}`).join("\n")}

# Hazır bilgi bankası (bu cevaplar firmanın onaylı bilgisidir)
${faqBlock}

# Yazım kuralları
- Ton: ${c.tone}
- Müşteri hangi dilde yazarsa o dilde cevap ver (varsayılan Türkçe).
- WhatsApp biçimi kullan: *kalın*, _italik_, madde için "• ". Markdown başlık (#), tablo veya [link](url) KULLANMA.
- Cevaplar kısa olsun: genelde 1–4 cümle, en fazla ~600 karakter.
- Yalnızca yukarıdaki bilgilere dayan. Ürün linki verirken sadece bilgi bankasındaki linkleri kullan. Bilmediğin bir şeyi uydurma; "Bu konuda net bilgi veremiyorum, isterseniz sizi bir yetkiliye bağlayayım" de.
${c.guardrails.map((g) => `- ${g}`).join("\n")}
- Müşteri sipariş sorunu, şikâyet, özel üretim veya toptan talebi iletiyorsa bilgileri özetle ve ekibin dönüş yapacağını söyle.`;
}

export type AiResult = { text: string; model: string; ms: number; inputTokens?: number; outputTokens?: number };

export async function askAi(message: string, history: ChatTurn[], kb: Knowledge): Promise<AiResult> {
  const started = Date.now();
  const result = await generateText({
    model: model(),
    instructions: buildInstructions(kb),
    messages: [...history.slice(-10), { role: "user", content: message }],
    maxOutputTokens: 500,
    temperature: 0.3,
    abortSignal: AbortSignal.timeout(25_000),
  });
  return {
    // Bazı açık modeller düşünme sürecini <think> etiketiyle döndürür; müşteriye gitmesin
    text: result.text.replace(/<think>[\s\S]*?<\/think>/g, "").trim(),
    model: AI_MODEL,
    ms: Date.now() - started,
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
  };
}
