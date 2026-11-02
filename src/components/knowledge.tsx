"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { FaqEntry } from "@/data/faq";
import { LIMITS, type EntryInput, type Knowledge } from "@/lib/kb";
import { matchFaq, normalize, THRESHOLD } from "@/lib/match";
import { WaText } from "@/components/wa-text";
import { Collapse } from "@/components/ui/collapse";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChipsInput } from "@/components/ui/chips-input";
import { ease } from "@/components/motion-provider";

type Store = "redis" | "file" | "none";
type KbResponse = Knowledge & { store?: Store; createdId?: string; error?: string; field?: string };

export function Knowledge() {
  const [kb, setKb] = useState<Knowledge | null>(null);
  const [store, setStore] = useState<Store>("file");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // entry id ya da "new"
  const [deleting, setDeleting] = useState<FaqEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: KbResponse) => {
        setKb(d);
        if (d.store) setStore(d.store);
      })
      .catch(() => setLoadError("Hazır cevaplar yüklenemedi. Sayfayı yenileyin."));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const faq = useMemo(() => kb?.faq ?? [], [kb]);
  const categories = kb?.categories ?? [];
  const result = useMemo(() => (query.trim().length > 2 && faq.length ? matchFaq(query, faq, 3) : null), [query, faq]);

  const visible = useMemo(() => {
    const q = normalize(query);
    let items = cat === "all" ? faq : faq.filter((f) => f.category === cat);
    if (q.length >= 2) {
      const textHits = items.filter((f) => normalize([f.question, f.short, ...f.variants, ...f.keywords].join(" ")).includes(q));
      if (textHits.length) items = textHits;
      else {
        const score = new Map((result?.candidates ?? []).filter((c) => c.score >= THRESHOLD.suggest).map((c) => [c.id, c.score]));
        items = items.filter((f) => score.has(f.id)).sort((a, b) => score.get(b.id)! - score.get(a.id)!);
      }
    }
    return items;
  }, [query, cat, faq, result]);

  async function save(input: EntryInput, id: string | null): Promise<string | null> {
    const res = await fetch(id ? `/api/knowledge/entries/${encodeURIComponent(id)}` : "/api/knowledge/entries", {
      method: id ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as KbResponse | null;
    if (!res?.ok || !data) return data?.error ?? "Kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.";
    setKb(data);
    setEditing(null);
    if (!id && data.createdId) {
      setCat("all");
      setQuery("");
      setOpen(data.createdId);
    }
    setToast(id ? "Değişiklikler kaydedildi" : "Yeni soru eklendi");
    return null;
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const res = await fetch(`/api/knowledge/entries/${encodeURIComponent(deleting.id)}`, { method: "DELETE" }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as KbResponse | null;
    setBusy(false);
    if (!res?.ok || !data) {
      setDeleting(null);
      setToast(data?.error ?? "Silinemedi, tekrar deneyin");
      return;
    }
    setKb(data);
    setOpen(null);
    setEditing(null);
    setDeleting(null);
    setToast("Soru silindi");
  }

  const best = result?.best;
  const willAnswer = !!best && best.score >= THRESHOLD.direct;

  if (loadError) return <p className="rounded-2xl bg-danger-soft px-5 py-4 text-[15px] text-danger">{loadError}</p>;

  return (
    <div>
      {store !== "redis" && (
        <p className="mb-6 flex items-start gap-3 text-[14px] leading-relaxed text-ink-2">
          <span className={`mt-[7px] size-2 shrink-0 rounded-full ${store === "file" ? "bg-ai-dot" : "bg-warn-dot"}`} aria-hidden />
          {store === "file" ? (
            <span>
              Değişiklikler şimdilik bu bilgisayarda <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[12.5px]">.data/knowledge.json</code>{" "}
              dosyasına kaydediliyor. Vercel&apos;de kalıcı olması için Upstash Redis ekleyin.
            </span>
          ) : (
            <span>Kalıcı depo bağlı değil; düzenlemeler kaydedilemez. Vercel&apos;de Upstash Redis ekleyin (REDIS_URL kendiliğinden tanımlanır).</span>
          )}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="kb-search" className="sr-only">
            Müşteri gibi bir soru yazın
          </label>
          <input
            id="kb-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Müşteri gibi bir soru yazın: “lamba kaç günde gelir”"
            className="h-14 w-full rounded-[20px] bg-surface pl-14 pr-12 text-[16px] shadow-sm ring-1 ring-line outline-none transition-shadow placeholder:text-muted focus-visible:ring-transparent"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Aramayı temizle"
              >
                <X className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setEditing(editing === "new" ? null : "new");
            setOpen(null);
          }}
          aria-expanded={editing === "new"}
          className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-[20px] bg-ink px-6 text-[15px] font-medium text-bg"
        >
          <motion.span animate={{ rotate: editing === "new" ? 45 : 0 }} className="grid">
            <Plus className="size-[18px]" strokeWidth={2.2} aria-hidden />
          </motion.span>
          {editing === "new" ? "Vazgeç" : "Yeni soru ekle"}
        </motion.button>
      </div>

      <Collapse open={!!result}>
        <p className="flex items-start gap-3 px-2 pt-4 text-[15px] leading-relaxed text-ink-2" role="status">
          <span className={`mt-2 size-2 shrink-0 rounded-full ${willAnswer ? "bg-faq-dot" : "bg-ai-dot"}`} aria-hidden />
          {willAnswer ? (
            <span>
              Bot bu soruya <b className="font-medium text-ink">“{best!.short}”</b> cevabını verir — %{Math.round(best!.score * 100)} eşleşme, AI kullanılmaz.
            </span>
          ) : (
            <span>
              Güçlü bir hazır cevap yok (en yakını %{Math.round((best?.score ?? 0) * 100)}), bu soru AI&apos;ye gider. Sık soruluyorsa hazır cevap olarak
              ekleyin.
            </span>
          )}
        </p>
      </Collapse>

      <Collapse open={editing === "new" && !!kb}>
        {kb && (
          <div className="mt-6 rounded-[26px] bg-surface p-5 shadow-sm ring-1 ring-line sm:p-7">
            <h2 className="font-display text-[24px] leading-tight">yeni soru</h2>
            <EntryForm
              kb={kb}
              initial={{ category: cat !== "all" ? cat : (kb.categories[0]?.id ?? ""), question: query.trim().length > 4 && !willAnswer ? query.trim() : "" }}
              onCancel={() => setEditing(null)}
              onSave={(input) => save(input, null)}
              submitLabel="Soruyu ekle"
            />
          </div>
        )}
      </Collapse>

      <div className="no-scrollbar -mx-4 mt-8 overflow-x-auto px-4">
        <ul className="flex w-max gap-1.5" aria-label="Kategoriler">
          {[{ id: "all", title: "tümü" }, ...categories].map((c) => {
            const active = cat === c.id;
            const count = c.id === "all" ? faq.length : faq.filter((f) => f.category === c.id).length;
            return (
              <li key={c.id} className="relative">
                {active && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} aria-hidden />}
                <button
                  onClick={() => setCat(c.id)}
                  aria-pressed={active}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[14px] transition-colors duration-200 ${
                    active ? "text-bg" : "text-ink-2 hover:bg-surface-2"
                  }`}
                >
                  {c.title.toLocaleLowerCase("tr-TR")}
                  <span className={`text-[12px] tabular-nums ${active ? "text-bg/60" : "text-muted"}`}>{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {!kb ? (
        <div className="mt-6 flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : (
        <ul className="mt-6 border-t border-line">
          <AnimatePresence initial={false}>
            {visible.map((f) => (
              <motion.li
                key={f.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.3, ease } }}
                transition={{ duration: 0.35, ease }}
                className="overflow-hidden border-b border-line"
              >
                <Entry
                  kb={kb}
                  entry={f}
                  open={open === f.id}
                  editing={editing === f.id}
                  onToggle={() => {
                    setOpen(open === f.id ? null : f.id);
                    if (editing === f.id) setEditing(null);
                  }}
                  onEdit={() => setEditing(f.id)}
                  onCancelEdit={() => setEditing(null)}
                  onSave={(input) => save(input, f.id)}
                  onDelete={() => setDeleting(f)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {kb && visible.length === 0 && (
        <p className="py-16 text-center text-[15px] text-muted">Bu aramaya uyan hazır cevap yok. Yeni bir soru olarak ekleyebilirsiniz.</p>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Bu soruyu silmek istediğinize emin misiniz?"
        description={
          deleting && (
            <>
              <span className="text-ink">“{deleting.question}”</span> silinecek. Bot bu soruya artık hazır cevap vermez; benzer sorular AI&apos;ye gider.
            </>
          )
        }
        confirmLabel="Evet, sil"
        tone="danger"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.18 } }}
            className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14px] text-bg shadow-xl lg:bottom-8"
          >
            <Check className="size-4" strokeWidth={2.4} aria-hidden />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Entry({
  kb,
  entry,
  open,
  editing,
  onToggle,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  kb: Knowledge;
  entry: FaqEntry;
  open: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (input: EntryInput) => Promise<string | null>;
  onDelete: () => void;
}) {
  const id = `faq-${entry.id}`;
  const category = kb.categories.find((c) => c.id === entry.category);
  return (
    <>
      <button onClick={onToggle} aria-expanded={open} aria-controls={id} className="group flex w-full items-center gap-6 py-5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] text-ink">{entry.question}</span>
          <span className="mt-1 block truncate text-[13.5px] text-muted">{entry.variants.slice(0, 3).join(", ") || category?.title}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0, backgroundColor: open ? "var(--ink)" : "var(--surface-2)", color: open ? "var(--bg)" : "var(--ink-2)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="grid size-8 shrink-0 place-items-center rounded-full"
          aria-hidden
        >
          <Plus className="size-4" />
        </motion.span>
      </button>

      <Collapse open={open} id={id}>
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pb-8">
              <EntryForm kb={kb} entry={entry} onCancel={onCancelEdit} onSave={onSave} submitLabel="Değişiklikleri kaydet" />
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pb-7">
              <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div className="chat-wall rounded-[22px] p-4">
                  <div className="max-w-[92%] rounded-[20px] rounded-bl-md bg-bubble-in px-3.5 py-2.5 text-[14.5px] leading-[1.45] shadow-sm">
                    <WaText text={entry.answer} />
                  </div>
                </div>
                <dl className="flex flex-col gap-5 text-[14.5px]">
                  <Info label="kategori">{category ? `${category.emoji} ${category.title}` : "—"}</Info>
                  <Info label="menüdeki adı">{entry.short}</Info>
                  {entry.variants.length > 0 && (
                    <Info label="bu sorular da buraya gelir">
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {entry.variants.map((v) => (
                          <span key={v} className="rounded-full bg-surface-2 px-3 py-1 text-[13px] text-ink-2">
                            {v}
                          </span>
                        ))}
                      </span>
                    </Info>
                  )}
                  {entry.keywords.length > 0 && <Info label="anahtar kelimeler">{entry.keywords.join(", ")}</Info>}
                </dl>
              </div>
              <div className="mt-6 flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onEdit}
                  className="flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-[14px] shadow-sm ring-1 ring-line transition-colors hover:bg-surface-2"
                >
                  <Pencil className="size-3.5" aria-hidden /> Düzenle
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onDelete}
                  className="flex h-10 items-center gap-2 rounded-full px-4 text-[14px] text-danger transition-colors hover:bg-danger-soft"
                >
                  <Trash2 className="size-3.5" aria-hidden /> Sil
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Collapse>
    </>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

/* ───────────── Form ───────────── */

function EntryForm({
  kb,
  entry,
  initial,
  onSave,
  onCancel,
  submitLabel,
}: {
  kb: Knowledge;
  entry?: FaqEntry;
  initial?: Partial<EntryInput>;
  onSave: (input: EntryInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<EntryInput>({
    category: entry?.category ?? initial?.category ?? kb.categories[0]?.id ?? "",
    question: entry?.question ?? initial?.question ?? "",
    short: entry?.short ?? "",
    answer: entry?.answer ?? "",
    variants: entry?.variants ?? [],
    keywords: entry?.keywords ?? [],
    related: entry?.related ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof EntryInput>(k: K, v: EntryInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const uid = entry?.id ?? "new";
  const others = kb.faq.filter((f) => f.id !== entry?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.short.trim().length > LIMITS.short) return setError(`Menü adı en fazla ${LIMITS.short} karakter olabilir`);
    setSaving(true);
    setError(null);
    const err = await onSave({ ...form, related: form.related.filter(Boolean) });
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <Field label="kategori">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kategori">
            {kb.categories.map((c) => {
              const active = form.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set("category", c.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[13.5px] transition-colors duration-200 ${active ? "bg-ink text-bg" : "bg-surface-2 text-ink-2 hover:text-ink"}`}
                >
                  {c.title}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="müşterinin sorusu" htmlFor={`q-${uid}`}>
          <input
            id={`q-${uid}`}
            value={form.question}
            onChange={(e) => set("question", e.target.value)}
            maxLength={LIMITS.question}
            placeholder="Kargo ücreti ne kadar?"
            className="h-12 w-full rounded-2xl bg-surface-2 px-4 text-[15px] outline-none placeholder:text-muted"
            required
          />
        </Field>

        <Field label="menüdeki adı" htmlFor={`s-${uid}`} hint="WhatsApp listesinde görünen kısa başlık" counter={`${form.short.length}/${LIMITS.short}`} over={form.short.length > LIMITS.short}>
          <input
            id={`s-${uid}`}
            value={form.short}
            onChange={(e) => set("short", e.target.value)}
            placeholder="Kargo ücreti"
            className="h-12 w-full rounded-2xl bg-surface-2 px-4 text-[15px] outline-none placeholder:text-muted"
            required
          />
        </Field>

        <Field
          label="cevap"
          htmlFor={`a-${uid}`}
          hint="*kalın*  _italik_  ~üstü çizili~"
          counter={`${form.answer.length}/${LIMITS.answer}`}
          over={form.answer.length > LIMITS.answer}
        >
          <textarea
            id={`a-${uid}`}
            value={form.answer}
            onChange={(e) => set("answer", e.target.value)}
            rows={6}
            placeholder="Kargo ücreti *110 TL*. *699 TL ve üzeri* siparişlerde kargo ücretsiz."
            className="scroll-thin w-full resize-y rounded-2xl bg-surface-2 px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-muted"
            required
          />
        </Field>

        <Field label="bu sorular da buraya gelsin" htmlFor={`v-${uid}`} hint="Enter ile ekleyin. Ne kadar çok, bot o kadar iyi yakalar.">
          <ChipsInput id={`v-${uid}`} value={form.variants} onChange={(v) => set("variants", v)} placeholder="kargo bedava mı, kargo parası…" />
        </Field>

        <Field label="anahtar kelimeler" htmlFor={`k-${uid}`} hint="Tek başına bile bu soruyu işaret eden kelimeler">
          <ChipsInput id={`k-${uid}`} value={form.keywords} onChange={(v) => set("keywords", v)} placeholder="kargo, ücretsiz kargo…" />
        </Field>

        <Field label="cevabın altında önerilecek sorular" hint="En fazla 2; müşteriye buton olarak çıkar">
          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <select
                key={i}
                aria-label={`${i + 1}. önerilen soru`}
                value={form.related[i] ?? ""}
                onChange={(e) => {
                  const next = [...form.related];
                  next[i] = e.target.value;
                  set("related", next.filter((x, j) => x || j < i));
                }}
                className="h-12 w-full appearance-none rounded-2xl bg-surface-2 px-4 text-[14.5px] text-ink outline-none"
              >
                <option value="">— yok —</option>
                {others.map((o) => (
                  <option key={o.id} value={o.id} disabled={form.related.includes(o.id) && form.related[i] !== o.id}>
                    {o.short}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </Field>
      </div>

      <div className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
        <p className="text-[13px] text-muted">müşterinin göreceği</p>
        <div className="chat-wall rounded-[24px] p-4">
          <div className="max-w-[92%] rounded-[20px] rounded-bl-md bg-bubble-in px-3.5 py-2.5 text-[14.5px] leading-[1.45] shadow-sm">
            {form.answer.trim() ? <WaText text={form.answer} /> : <span className="text-muted">Cevap yazdıkça burada görünür.</span>}
          </div>
          {form.related.filter(Boolean).map((r) => (
            <div key={r} className="mt-1 max-w-[92%] rounded-2xl bg-bubble-in py-2 text-center text-[13.5px] font-medium text-link shadow-sm">
              {kb.faq.find((f) => f.id === r)?.short.slice(0, 20)}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="h-12 flex-1 rounded-full bg-ink px-6 text-[15px] font-medium text-bg transition-opacity disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : submitLabel}
          </motion.button>
          <button type="button" onClick={onCancel} className="h-12 rounded-full px-5 text-[15px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
            Vazgeç
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  counter,
  over,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  counter?: string;
  over?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="text-[13.5px] text-ink-2">
          {label}
        </label>
        {counter && <span className={`text-[12px] tabular-nums ${over ? "text-danger" : "text-muted"}`}>{counter}</span>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[12.5px] text-muted">{hint}</p>}
    </div>
  );
}
