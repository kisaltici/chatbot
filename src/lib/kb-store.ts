import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "redis";
import { defaultKnowledge, slugify, type EntryInput, type Knowledge } from "@/lib/kb";

/**
 * Bilgi bankasının kalıcı deposu.
 *  - REDIS_URL varsa Redis (Vercel'de Upstash Redis — Marketplace'ten tek komutla eklenir)
 *  - yoksa ve lokal geliştirmedeysek proje içindeki .data/knowledge.json
 *  - ikisi de yoksa (Vercel'de Redis eklenmemişse) varsayılan içerik okunur, kaydetme hata verir
 * Okumalar her instance'ta 15 sn önbelleklenir; kaydetme önbelleği hemen yeniler.
 */

const KEY = "zuulab:knowledge:v1";
const FILE = path.join(process.cwd(), ".data", "knowledge.json");
const TTL_MS = 15_000;

export class StoreUnavailableError extends Error {}
export class NotFoundError extends Error {}

type RedisClient = ReturnType<typeof createClient>;
let redisPromise: Promise<RedisClient> | null = null;

function redis(): Promise<RedisClient> | null {
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  if (!redisPromise) {
    const client = createClient({ url });
    client.on("error", (err) => console.error("[kb-store] Redis hatası", err));
    redisPromise = client.connect().then(() => client).catch((err) => {
      redisPromise = null;
      throw err;
    });
  }
  return redisPromise;
}

export function storeKind(): "redis" | "file" | "none" {
  if (process.env.REDIS_URL || process.env.KV_URL) return "redis";
  // KB_FILE_STORE=true: kendi sunucunuzda (ya da lokal production testinde) dosyaya yaz
  if (process.env.KB_FILE_STORE === "true") return "file";
  return process.env.NODE_ENV === "production" ? "none" : "file";
}

let cache: { value: Knowledge; at: number } | null = null;

async function readRaw(): Promise<string | null> {
  const r = redis();
  if (r) return (await r).get(KEY);
  if (storeKind() === "file") return fs.readFile(FILE, "utf8").catch(() => null);
  return null;
}

async function writeRaw(json: string): Promise<void> {
  const r = redis();
  if (r) {
    await (await r).set(KEY, json);
    return;
  }
  if (storeKind() === "file") {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, json, "utf8");
    return;
  }
  throw new StoreUnavailableError(
    "Kalıcı depo bağlı değil. Vercel'de Upstash Redis ekleyin (vercel integration add upstash/upstash-kv); REDIS_URL otomatik tanımlanır.",
  );
}

export async function getKnowledge(): Promise<Knowledge> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let value = defaultKnowledge();
  try {
    const raw = await readRaw();
    if (raw) {
      const parsed = JSON.parse(raw) as Knowledge;
      if (Array.isArray(parsed.faq) && Array.isArray(parsed.categories)) value = parsed;
    }
  } catch (err) {
    // Depo okunamazsa bot susmasın: varsayılan içerikle devam
    console.error("[kb-store] bilgi bankası okunamadı, varsayılan kullanılıyor", err);
  }
  cache = { value, at: Date.now() };
  return value;
}

async function mutate(fn: (kb: Knowledge) => Knowledge): Promise<Knowledge> {
  cache = null;
  const next = fn(await getKnowledge());
  next.updatedAt = new Date().toISOString();
  await writeRaw(JSON.stringify(next));
  cache = { value: next, at: Date.now() };
  return next;
}

function cleanRelated(kb: Knowledge, related: string[], selfId?: string) {
  const ids = new Set(kb.faq.map((f) => f.id));
  return related.filter((r) => r !== selfId && ids.has(r)).slice(0, 2);
}

export async function createEntry(input: EntryInput): Promise<{ kb: Knowledge; id: string }> {
  let id = "";
  const kb = await mutate((kb) => {
    if (!kb.categories.some((c) => c.id === input.category)) throw new NotFoundError("Kategori bulunamadı");
    id = slugify(input.question, new Set(kb.faq.map((f) => f.id)));
    return { ...kb, faq: [...kb.faq, { id, ...input, related: cleanRelated(kb, input.related) }] };
  });
  return { kb, id };
}

export async function updateEntry(id: string, input: EntryInput): Promise<Knowledge> {
  return mutate((kb) => {
    if (!kb.faq.some((f) => f.id === id)) throw new NotFoundError("Soru bulunamadı");
    if (!kb.categories.some((c) => c.id === input.category)) throw new NotFoundError("Kategori bulunamadı");
    return { ...kb, faq: kb.faq.map((f) => (f.id === id ? { id, ...input, related: cleanRelated(kb, input.related, id) } : f)) };
  });
}

export async function deleteEntry(id: string): Promise<Knowledge> {
  return mutate((kb) => {
    if (!kb.faq.some((f) => f.id === id)) throw new NotFoundError("Soru bulunamadı");
    // Silinen soruyu öneren diğer kayıtlardan da çıkar
    const faq = kb.faq.filter((f) => f.id !== id).map((f) => (f.related?.includes(id) ? { ...f, related: f.related.filter((r) => r !== id) } : f));
    return { ...kb, faq };
  });
}
