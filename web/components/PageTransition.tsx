"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} className="relative min-h-screen overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 right-0 top-0 z-[80] h-[2px] origin-left bg-[var(--rh-primary)]"
          initial={{ scaleX: 0, opacity: 0.9 }}
          animate={{ scaleX: [0, 0.68, 1], opacity: [0.95, 0.85, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.58, times: [0, 0.72, 1], ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[70] bg-[var(--rh-bg)]"
          initial={{ opacity: 0.28, y: 10 }}
          animate={{ opacity: 0, y: -18 }}
          exit={{ opacity: 0.2, y: -8 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="min-h-screen"
          initial={{ opacity: 0, y: 18, scale: 0.992, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, scale: 0.998, filter: "blur(2px)" }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
