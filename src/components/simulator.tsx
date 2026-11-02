"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUp, List, RotateCcw, Sparkles, X } from "lucide-react";
import { company } from "@/data/company";
import type { BotReply, Incoming, ReplyButton, ReplyList, Trace } from "@/lib/engine";
import { THRESHOLD } from "@/lib/match";
import { RouteBadge, RouteDot, ROUTE_META } from "@/components/route-badge";
import { WaText } from "@/components/wa-text";
import { ease, softSpring, spring } from "@/components/motion-provider";
import { PageHeader } from "@/components/shell";
import { BARE_FIELD } from "@/components/ui/field";

type ChatTurn = { role: "user" | "assistant"; content: string };

type BotMsg =
  | { id: string; from: "bot"; text: string; buttons?: ReplyButton[]; at: number; turn: number; last: boolean }
  | { id: string; from: "bot"; list: ReplyList; at: number; turn: number; last: boolean };
type Msg = { id: string; from: "user"; text: string; at: number } | BotMsg;
type Turn = { id: number; trace: Trace };

/** zuulab müşterilerinin gerçekten sorduğu türden sorular */
const SAMPLES = [
  "Kargom nerede?",
  "Kapıda ödeme var mı?",
  "Lambalarınız ne kadar?",
  "Kendi tasarımımı bastırabilir miyim?",
  "Ürünü iade etmek istiyorum",
  "Çocuğum 2 yaşında, zuukids uygun mu?",
];

const time = (t: number) => new Date(t).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
let seq = 0;
const uid = () => `m${++seq}`;

