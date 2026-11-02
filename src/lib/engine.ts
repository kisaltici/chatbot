import "server-only";
import { company } from "@/data/company";
import type { FaqEntry } from "@/data/faq";
import type { Knowledge } from "@/lib/kb";
import { getKnowledge } from "@/lib/kb-store";
import { extractOrderNumber, formatOrder, isActive, isTrackingQuestion, lookupOrder, orderLookupAvailable, ORDER_TEXT, recentOrders } from "@/lib/orders";
import { aiAvailable, askAi, type ChatTurn } from "@/lib/ai";
import { isOpen, nextOpening } from "@/lib/hours";
import { matchFaq, normalize, THRESHOLD, type Candidate } from "@/lib/match";

/**
 * KARAR MOTORU
 * Her mesaj şu sırayla değerlendirilir:
 *   1. Buton/menü seçimi      → doğrudan ilgili içerik
 *   2. Komutlar (#ai, #sifirla) → özel davranış
 *   3. Niyetler (selam, teşekkür, menü, yetkili) → hazır akış
 *   4. Hazır soru-cevap eşleşmesi (güçlü) → AI çağrılmaz
 *   5. AI (firma bilgisiyle)   → hazır cevapta olmayan sorular
 *   6. AI yoksa / hata verirse → "bunu mu demek istediniz?" önerileri
 * WhatsApp ve paneldeki simülatör aynı motoru kullanır.
 */

export type Route = "faq" | "ai" | "intent" | "menu" | "suggest" | "handoff" | "fallback" | "command" | "order";

export type ReplyButton = { id: string; title: string };
export type ReplyList = {
  body: string;
  button: string;
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[];
};

export type Trace = {
  route: Route;
  input: string;
  normalized?: string;
  candidates?: Candidate[];
  matchedId?: string;
  intent?: string;
  model?: string;
  ms: number;
  tokens?: { input?: number; output?: number };
  note?: string;
};

export type BotReply = {
  /** Gönderilecek mesajlar sırayla */
  messages: Array<{ text: string; buttons?: ReplyButton[] } | { list: ReplyList }>;
  trace: Trace;
  /** Yetkiliye devir istendi mi */
  handoff?: boolean;
  /** Konuşma geçmişi sıfırlansın mı */
  resetHistory?: boolean;
  /** Bir sonraki mesajda ne bekleniyor (ör. sipariş numarası); null = hiçbir şey */
  awaiting?: Awaiting;
};

export type Awaiting = "order_number" | null;

export type Incoming =
  | { kind: "text"; text: string }
  | { kind: "action"; id: string; title?: string };

const BTN = {
  menu: { id: "menu", title: "Ana menü" },
  human: { id: "human", title: "Yetkiliye bağlan" },
} as const;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function relatedButtons(kb: Knowledge, entry: FaqEntry): ReplyButton[] {
  const rel = (entry.related ?? [])
    .map((id) => kb.faq.find((f) => f.id === id))
    .filter((f): f is FaqEntry => !!f)
    .slice(0, 2)
    .map((f) => ({ id: `faq:${f.id}`, title: clip(f.short, 20) }));
  return [...rel, BTN.menu].slice(0, 3);
}

export function mainMenu(kb: Knowledge, intro?: string): BotReply["messages"][number] {
  return {
    list: {
      body:
        intro ??
        `Merhaba, ben *${company.shortName}* asistanıyım 👋\nAşağıdaki menüden bir konu seçebilir ya da sorunuzu doğrudan yazabilirsiniz.`,
      button: "Konular",
      sections: [
        {
          title: "Konular",
          rows: [
            ...kb.categories.map((c) => ({ id: `cat:${c.id}`, title: clip(`${c.emoji} ${c.title}`, 24), description: clip(c.description, 72) })),
            { id: "human", title: "👤 Yetkiliye bağlan", description: "Ekibimizden biri size dönüş yapsın" },
          ].slice(0, 10),
        },
      ],
    },
  };
}

