"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import type { TemplateDef } from "@/data/templates";
import { WaText } from "@/components/wa-text";
import { ease } from "@/components/motion-provider";

/* ───────────── Akış ───────────── */

const STEPS = [
  { day: "0. gün", title: "Onay mesajı gider", body: "Sipariş gelince müşteriye “Onaylıyorum / İptal etmek istiyorum” butonlu mesaj.", dot: "bg-faq-dot" },
  { day: "", title: "Müşteri onaylar", body: "“Teşekkür ederiz. Onayınız alınmıştır…” cevabı gider, panelde “Müşteri onayladı” görünür.", dot: "bg-faq-dot" },
  { day: "2. gün", title: "Hatırlatma", body: "Cevap gelmediyse bir kez hatırlatılır; 7 gün sınırı da belirtilir.", dot: "bg-warn-dot" },
  { day: "7. gün", title: "Otomatik iptal", body: "Hâlâ onay yoksa sipariş iptal edilir, stok rafa döner, müşteriye iptal mesajı gider.", dot: "bg-danger-dot" },
];

export function FlowTimeline() {
  return (
    <ol className="relative grid gap-8 sm:grid-cols-4 sm:gap-6">
      <div className="absolute left-[5px] top-2 h-[calc(100%-16px)] w-px bg-line sm:left-0 sm:top-[5px] sm:h-px sm:w-full" aria-hidden />
      {STEPS.map((s, i) => (
        <motion.li
          key={s.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * i, duration: 0.45, ease }}
          className="relative pl-7 sm:pl-0 sm:pt-7"
        >
          <span className={`absolute left-0 top-1.5 size-[11px] rounded-full ring-4 ring-bg sm:top-0 ${s.dot}`} aria-hidden />
          <p className="text-[12.5px] text-muted">{s.day || " "}</p>
          <h3 className="mt-0.5 text-[16px] font-medium">{s.title}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{s.body}</p>
        </motion.li>
      ))}
    </ol>
  );
}

/* ───────────── Şablonlar ───────────── */

export function TemplateCard({ t, index }: { t: TemplateDef; index: number }) {
  const preview = t.body.replaceAll("{{1}}", t.example);
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: 0.06 * index, duration: 0.5, ease }}
      className="grid gap-8 border-t border-line py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[13px] text-muted">{t.when}</p>
          <h3 className="mt-1 break-all font-mono text-[15px] text-ink">{t.name}</h3>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-[14px]">
          <div>
            <dt className="text-[12.5px] text-muted">kategori</dt>
            <dd className="mt-0.5">Utility (hizmet)</dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-muted">dil</dt>
            <dd className="mt-0.5">Turkish (tr)</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[12.5px] text-muted">değişken</dt>
            <dd className="mt-0.5">
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[12.5px]">{"{{1}}"}</code> sipariş numarası · örnek: {t.example}
            </dd>
          </div>
          {t.buttons.length > 0 && (
            <div className="col-span-2">
              <dt className="text-[12.5px] text-muted">butonlar (Quick reply)</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {t.buttons.map((b) => (
                  <span key={b.text} className="rounded-full bg-surface-2 px-3 py-1 text-[13px]">
                    {b.text}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={t.name} label="adı kopyala" />
          <CopyButton value={t.body} label="metni kopyala" />
        </div>
      </div>

      <div className="chat-wall rounded-[28px] p-5 sm:p-6">
        <div className="max-w-[340px]">
          <div className="rounded-[20px] rounded-bl-md bg-bubble-in px-4 pb-2 pt-3 text-[14px] leading-[1.5] shadow-sm">
            <div className="whitespace-pre-wrap break-words">
              <WaText text={preview} />
            </div>
            <div className="mt-1 text-right text-[10.5px] text-muted">10:24</div>
          </div>
          {t.buttons.map((b) => (
            <div key={b.text} className="mt-1 rounded-2xl bg-bubble-in py-2.5 text-center text-[14px] font-medium text-link shadow-sm">
              {b.text}
            </div>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="relative flex h-9 items-center overflow-hidden rounded-full bg-surface px-4 text-[13.5px] shadow-sm ring-1 ring-line transition-colors hover:bg-surface-2"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "y" : "n"}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          className={`flex items-center gap-1.5 ${copied ? "text-faq" : ""}`}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "kopyalandı" : label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

/* ───────────── Bağlantı durumu ───────────── */

type Status = { whatsappReady: boolean; env: Record<string, boolean>; bridge: { configured: boolean; sendUrl: string } };

export function BridgeStatus() {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setS)
      .catch(() => {});
  }, []);

  const rows: [string, boolean | undefined, string][] = [
    ["WhatsApp bağlantısı", s?.whatsappReady, "Meta anahtarları tanımlı"],
    ["ZUULAB_SITE_URL", s?.env.ZUULAB_SITE_URL, "https://www.zuulab.com"],
    ["WHATSAPP_BRIDGE_SECRET", s?.env.WHATSAPP_BRIDGE_SECRET, "iki projede de aynı uzun rastgele değer"],
  ];

  return (
    <ul className="flex flex-col">
      {rows.map(([k, ok, hint]) => (
        <li key={k} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
          <span className={`size-2 shrink-0 rounded-full ${ok === undefined ? "bg-line-strong" : ok ? "bg-faq-dot" : "bg-warn-dot"}`} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] text-ink">{k}</span>
            <span className="block text-[13px] text-muted">{hint}</span>
          </span>
          <span className="text-[13px] text-muted">{ok === undefined ? "…" : ok ? "tamam" : "eksik"}</span>
        </li>
      ))}
      {s?.bridge.sendUrl && (
        <li className="pt-3 text-[13px] leading-relaxed text-muted">
          zuulab-e&apos;deki <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-ink-2">WHATSAPP_BRIDGE_URL</code> değeri bu sitenin adresi
          olmalı: <span className="break-all text-ink-2">{s.bridge.sendUrl.replace("/api/integrations/zuulab/send", "")}</span>
        </li>
      )}
    </ul>
  );
}
