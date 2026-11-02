"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { BARE_FIELD } from "@/components/ui/field";

/** Etiket girişi: yazıp Enter (ya da virgül) ile ekle, × ile çıkar. Yapıştırılan virgüllü listeyi de böler. */
export function ChipsInput({
  id,
  value,
  onChange,
  placeholder,
  max = 20,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  max?: number;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const lower = new Set(value.map((v) => v.toLocaleLowerCase("tr-TR")));
    const next = [...value];
    for (const p of parts) if (!lower.has(p.toLocaleLowerCase("tr-TR")) && next.length < max) next.push(p.slice(0, 120));
    onChange(next);
    setDraft("");
  }

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-2xl bg-surface-2 p-2 transition-shadow focus-within:shadow-[var(--ring)]!">
      <AnimatePresence initial={false}>
        {value.map((v) => (
          <motion.span
            key={v}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.12 } }}
            className="flex items-center gap-1 rounded-full bg-surface py-1 pl-3 pr-1 text-[13.5px] shadow-sm ring-1 ring-line"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="grid size-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label={`${v} kaldır`}
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) add(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? "" : placeholder}
        className={`${BARE_FIELD} h-8 min-w-[140px] flex-1 px-2 text-[14.5px] placeholder:text-muted`}
      />
    </div>
  );
}
