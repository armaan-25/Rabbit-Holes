"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

// Shared motion vocabulary, matching the landing page: soft ease, ~22px lift, 0.08s stagger.
export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
};

type DivProps = ComponentProps<typeof motion.div>;

/** Fade + lift into view once scrolled into frame. */
export function FadeIn({ children, delay = 0, ...props }: { children: ReactNode; delay?: number } & DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as ComponentProps<"div">)}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its <StaggerItem> children on mount. */
export function Stagger({ children, ...props }: { children: ReactNode } & DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as ComponentProps<"div">)}>{children}</div>;
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" {...props}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: { children: ReactNode } & DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as ComponentProps<"div">)}>{children}</div>;
  return (
    <motion.div variants={staggerItem} {...props}>
      {children}
    </motion.div>
  );
}

/** Subtle lift + press feedback on hover/tap. */
export function HoverCard({ children, ...props }: { children: ReactNode } & DivProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as ComponentProps<"div">)}>{children}</div>;
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: EASE } }}
      whileTap={{ scale: 0.985 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
