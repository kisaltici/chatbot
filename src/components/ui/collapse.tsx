"use client";

import { AnimatePresence, motion } from "motion/react";

/** Yumuşak açılıp kapanan alan: yükseklik, saydamlık ve hafif kayma birlikte animasyonlanır */
export const collapseEase = [0.32, 0.72, 0, 1] as const;

export function Collapse({ open, children, id, className = "" }: { open: boolean; children: React.ReactNode; id?: string; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={id}
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.42, ease: collapseEase }, opacity: { duration: 0.28, delay: 0.06 } } }}
          exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.34, ease: collapseEase }, opacity: { duration: 0.18 } } }}
          className={`overflow-hidden ${className}`}
        >
          <motion.div initial={{ y: -6 }} animate={{ y: 0 }} exit={{ y: -6 }} transition={{ duration: 0.4, ease: collapseEase }}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
