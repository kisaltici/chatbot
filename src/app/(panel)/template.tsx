"use client";

import { motion } from "motion/react";
import { ease } from "@/components/motion-provider";

/** Sayfa geçişi: içerik yumuşakça belirir */
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
      {children}
    </motion.div>
  );
}
