"use client";

import { MotionConfig } from "motion/react";

/** Tüm animasyonlar için ortak yay ayarı; "hareketi azalt" tercihine uyar */
export const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;
export const softSpring = { type: "spring", stiffness: 260, damping: 30 } as const;
export const ease = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      {children}
    </MotionConfig>
  );
}