export function Simulator() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [awaiting, setAwaiting] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [forceAi, setForceAi] = useState(false);
  const [sheet, setSheet] = useState<ReplyList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function send(payload: Incoming, shown: string) {
    if (pending) return;
    setError(null);
    setSheet(null);
    setMessages((m) => [...m, { id: uid(), from: "user", text: shown, at: Date.now() }]);
    setPending(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: payload, history, forceAi, awaiting }),
      });
      if (res.status === 401) return router.replace("/giris");
      if (!res.ok) throw new Error(`Sunucu ${res.status} hatası verdi. Birkaç saniye sonra tekrar deneyin.`);
      const reply = (await res.json()) as BotReply;
      setAwaiting(reply.awaiting ?? null);
      const turnId = turns.length + 1;
      setTurns((t) => [...t, { id: turnId, trace: reply.trace }]);
      setMessages((m) => [
        ...m,
        ...reply.messages.map((r, i): Msg => {
          const last = i === reply.messages.length - 1;
          return "list" in r
            ? { id: uid(), from: "bot", list: r.list, at: Date.now(), turn: turnId, last }
            : { id: uid(), from: "bot", text: r.text, buttons: r.buttons, at: Date.now(), turn: turnId, last };
        }),
      ]);
      const botText = reply.messages.map((r) => ("list" in r ? r.list.body : r.text)).join("\n\n");
      setHistory((h) => (reply.resetHistory ? [] : [...h, { role: "user" as const, content: shown }, { role: "assistant" as const, content: botText }].slice(-12)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mesaj gönderilemedi.");
    } finally {
      setPending(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void send({ kind: "text", text }, text);
  }

  function reset() {
    setMessages([]);
    setTurns([]);
    setHistory([]);
    setAwaiting(null);
    setSelected(null);
    setSheet(null);
    setError(null);
    input.current?.focus();
  }

  const selectedTurn = turns.find((t) => t.id === selected) ?? null;
  const aiFree = turns.filter((t) => t.trace.route !== "ai").length;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-12">
      <div className="lg:col-start-1 lg:row-start-1">
        <PageHeader title="asistanınızı deneyin." description="Müşterinizin WhatsApp'ta yaşayacağı sohbetin aynısı, burada güvenle." />
      </div>

      {/* Anlatım sütunu */}
      <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-2">
        <AnimatePresence mode="wait" initial={false}>
          {selectedTurn ? (
            <motion.div
              key={`trace-${selectedTurn.id}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3, ease }}
            >
              <TraceView turn={selectedTurn} onClose={() => setSelected(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.3, ease }}
            >
              <p className="text-[13px] text-muted">bir soru seçin ya da telefona yazın</p>
              <ul className="mt-3 flex flex-col">
                {SAMPLES.map((s, i) => (
                  <motion.li
                    key={s}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35, ease }}
                  >
                    <button
                      onClick={() => send({ kind: "text", text: s }, s)}
                      disabled={pending}
                      className="group flex w-full items-center justify-between gap-4 border-b border-line py-3.5 text-left text-[17px] text-ink-2 transition-colors hover:text-ink disabled:opacity-50"
                    >
                      {s}
                      <ArrowUp className="size-4 shrink-0 rotate-45 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                    </button>
                  </motion.li>
                ))}
              </ul>
              <dl className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-ink-2">
                {(["faq", "ai", "suggest"] as const).map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <RouteDot route={r} />
                    <dt>{ROUTE_META[r].label}</dt>
                    <dd className="sr-only">{ROUTE_META[r].hint}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-muted">
                Bot önce hazır cevaplara bakar; güçlü bir eşleşme yoksa AI&apos;ye sorar. Bir cevaba dokunursanız neden öyle cevap verdiğini görürsünüz.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {turns.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex items-center gap-3 text-[13.5px] text-muted"
            >
              <span>
                {turns.length} cevabın {aiFree} tanesi AI kullanmadan verildi
              </span>
              <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
                <RotateCcw className="size-3.5" aria-hidden /> baştan başla
              </button>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Telefon */}
      <section
        aria-label="WhatsApp önizlemesi"
        className="relative order-2 mx-auto flex h-[min(760px,calc(100dvh-180px))] min-h-[540px] w-full max-w-[400px] flex-col overflow-hidden rounded-[40px] border-[6px] border-surface bg-surface shadow-xl ring-1 ring-line lg:sticky lg:top-8 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[min(800px,calc(100dvh-64px))]"
      >
        <header className="flex items-center gap-3 bg-surface px-4 pb-3 pt-4">
          <span className="grid size-10 place-items-center rounded-full bg-ink font-display text-[19px] leading-none text-bg" aria-hidden>
            z
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[15.5px] font-semibold">{company.shortName}</div>
            <div className="relative h-4 overflow-hidden text-[12.5px] text-muted">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={pending ? "typing" : "idle"}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  className={`block ${pending ? "text-faq" : ""}`}
                >
                  {pending ? "yazıyor…" : "işletme hesabı"}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          <button
            onClick={reset}
            className="rounded-full p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Sohbeti sıfırla"
            title="Sohbeti sıfırla"
          >
            <RotateCcw className="size-[18px]" strokeWidth={1.8} />
          </button>
        </header>

        <div ref={scroller} className="chat-wall scroll-thin flex-1 overflow-y-auto rounded-t-[26px] px-3 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-end justify-center pb-4">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease }}
                className="max-w-[250px] rounded-2xl bg-surface/80 px-4 py-2.5 text-center text-[12.5px] leading-snug text-muted shadow-sm backdrop-blur"
              >
                Müşterinizin WhatsApp&apos;ta göreceği sohbetin aynısı. Gerçek motor çalışır, kimseye mesaj gitmez.
              </motion.p>
            </div>
          ) : (
            <ol className="flex flex-col gap-1.5" aria-live="polite">
              {messages.map((m) => (
                <motion.li
                  key={m.id}
                  layout="position"
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={spring}
                  style={{ originX: m.from === "user" ? 1 : 0, originY: 1 }}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.from === "user" ? (
                    <div className="max-w-[82%] rounded-[20px] rounded-br-md bg-bubble-out px-3.5 pb-1.5 pt-2 text-[14.5px] leading-[1.45] shadow-sm">
                      <div className="whitespace-pre-wrap break-words">
                        <WaText text={m.text} />
                      </div>
                      <div className="mt-0.5 text-right text-[10.5px] text-muted">{time(m.at)}</div>
                    </div>
                  ) : (
                    <BotBubble
                      msg={m}
                      route={turns.find((t) => t.id === m.turn)?.trace.route}
                      active={m.turn === selected}
                      onSelect={() => setSelected(m.turn === selected ? null : m.turn)}
                      onButton={(b) => send({ kind: "action", id: b.id, title: b.title }, b.title)}
                      onOpenList={(l) => setSheet(l)}
                    />
                  )}
                </motion.li>
              ))}
              <AnimatePresence>
                {pending && (
                  <motion.li
                    key="typing"
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    style={{ originX: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-1 rounded-[20px] rounded-bl-md bg-bubble-in px-4 py-3.5 shadow-sm" aria-label="Yazıyor">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="size-1.5 rounded-full bg-muted"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </motion.li>
                )}
              </AnimatePresence>
            </ol>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              role="alert"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-danger-soft text-[13px] text-danger"
            >
              <p className="px-4 py-2">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={submit} className="flex items-center gap-2 bg-surface px-3 py-3">
          <div className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-surface-2 pl-1.5 pr-4 ring-1 ring-transparent transition-[box-shadow,background-color] duration-200 has-[input:focus]:bg-surface has-[input:focus]:shadow-[var(--ring)]!">
            <motion.button
              type="button"
              onClick={() => setForceAi((v) => !v)}
              whileTap={{ scale: 0.92 }}
              aria-pressed={forceAi}
              title="Açıkken her soru doğrudan AI'ye gider (WhatsApp'ta mesajın başına #ai yazmakla aynı)"
              className={`mr-2 flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium transition-colors duration-200 ${
                forceAi ? "bg-ai-dot text-white" : "text-muted hover:bg-surface-3 hover:text-ink"
              }`}
            >
              <Sparkles className="size-3.5" aria-hidden />
              AI
              <span className="sr-only">{forceAi ? "her soruyu AI'ye sor: açık" : "her soruyu AI'ye sor: kapalı"}</span>
            </motion.button>
            <label htmlFor="sim-input" className="sr-only">
              Mesaj
            </label>
            <input
              ref={input}
              id="sim-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={forceAi ? "AI'ye sorun" : awaiting === "order_number" ? "Sipariş numarası, ör. ZUU-20260142" : "Mesaj"}
              autoComplete="off"
              className={`${BARE_FIELD} h-full min-w-0 flex-1 text-[15px] placeholder:text-muted`}
            />
          </div>
          <motion.button
            type="submit"
            disabled={!draft.trim() || pending}
            animate={{ scale: draft.trim() ? 1 : 0.88, opacity: draft.trim() ? 1 : 0.35 }}
            whileTap={{ scale: 0.9 }}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-bg"
            aria-label="Gönder"
          >
            <ArrowUp className="size-5" strokeWidth={2.2} />
          </motion.button>
        </form>

        <AnimatePresence>
          {sheet && (
            <ListSheet list={sheet} onClose={() => setSheet(null)} onPick={(r) => send({ kind: "action", id: r.id, title: r.title }, r.title)} />
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function BotBubble({
  msg,
  route,
  active,
  onSelect,
  onButton,
  onOpenList,
}: {
  msg: BotMsg;
  route?: Trace["route"];
  active: boolean;
  onSelect: () => void;
  onButton: (b: ReplyButton) => void;
  onOpenList: (l: ReplyList) => void;
}) {
  const buttons = "list" in msg ? [] : (msg.buttons ?? []);
  return (
    <div className="flex max-w-[86%] flex-col gap-1">
      <motion.button
        type="button"
        onClick={onSelect}
        whileTap={{ scale: 0.985 }}
        animate={{ boxShadow: active ? "0 0 0 1.5px var(--ai-dot)" : "0 0 0 0px transparent" }}
        transition={softSpring}
        className="rounded-[20px] rounded-bl-md bg-bubble-in px-3.5 pb-1.5 pt-2 text-left text-[14.5px] leading-[1.45] shadow-sm"
        aria-label="Bu cevabın nasıl üretildiğini göster"
        aria-pressed={active}
      >
        <div className="whitespace-pre-wrap break-words">
          <WaText text={"list" in msg ? msg.list.body : msg.text} />
        </div>
        <div className="mt-0.5 text-right text-[10.5px] text-muted">{time(msg.at)}</div>
      </motion.button>

      {"list" in msg && (
        <ChoiceButton onClick={() => onOpenList(msg.list)}>
          <List className="size-4" aria-hidden /> {msg.list.button}
        </ChoiceButton>
      )}
      {buttons.map((b) => (
        <ChoiceButton key={b.id} onClick={() => onButton(b)}>
          {b.title}
        </ChoiceButton>
      ))}

      {msg.last && route && (
        <button onClick={onSelect} className="ml-1 mt-0.5 flex items-center gap-1.5 self-start rounded-full py-0.5 text-[11.5px] text-muted transition-colors hover:text-ink">
          <RouteDot route={route} className="size-1.5" />
          {ROUTE_META[route].label}
        </button>
      )}
    </div>
  );
}

function ChoiceButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex items-center justify-center gap-2 rounded-2xl bg-bubble-in py-2.5 text-[14px] font-medium text-link shadow-sm transition-colors hover:bg-surface-2"
    >
      {children}
    </motion.button>
  );
}

function ListSheet({ list, onClose, onPick }: { list: ReplyList; onClose: () => void; onPick: (r: { id: string; title: string }) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button[data-row]")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col justify-end"
      initial={{ backgroundColor: "rgba(17,17,16,0)" }}
      animate={{ backgroundColor: "rgba(17,17,16,0.32)" }}
      exit={{ backgroundColor: "rgba(17,17,16,0)" }}
      onClick={onClose}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={list.button}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="max-h-[78%] overflow-y-auto rounded-t-[28px] bg-surface pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface px-5 pb-2 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-line-strong" aria-hidden />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[16px] font-semibold">{list.button}</span>
            <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Kapat">
              <X className="size-5" />
            </button>
          </div>
        </div>
        {list.sections.map((s) => (
          <ul key={s.title} className="px-2">
            {s.rows.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i + 0.05, duration: 0.3, ease }}>
                <button
                  data-row
                  onClick={() => onPick(r)}
                  className="flex w-full flex-col items-start rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="text-[15px]">{r.title}</span>
                  {r.description && <span className="text-[13px] leading-snug text-muted">{r.description}</span>}
                </button>
              </motion.li>
            ))}
          </ul>
        ))}
      </motion.div>
    </motion.div>
  );
}

function TraceView({ turn, onClose }: { turn: Turn; onClose: () => void }) {
  const t = turn.trace;
  return (
    <article>
      <button onClick={onClose} className="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[13.5px] text-muted transition-colors hover:bg-surface-2 hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden /> örnek sorular
      </button>

      <div className="mt-6 flex items-center gap-3">
        <RouteBadge route={t.route} />
        <span className="text-[13px] tabular-nums text-muted">{t.ms} ms</span>
      </div>

      <h2 className="mt-4 font-display text-[30px] leading-[1.15] tracking-[-0.01em]">“{t.input}”</h2>
      <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-ink-2">{explain(t)}</p>

      {t.candidates && t.candidates.length > 0 && (
        <div className="mt-8 max-w-lg">
          <div className="flex items-baseline justify-between text-[13px] text-muted">
            <span>en yakın hazır cevaplar</span>
            <span>eşik %{Math.round(THRESHOLD.direct * 100)}</span>
          </div>
          <ul className="mt-3 flex flex-col gap-4">
            {t.candidates.map((c, i) => {
              const pct = Math.round(c.score * 100);
              const strong = c.score >= THRESHOLD.direct;
              return (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-4 text-[14.5px]">
                    <span className={`truncate ${c.id === t.matchedId ? "font-medium text-ink" : "text-ink-2"}`}>{c.question}</span>
                    <span className={`shrink-0 tabular-nums ${strong ? "text-faq" : "text-muted"}`}>%{pct}</span>
                  </div>
                  <div className="relative mt-2 h-1 rounded-full bg-surface-3" aria-hidden>
                    <motion.div
                      className={`h-full rounded-full ${strong ? "bg-faq-dot" : "bg-line-strong"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, pct)}%` }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.7, ease }}
                    />
                    <div className="absolute -top-1 h-3 w-px bg-ink/30" style={{ left: `${THRESHOLD.direct * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(t.model || t.note || t.tokens) && (
        <dl className="mt-8 grid max-w-lg gap-4 border-t border-line pt-5 text-[13.5px] sm:grid-cols-2">
          {t.model && (
            <div>
              <dt className="text-muted">model</dt>
              <dd className="mt-1 break-all text-ink-2">{t.model}</dd>
            </div>
          )}
          {t.tokens && (t.tokens.input || t.tokens.output) ? (
            <div>
              <dt className="text-muted">token</dt>
              <dd className="mt-1 tabular-nums text-ink-2">
                {t.tokens.input ?? "?"} giriş · {t.tokens.output ?? "?"} çıkış
              </dd>
            </div>
          ) : null}
          {t.note && (
            <div className="sm:col-span-2">
              <dt className="text-muted">not</dt>
              <dd className="mt-1 text-ink-2">{t.note}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

function explain(t: Trace): string {
  const best = t.candidates?.[0];
  const pct = (n?: number) => `%${Math.round((n ?? 0) * 100)}`;
  switch (t.route) {
    case "faq":
      return t.candidates
        ? `“${best?.question}” sorusuyla ${pct(best?.score)} eşleşti. Hazır cevap gönderildi, AI hiç çalışmadı.`
        : "Menüden seçilen sorunun hazır cevabı gönderildi.";
    case "ai":
      return best && best.score >= THRESHOLD.suggest
        ? `Hazır cevaplar yeterince yakın değildi (en iyisi ${pct(best.score)}). Soru firma bilgisiyle AI'ye soruldu; yakın sorular buton olarak eklendi.`
        : "Hazır cevaplarda karşılığı yoktu. Soru firma bilgisiyle AI'ye soruldu.";
    case "suggest":
      return "Kesin bir eşleşme yoktu ve AI kullanılamadı. Müşteriye en yakın sorular seçenek olarak sunuldu.";
    case "fallback":
      return "Ne hazır cevaplarda ne de AI'de karşılık bulundu. Müşteriye menü ve yetkili seçeneği sunuldu.";
    case "handoff":
      return "Müşteri bir yetkiliyle görüşmek istedi. OWNER_NUMBER tanımlıysa talep size WhatsApp'tan bildirilir.";
    case "intent":
      return `“${t.intent}” kalıbı tanındı; hazır karşılama akışı çalıştı.`;
    case "menu":
      return "Menü gösterildi; müşteri listeden seçerek ilerleyebilir.";
    case "command":
      return "Özel bir komut çalıştı.";
    case "order":
      return "Sipariş/kargo sorusu tanındı; bilgi zuulab.com'dan canlı çekildi. Simülatörde telefon eşleşmesi aranmaz, WhatsApp'ta müşteri yalnızca kendi siparişini görebilir.";
  }
}
