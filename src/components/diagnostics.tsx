"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { ease } from "@/components/motion-provider";

type Check = { ok: boolean; detail: string; phone?: string };
type Event = { at: string; kind: "in" | "out" | "error" | "info"; text: string };
type Diag = { whatsapp: Check; redis: Check; events: Event[]; subscription: (Check & { apps: string[] }) | null; waba: string; checkedAt: string };

/** Meta'da test numarasının bağlı olduğu WhatsApp hesabı (WhatsApp → API Setup'ta "Messaging account ID") */
const DEFAULT_WABA = "1958880235479651";

const DOT: Record<Event["kind"], string> = { in: "bg-ai-dot", out: "bg-faq-dot", error: "bg-danger-dot", info: "bg-warn-dot" };
const LABEL: Record<Event["kind"], string> = { in: "gelen", out: "giden", error: "hata", info: "bilgi" };

const time = (iso: string) =>
  new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "numeric", month: "short", timeZone: "Europe/Istanbul" }).format(new Date(iso));

/** Canlı tanılama: Meta anahtarı ve Redis gerçekten çalışıyor mu, son mesajlarda ne oldu */
export function Diagnostics() {
  const [data, setData] = useState<Diag | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waba, setWaba] = useState(DEFAULT_WABA);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/diagnostics?waba=${encodeURIComponent(waba)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
    } catch {
      setError("Kontrol yapılamadı. Sayfayı yenileyip tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [waba]);

  async function subscribe() {
    setSubscribing(true);
    setSubscribeMsg(null);
    const res = await fetch("/api/diagnostics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ waba }) }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { ok?: boolean; detail?: string } | null;
    setSubscribing(false);
    setSubscribeMsg(data?.ok ? "Abone edildi. Şimdi telefondan tekrar yazıp yenile'ye basın." : `Abone edilemedi: ${data?.detail ?? "bağlantı hatası"}`);
    void load();
  }

  // İlk açılışta bir kez kontrol et (durum yalnızca istek bitince güncellenir)
  useEffect(() => {
    let alive = true;
    fetch(`/api/diagnostics?waba=${DEFAULT_WABA}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Diag) => alive && setData(d))
      .catch(() => alive && setError("Kontrol yapılamadı. Sayfayı yenileyip tekrar deneyin."));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mb-14 rounded-[26px] bg-surface p-5 shadow-sm ring-1 ring-line sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[26px] leading-tight">canlı kontrol</h2>
          <p className="mt-1 text-[14.5px] text-ink-2">Bot telefondan yazınca cevap vermiyorsa sebebi burada görünür.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={load}
          disabled={loading}
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 text-[14px] transition-colors hover:text-ink disabled:opacity-60"
        >
          <motion.span animate={{ rotate: loading ? 360 : 0 }} transition={loading ? { repeat: Infinity, duration: 0.9, ease: "linear" } : { duration: 0 }}>
            <RefreshCw className="size-4" aria-hidden />
          </motion.span>
          yenile
        </motion.button>
      </div>

      {error && <p className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger">{error}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <CheckRow title="Meta erişim anahtarı" check={data?.whatsapp} extra={data?.whatsapp.phone ? `Numara: ${data.whatsapp.phone}` : undefined} />
        <CheckRow title="Redis (kalıcı depo)" check={data?.redis} />
      </div>

      <div className="mt-3 rounded-2xl bg-surface-2 px-4 py-3.5">
        <div className="flex items-center gap-2 text-[14px]">
          <span
            className={`size-2 rounded-full ${!data?.subscription ? "bg-line-strong" : data.subscription.ok ? "bg-faq-dot" : "bg-danger-dot"}`}
            aria-hidden
          />
          <span className="text-ink">WhatsApp hesabı → uygulama aboneliği</span>
          <span className="ml-auto text-[13px] text-muted">{!data?.subscription ? "…" : data.subscription.ok ? "abone" : "abone değil"}</span>
        </div>
        {data?.subscription && (
          <p className={`mt-1.5 break-words text-[13px] leading-snug ${data.subscription.ok ? "text-muted" : "text-danger"}`}>{data.subscription.detail}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="waba" className="text-[13px] text-muted">
            WhatsApp hesap ID
          </label>
          <input
            id="waba"
            value={waba}
            onChange={(e) => setWaba(e.target.value.replace(/D/g, ""))}
            inputMode="numeric"
            className="h-9 w-48 rounded-xl bg-surface px-3 text-[13.5px] tabular-nums outline-none ring-1 ring-line"
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={subscribe}
            disabled={subscribing || !waba}
            className="h-9 rounded-full bg-ink px-4 text-[13.5px] font-medium text-bg disabled:opacity-50"
          >
            {subscribing ? "Abone ediliyor…" : "Uygulamaya abone et"}
          </motion.button>
        </div>
        {subscribeMsg && <p className="mt-2 text-[13px] text-ink-2">{subscribeMsg}</p>}
      </div>

      <h3 className="mt-8 text-[14px] text-muted">son WhatsApp olayları</h3>
      {data && data.events.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-4 text-[14.5px] leading-relaxed text-ink-2">
          Henüz hiçbir olay gelmedi. Telefondan mesaj attığınız halde burası boş kalıyorsa mesaj Meta&apos;dan siteye hiç ulaşmıyor demektir:
          webhook adresini, <b className="font-medium text-ink">messages</b> aboneliğini ve uygulamanın yayında (Published) olduğunu kontrol edin.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          <AnimatePresence initial={false}>
            {(data?.events ?? []).map((e) => (
              <motion.li
                key={e.at + e.text}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease }}
                className="flex items-start gap-3 border-b border-line py-2.5 text-[14px] last:border-0"
              >
                <span className={`mt-[7px] size-2 shrink-0 rounded-full ${DOT[e.kind]}`} aria-label={LABEL[e.kind]} />
                <span className="min-w-0 flex-1 break-words text-ink-2">{e.text}</span>
                <span className="shrink-0 text-[12.5px] tabular-nums text-muted">{time(e.at)}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function CheckRow({ title, check, extra }: { title: string; check?: Check; extra?: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-3.5">
      <div className="flex items-center gap-2 text-[14px]">
        <span className={`size-2 rounded-full ${!check ? "bg-line-strong" : check.ok ? "bg-faq-dot" : "bg-danger-dot"}`} aria-hidden />
        <span className="text-ink">{title}</span>
        <span className="ml-auto text-[13px] text-muted">{!check ? "…" : check.ok ? "çalışıyor" : "sorun var"}</span>
      </div>
      {check && <p className={`mt-1.5 break-words text-[13px] leading-snug ${check.ok ? "text-muted" : "text-danger"}`}>{check.detail}</p>}
      {extra && <p className="mt-0.5 text-[13px] text-muted">{extra}</p>}
    </div>
  );
}
