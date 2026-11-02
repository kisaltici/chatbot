import { z } from "zod";
import { categories as defaultCategories, faq as defaultFaq, type Category, type FaqEntry } from "@/data/faq";

/**
 * Bilgi bankası: kategoriler + hazır soru-cevaplar.
 * Varsayılan içerik src/data/faq.ts'ten gelir; panelden yapılan değişiklikler depoya (Redis / lokal dosya) yazılır.
 * Bu dosya hem sunucuda hem tarayıcıda kullanılır (yalnızca tipler ve doğrulama).
 */

export type Knowledge = {
  categories: Category[];
  faq: FaqEntry[];
  /** Son değişiklik zamanı (ISO); varsayılan içerikte null */
  updatedAt: string | null;
};

export const defaultKnowledge = (): Knowledge => ({ categories: defaultCategories, faq: defaultFaq, updatedAt: null });

/** WhatsApp sınırları: liste satırı başlığı 24, butonlu mesaj gövdesi 1024 karakter */
export const LIMITS = { short: 24, question: 160, answer: 1024, phrase: 120, items: 20 } as const;

const phrase = z.string().trim().min(1).max(LIMITS.phrase);

export const EntryInput = z.object({
  category: z.string().min(1, "Kategori seçin"),
  short: z.string().trim().min(2, "Menü adı en az 2 karakter olmalı").max(LIMITS.short, `Menü adı en fazla ${LIMITS.short} karakter olabilir`),
  question: z.string().trim().min(5, "Soruyu yazın").max(LIMITS.question, `Soru en fazla ${LIMITS.question} karakter olabilir`),
  answer: z.string().trim().min(2, "Cevabı yazın").max(LIMITS.answer, `Cevap en fazla ${LIMITS.answer} karakter olabilir (WhatsApp sınırı)`),
  variants: z.array(phrase).max(LIMITS.items).default([]),
  keywords: z.array(phrase).max(LIMITS.items).default([]),
  related: z.array(z.string()).max(2).default([]),
});
export type EntryInput = z.infer<typeof EntryInput>;

/** Sorudan okunabilir, benzersiz bir id üretir: "Kargo ücreti ne kadar?" → "kargo-ucreti-ne-kadar" */
export function slugify(text: string, taken: Set<string>): string {
  const base =
    text
      .toLocaleLowerCase("tr-TR")
      .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c] ?? c)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "soru";
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  return id;
}
