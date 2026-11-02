"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

type Props = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * "Emin misiniz?" penceresi. Arka plan yumuşakça kararır, pencere yaylanarak açılır ve kapanırken
 * aynı yumuşaklıkla kaybolur. Esc ve dışarı tıklama kapatır; açılınca odak "Vazgeç"e gider, kapanınca geri döner.
 */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Vazgeç", tone = "default", busy, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => cancelRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
      // Odak pencerenin içinde kalsın
      if (e.key === "Tab" && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, busy, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/25 p-4 backdrop-blur-[3px] dark:bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.22 } }}
          exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.04 } }}
          onClick={() => !busy && onCancel()}
        >
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={description ? "confirm-desc" : undefined}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 32 } }}
            exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-[26px] bg-surface p-6 shadow-xl ring-1 ring-line"
          >
            <h2 id="confirm-title" className="text-[18px] font-medium leading-snug">
              {title}
            </h2>
            {description && (
              <div id="confirm-desc" className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
                {description}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelRef}
                onClick={onCancel}
                disabled={busy}
                className="h-11 rounded-full px-5 text-[14.5px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                disabled={busy}
                className={`h-11 rounded-full px-5 text-[14.5px] font-medium transition-opacity disabled:opacity-60 ${
                  tone === "danger" ? "bg-danger text-white dark:text-bg" : "bg-ink text-bg"
                }`}
              >
                {busy ? "Siliniyor…" : confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
