"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { normalizePhone } from "@/lib/phone";
import { ease } from "@/components/motion-provider";
import { Collapse } from "@/components/ui/collapse";

type Status = {
  webhookUrl: string;
  env: Record<string, boolean>;
  ai: { available: boolean; model: string; provider: string };
  hours: { open: boolean; next: string; now: string };
};

const WA_KEYS = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"];

export function Setup() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s: Status) => {
        setStatus(s);
        const done = stepsDone(s);
        setOpen(done.findIndex((d) => !d) === -1 ? null : done.findIndex((d) => !d));
      })
      .catch(() => setError(true));
  }, []);

  const env = status?.env ?? {};
  const done = status ? stepsDone(status) : [false, false, false, false];
  const doneCount = done.filter(Boolean).length;

  const steps = [
    { title: "Meta'da WhatsApp uygulaması oluşturun", body: <StepMeta /> },
    { title: "Anahtarları Vercel'e ekleyin", body: <StepEnv env={env} /> },
    { title: "Webhook'u bağlayın", body: <StepWebhook url={status?.webhookUrl} /> },
    { title: "Kendi numaranızla deneyin", body: <StepTry /> },
  ];

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <div className="flex items-baseline justify-between text-[14px]">
          <span className="text-ink-2">{status ? `${doneCount} / 4 adım tamam` : "kontrol ediliyor…"}</span>
          {error && <span className="text-danger">Durum alınamadı, sayfayı yenileyin.</span>}
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden>
          <motion.div className="h-full rounded-full bg-faq-dot" initial={{ width: 0 }} animate={{ width: `${(doneCount / 4) * 100}%` }} transition={{ duration: 0.8, ease }} />
        </div>

        <ol className="mt-8 border-t border-line">
          {steps.map((s, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="border-b border-line">
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center gap-5 py-5 text-left">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-[14px] transition-colors duration-300 ${
                      done[i] ? "bg-faq-dot text-white" : "bg-surface-2 text-ink-2"
                    }`}
                  >
                    {done[i] ? <Check className="size-4" strokeWidth={2.5} aria-label="tamamlandı" /> : i + 1}
                  </span>
                  <span className={`flex-1 text-[18px] ${done[i] ? "text-ink-2" : "text-ink"}`}>{s.title}</span>
                </button>
                <Collapse open={isOpen}>
                  <div className="flex flex-col gap-4 pb-7 pl-14 text-[15px] leading-relaxed text-ink-2 [&_b]:font-medium [&_b]:text-ink">{s.body}</div>
                </Collapse>
              </li>
            );
          })}
        </ol>
      </div>

      <aside className="flex flex-col gap-10 lg:pt-10">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] text-muted">
            <span className={`size-2 rounded-full ${status?.ai.available ? "bg-ai-dot" : "bg-line-strong"}`} aria-hidden />
            yapay zekâ
          </h3>
          {status ? (
            status.ai.available ? (
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                Açık — <b className="font-medium text-ink">{status.ai.provider}</b>
                <span className="mt-1 block break-all text-[13px] text-muted">{status.ai.model}</span>
              </p>
            ) : (
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                Kapalı; bot yalnızca hazır cevaplarla çalışıyor. <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[12.5px]">NVIDIA_API_KEY</code>{" "}
                ekleyince açılır.
              </p>
            )
          ) : null}
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-[14px] text-muted">
            <span className={`size-2 rounded-full ${status?.hours.open ? "bg-faq-dot" : "bg-warn-dot"}`} aria-hidden />
            canlı destek
          </h3>
          {status && (
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              {status.hours.open ? "Şu an mesai içinde." : `Şu an mesai dışı. Açılış: ${status.hours.next}.`}
              <span className="mt-1 block text-[13px] text-muted">{status.hours.now}</span>
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function stepsDone(s: Status): boolean[] {
  const wa = WA_KEYS.every((k) => s.env[k]);
  return [wa, wa && s.env.ADMIN_PASSWORD, false, s.env.ALLOWED_NUMBERS];
}

function StepMeta() {
  return (
    <>
      <p>
        <A href="https://developers.facebook.com/apps">developers.facebook.com/apps</A> adresinde <b>Create App → Business</b> seçin ve uygulamaya{" "}
        <b>WhatsApp</b> ürününü ekleyin. Meta başlangıç için ücretsiz bir test numarası verir.
      </p>
      <p>
        <b>WhatsApp → API Setup</b> sayfasından <b>Phone number ID</b> ve <b>Access token</b>, <b>App settings → Basic</b> sayfasından{" "}
        <b>App secret</b> değerini alın.
      </p>
      <p className="text-[14px] text-muted">Geçici token 24 saatte biter. Kalıcı çalışma için Meta Business Suite&apos;te bir System User oluşturup kalıcı token alın.</p>
    </>
  );
}

function StepEnv({ env }: { env: Record<string, boolean> }) {
  const rows: [string, string, boolean?][] = [
    ["WHATSAPP_ACCESS_TOKEN", "Meta erişim anahtarı"],
    ["WHATSAPP_PHONE_NUMBER_ID", "botun numara kimliği"],
    ["WHATSAPP_APP_SECRET", "gelen mesajların imza doğrulaması"],
    ["WHATSAPP_VERIFY_TOKEN", "kendi uydurduğunuz gizli kelime"],
    ["ADMIN_PASSWORD", "bu panelin şifresi"],
    ["NVIDIA_API_KEY", "yapay zekâ", true],
    ["ALLOWED_NUMBERS", "bota yazabilecek numaralar", true],
    ["OWNER_NUMBER", "yetkili bildirimlerinin gideceği numara", true],
    ["REDIS_URL", "kalıcı sohbet hafızası", true],
    ["ZUULAB_SITE_URL", "zuulab.com adresi (sipariş onayı)", true],
    ["WHATSAPP_BRIDGE_SECRET", "zuulab.com ile ortak gizli anahtar", true],
  ];
  return (
    <>
      <p>
        Vercel&apos;de <b>Settings → Environment Variables</b> altına ekleyip yeniden deploy edin. Değerler burada asla gösterilmez, yalnızca var olup
        olmadıkları.
      </p>
      <ul className="flex flex-col">
        {rows.map(([k, desc, optional]) => {
          const ok = env[k];
          return (
            <li key={k} className="flex items-center gap-3 py-1.5">
              <span
                className={`size-2 shrink-0 rounded-full ${ok ? "bg-faq-dot" : optional ? "bg-line-strong" : "bg-warn-dot"}`}
                aria-label={ok ? "tanımlı" : optional ? "isteğe bağlı" : "eksik"}
              />
              <code className="text-[13px] text-ink">{k}</code>
              <span className="truncate text-[13.5px] text-muted">{desc}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function StepWebhook({ url }: { url?: string }) {
  return (
    <>
      <p>
        Meta&apos;da <b>WhatsApp → Configuration → Webhook</b> bölümüne şu adresi girin, verify token olarak <b>WHATSAPP_VERIFY_TOKEN</b> değerini yazın ve{" "}
        <b>messages</b> alanına abone olun.
      </p>
      <CopyField value={url ?? "…"} />
      <p className="text-[14px] text-muted">Adres, Vercel&apos;deki canlı siteniz olmalı; Meta localhost&apos;a ulaşamaz.</p>
    </>
  );
}

function StepTry() {
  const [phone, setPhone] = useState("");
  const normalized = normalizePhone(phone);
  return (
    <>
      <p>
        Test numarası yalnızca Meta&apos;da eklediğiniz alıcılara yazabilir. <b>API Setup → To</b> alanına numaranızı ekleyin, sonra bota WhatsApp&apos;tan{" "}
        <i>merhaba</i> yazın.
      </p>
      <div>
        <label htmlFor="phone" className="text-[13.5px] text-muted">
          numaranız
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="0533 425 14 95"
          className="mt-1.5 h-12 w-full max-w-xs rounded-2xl bg-surface-2 px-4 text-[15px] text-ink outline-none"
        />
      </div>
      <AnimatePresence>
        {normalized && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="mb-1.5 text-[13.5px] text-muted">ALLOWED_NUMBERS ve OWNER_NUMBER için</p>
            <CopyField value={normalized} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex max-w-xl items-center gap-2 rounded-2xl bg-surface-2 py-1.5 pl-4 pr-1.5">
      <code className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{value}</code>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="relative flex h-9 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface text-[13.5px] font-medium shadow-sm"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "y" : "n"}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            className={`flex items-center gap-1.5 ${copied ? "text-faq" : "text-ink"}`}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "kopyalandı" : "kopyala"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-link underline-offset-4 hover:underline">
      {children}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}
