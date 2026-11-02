"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { Collapse } from "@/components/ui/collapse";

export function InstructionsPreview() {
  const [text, setText] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && text === null) {
      const res = await fetch("/api/instructions").catch(() => null);
      if (res?.ok) setText(await res.text());
      else setError("Talimat yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
    }
  }

  return (
    <section className="mt-16 rounded-[24px] bg-surface p-2 shadow-sm ring-1 ring-line">
      <button onClick={toggle} aria-expanded={open} className="flex w-full items-center justify-between gap-6 rounded-[18px] px-5 py-4 text-left transition-colors hover:bg-surface-2">
        <span>
          <span className="block text-[16px] font-medium">AI&apos;nin gördüğü talimat</span>
          <span className="mt-0.5 block text-[14px] text-muted">Yukarıdaki bilgiler ve hazır cevaplardan her mesajda otomatik oluşur.</span>
        </span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2" aria-hidden>
          <Plus className="size-4" />
        </motion.span>
      </button>
      <Collapse open={open}>
          <div>
            {error ? (
              <p className="px-5 pb-4 text-[14px] text-danger">{error}</p>
            ) : (
              <pre className="scroll-thin m-2 mt-0 max-h-[460px] overflow-auto whitespace-pre-wrap rounded-[16px] bg-surface-2 p-5 font-mono text-[12.5px] leading-relaxed text-ink-2">
                {text ?? "Yükleniyor…"}
              </pre>
            )}
          </div>
      </Collapse>
    </section>
  );
}