function categoryMenu(kb: Knowledge, catId: string): BotReply["messages"][number] | null {
  const cat = kb.categories.find((c) => c.id === catId);
  if (!cat) return null;
  const items = kb.faq.filter((f) => f.category === catId).slice(0, 9);
  return {
    list: {
      body: `${cat.emoji} *${cat.title}*\nMerak ettiğiniz soruyu seçin:`,
      button: "Sorular",
      sections: [
        {
          title: clip(cat.title, 24),
          rows: [
            ...items.map((f) => ({ id: `faq:${f.id}`, title: clip(f.short, 24), description: clip(f.question, 72) })),
            { id: "menu", title: "↩︎ Ana menü" },
          ],
        },
      ],
    },
  };
}

function handoffReply(started: number, input: string): BotReply {
  const open = isOpen();
  const text = open
    ? "Talebinizi ekibimize ilettim 🙌 Kısa süre içinde bir yetkili bu sohbetten size dönüş yapacak.\n\nBeklerken eklemek istediğiniz bir detay varsa yazabilirsiniz."
    : `Talebinizi ekibimize ilettim. Şu an mesai dışındayız; *${nextOpening()}* itibarıyla size dönüş yapacağız.\n\nBu arada sorunuzu detaylı yazarsanız ekibimiz hazırlıklı gelir.`;
  return { messages: [{ text }], handoff: true, trace: { route: "handoff", input, intent: "yetkili", ms: Date.now() - started } };
}

const INTENTS: { name: string; patterns: RegExp }[] = [
  { name: "selam", patterns: /^(merhaba+|mrb|slm|selam(lar)?|selamun aleykum|sa|iyi gunler|gunaydin|iyi aksamlar|hey|hi|hello|alo)\b/ },
  { name: "tesekkur", patterns: /^(tesekkur|tsk|sagol|sag ol|eyvallah|cok sagol|thanks|thank you|tamamdir|tamam tesekkur)/ },
  { name: "menu", patterns: /^(menu|ana menu|basla|baslat|yardim|help|secenekler|konular|0)$/ },
  { name: "yetkili", patterns: /\b(yetkili|temsilci|canli destek|musteri hizmet|insanla|gercek (bir )?kisi|operator|biriyle gorus|beni arayin|beni arar misiniz|sizi arayayim)/ },
  { name: "veda", patterns: /^(gorusuruz|hosca kal|iyi gunler dilerim|bye|bay bay)\b/ },
];

function detectIntent(norm: string): string | null {
  for (const i of INTENTS) if (i.patterns.test(norm)) return i.name;
  return null;
}

export type EngineContext = {
  history: ChatTurn[];
  forceAi?: boolean;
  /** Bir önceki cevapta istenen bilgi */
  awaiting?: Awaiting;
  /** Müşterinin WhatsApp numarası (905…); simülatörde yok */
  phone?: string;
  /** Şifreli paneldeki simülatör: sipariş sorgusunda telefon eşleşmesi aranmaz */
  trusted?: boolean;
};

/** Sipariş numarasıyla sorgu ve cevap */
async function orderReply(orderNumber: string, ctx: EngineContext, input: string, started: number): Promise<BotReply> {
  const res = await lookupOrder(orderNumber, { phone: ctx.phone, trusted: ctx.trusted });
  const ms = Date.now() - started;
  if (!res) return { messages: [{ text: ORDER_TEXT.unavailable, buttons: [BTN.human] }], awaiting: null, trace: { route: "order", input, note: `${orderNumber}: siteye ulaşılamadı`, ms } };
  if (!res.found)
    return {
      messages: [{ text: ctx.trusted ? ORDER_TEXT.notFoundTrusted : ORDER_TEXT.notFound, buttons: [BTN.human] }],
      awaiting: "order_number",
      trace: { route: "order", input, note: `${orderNumber}: bulunamadı`, ms },
    };
  return {
    messages: [{ text: formatOrder(res.order), buttons: [BTN.menu, BTN.human] }],
    awaiting: null,
    trace: { route: "order", input, note: `${res.order.orderNumber} · ${res.order.statusLabel}`, ms },
  };
}

