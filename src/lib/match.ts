import type { FaqEntry } from "@/data/faq";

/**
 * Türkçe metin eşleştirme.
 * - Türkçe karakterleri sadeleştirir (ı→i, ş→s ...), büyük/küçük harf farkını kaldırır
 * - Ekleri tolere etmek için kelimeleri ilk 5 harfine indirger ("randevumu" ≈ "randevu")
 * - Yazım hatalarını tolere etmek için harf üçlülerini (trigram) karşılaştırır
 */

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

const STOPWORDS = new Set(
  [
    "ve", "ile", "bir", "bu", "su", "o", "da", "de", "mi", "mı", "mu", "mü", "ne", "nasil", "icin", "ben", "biz",
    "siz", "sizin", "bana", "bize", "acaba", "lutfen", "merhaba", "selam", "iyi", "gunler", "var", "yok", "mi?",
    "ki", "ya", "ama", "veya", "hangi", "kac", "nedir", "midir", "musunuz", "misiniz", "miyim", "olur", "bi",
    "istiyorum", "rica", "ederim", "tesekkurler", "hocam", "abi", "bey", "hanim",
  ].map(fold),
);

export function fold(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıİöşüâîû]/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

export function normalize(s: string): string {
  return fold(s)
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STEM_LEN = 5;
function stems(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map((w) => w.slice(0, STEM_LEN));
}

function trigrams(s: string): Set<string> {
  const t = ` ${normalize(s)} `;
  const out = new Set<string>();
  for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3));
  return out;
}

function dice(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let hit = 0;
  for (const w of new Set(a)) if (setB.has(w)) hit++;
  return (2 * hit) / (new Set(a).size + setB.size);
}

/** Sorgunun ne kadarının ifade tarafından karşılandığı (kısa sorgularda adil davranır) */
function coverage(query: string[], phrase: string[]): number {
  if (!query.length) return 0;
  const p = new Set(phrase);
  const q = new Set(query);
  let hit = 0;
  for (const w of q) if (p.has(w)) hit++;
  return hit / q.size;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

type Indexed = {
  entry: FaqEntry;
  phrases: { stems: string[]; grams: Set<string> }[];
  keywords: { stems: string[]; raw: string }[];
};

/** Her soru listesi için indeks bir kez kurulur (liste değişince yeni dizi gelir, yeni indeks kurulur) */
const indexCache = new WeakMap<readonly FaqEntry[], Indexed[]>();

function indexFor(entries: readonly FaqEntry[]): Indexed[] {
  let idx = indexCache.get(entries);
  if (!idx) {
    idx = entries.map((entry) => ({
      entry,
      phrases: [entry.question, entry.short, ...entry.variants].map((p) => ({ stems: stems(p), grams: trigrams(p) })),
      keywords: entry.keywords.map((k) => ({ stems: stems(k), raw: normalize(k) })),
    }));
    indexCache.set(entries, idx);
  }
  return idx;
}

export type Candidate = { id: string; question: string; short: string; score: number };

export type MatchResult = {
  normalized: string;
  best: Candidate | null;
  candidates: Candidate[];
};

export function matchFaq(text: string, entries: readonly FaqEntry[], limit = 3): MatchResult {
  const index = indexFor(entries);
  const qStems = stems(text);
  const qGrams = trigrams(text);
  const qNorm = normalize(text);

  const scored = index.map(({ entry, phrases, keywords }) => {
    let phraseScore = 0;
    for (const p of phrases) {
      const lexical = 0.55 * dice(qStems, p.stems) + 0.45 * coverage(qStems, p.stems);
      const fuzzy = jaccard(qGrams, p.grams);
      phraseScore = Math.max(phraseScore, 0.7 * lexical + 0.3 * fuzzy);
    }
    let kwHits = 0;
    for (const k of keywords) {
      const allIn = k.stems.length > 0 && k.stems.every((s) => qStems.includes(s));
      if (allIn || (k.raw.length > 3 && qNorm.includes(k.raw))) kwHits++;
    }
    const score = Math.min(1, phraseScore + Math.min(0.35, kwHits * 0.2));
    return { id: entry.id, question: entry.question, short: entry.short, score: Math.round(score * 100) / 100 };
  });

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, limit);
  return { normalized: qNorm, best: candidates[0] ?? null, candidates };
}

/** Eşik değerleri: bunların üstü doğrudan hazır cevap */
export const THRESHOLD = {
  direct: 0.55,
  suggest: 0.3,
} as const;