/** "Kargom nerede?" — numara yoksa telefona ait son siparişlere bakar, yine yoksa numara ister */
async function trackingReply(ctx: EngineContext, input: string, started: number): Promise<BotReply> {
  const ms = () => Date.now() - started;
  if (!orderLookupAvailable()) {
    return {
      messages: [{ text: "Siparişinizin durumunu ekibimiz hemen kontrol etsin; sizi bir yetkiliye bağlayabilirim.", buttons: [BTN.human] }],
      trace: { route: "order", input, note: ORDER_TEXT.notConnected, ms: ms() },
    };
  }
  if (ctx.phone) {
    const recent = await recentOrders(ctx.phone);
    const active = (recent ?? []).filter((o) => isActive(o.status));
    if (active.length === 1) return orderReply(active[0].orderNumber, ctx, input, started);
    if (active.length > 1) {
      return {
        messages: [{ text: ORDER_TEXT.pickOne, buttons: active.slice(0, 3).map((o) => ({ id: `order:${o.orderNumber}`, title: o.orderNumber.slice(0, 20) })) }],
        awaiting: "order_number",
        trace: { route: "order", input, note: `${active.length} aktif sipariş bulundu`, ms: ms() },
      };
    }
  }
  return { messages: [{ text: ORDER_TEXT.askNumber }], awaiting: "order_number", trace: { route: "order", input, note: "sipariş numarası istendi", ms: ms() } };
}

export async function respond(input: Incoming, ctx: EngineContext): Promise<BotReply> {
  const started = Date.now();
  const ms = () => Date.now() - started;
  const kb = await getKnowledge();
  const findEntry = (id: string) => kb.faq.find((f) => f.id === id);

  // 1) Buton / liste seçimleri
  if (input.kind === "action") {
    const label = input.title ?? input.id;
    if (input.id === "menu") return { messages: [mainMenu(kb, "Ana menü — bir konu seçin:")], trace: { route: "menu", input: label, ms: ms() } };
    if (input.id === "human") return handoffReply(started, label);
    if (input.id.startsWith("cat:")) {
      const m = categoryMenu(kb, input.id.slice(4));
      if (m) return { messages: [m], trace: { route: "menu", input: label, note: input.id, ms: ms() } };
    }
    if (input.id.startsWith("order:")) return orderReply(input.id.slice(6), ctx, label, started);
    if (input.id.startsWith("faq:")) {
      const entry = findEntry(input.id.slice(4));
      if (entry)
        return {
          messages: [{ text: entry.answer, buttons: relatedButtons(kb, entry) }],
          trace: { route: "faq", input: label, matchedId: entry.id, ms: ms() },
        };
    }
    // Bilinmeyen buton → yazılmış gibi değerlendir
    return respond({ kind: "text", text: label }, ctx);
  }

  const raw = input.text.trim();
  const norm = normalize(raw);

  // 2) Komutlar
  if (/^#\s*(sifirla|reset)/i.test(raw)) {
    return { messages: [{ text: "Konuşma geçmişi sıfırlandı. Yeni bir konuya başlayabilirsiniz." }], resetHistory: true, trace: { route: "command", input: raw, note: "sifirla", ms: ms() } };
  }
  const forceAi = ctx.forceAi || /^#\s*ai\b/i.test(raw);
  const question = forceAi ? raw.replace(/^#\s*ai\b/i, "").trim() || raw : raw;

  if (!norm) {
    return { messages: [mainMenu(kb)], trace: { route: "menu", input: raw, note: "boş/medya mesajı", ms: ms() } };
  }

  // 3) Sipariş / kargo durumu
  if (!forceAi) {
    const orderNumber = extractOrderNumber(raw, ctx.awaiting === "order_number");
    if (orderNumber) return orderReply(orderNumber, ctx, raw, started);
    // Numara beklerken telefon numarası yazıldıysa nazikçe düzelt
    if (ctx.awaiting === "order_number" && /^0?5d{9}$/.test(raw.replace(/[s()+-]/g, "").replace(/^90/, "")))
      return {
        messages: [{ text: "Bu bir telefon numarasına benziyor 🙂 Sipariş numaranız *ZUU-* ile başlar (ör. *ZUU-20260142*); sipariş onay e-postanızda yazar." }],
        awaiting: "order_number",
        trace: { route: "order", input: raw, note: "telefon numarası yazıldı", ms: ms() },
      };
    if (isTrackingQuestion(raw)) return trackingReply(ctx, raw, started);
  }

  // 4) Niyetler
  if (!forceAi) {
    const intent = detectIntent(norm);
    const wordCount = norm.split(" ").length;
    // "Merhaba, kombi bakımı ne kadar?" gibi selam + soru → soruya geç
    const pureIntent = intent && (intent === "yetkili" || wordCount <= 4);
    if (pureIntent) {
      if (intent === "yetkili") return handoffReply(started, raw);
      if (intent === "selam" || intent === "menu")
        return { messages: [mainMenu(kb)], trace: { route: "intent", input: raw, intent, ms: ms() } };
      if (intent === "tesekkur")
        return { messages: [{ text: "Rica ederim 😊 Başka bir konuda yardımcı olabilirsem buradayım.", buttons: [BTN.menu] }], trace: { route: "intent", input: raw, intent, ms: ms() } };
      if (intent === "veda")
        return { messages: [{ text: `İyi günler dileriz! ${company.shortName} olarak her zaman buradayız.` }], trace: { route: "intent", input: raw, intent, ms: ms() } };
    }
  }

  // 4) Hazır cevap eşleşmesi
  const match = matchFaq(question, kb.faq);
  const base = { input: raw, normalized: match.normalized, candidates: match.candidates };

  if (!forceAi && match.best && match.best.score >= THRESHOLD.direct) {
    const entry = findEntry(match.best.id)!;
    return {
      messages: [{ text: entry.answer, buttons: relatedButtons(kb, entry) }],
      trace: { ...base, route: "faq", matchedId: entry.id, ms: ms() },
    };
  }

  // 5) AI
  if (aiAvailable()) {
    try {
      const ai = await askAi(question, ctx.history, kb);
      const suggestions = match.candidates
        .filter((c) => c.score >= THRESHOLD.suggest)
        .slice(0, 2)
        .map((c) => ({ id: `faq:${c.id}`, title: clip(c.short, 20) }));
      return {
        messages: [{ text: ai.text || "Bu konuda net bilgi veremiyorum.", buttons: [...suggestions, BTN.human].slice(0, 3) }],
        trace: { ...base, route: "ai", model: ai.model, ms: ms(), tokens: { input: ai.inputTokens, output: ai.outputTokens } },
      };
    } catch (err) {
      console.error("[engine] AI hatası:", err);
      return fallback(started, base, `AI hatası: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return fallback(started, base, "AI kapalı veya anahtar tanımlı değil");
}

function fallback(started: number, base: Omit<Trace, "route" | "ms">, note: string): BotReply {
  const close = (base.candidates ?? []).filter((c) => c.score >= THRESHOLD.suggest).slice(0, 2);
  if (close.length) {
    return {
      messages: [
        {
          text: "Tam anlayamadım, şunlardan birini mi soruyorsunuz?",
          buttons: [...close.map((c) => ({ id: `faq:${c.id}`, title: clip(c.short, 20) })), BTN.human],
        },
      ],
      trace: { ...base, route: "suggest", note, ms: Date.now() - started },
    };
  }
  return {
    messages: [
      { text: "Bu soruya hazır bir cevabım yok. Menüden bir konu seçebilir ya da sizi bir yetkiliye bağlayabilirim.", buttons: [BTN.menu, BTN.human] },
    ],
    trace: { ...base, route: "fallback", note, ms: Date.now() - started },
  };
}

/** Bota gönderilen bir yanıtı geçmişe yazmak için düz metne çevirir */
export function replyToText(reply: BotReply): string {
  return reply.messages.map((m) => ("list" in m ? m.list.body : m.text)).join("\n\n");
}
