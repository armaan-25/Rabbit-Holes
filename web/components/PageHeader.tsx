"use client";

import { motion } from "framer-motion";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-end justify-between gap-6"
    >
      <div>
        {eyebrow && (
          <div className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#a8967d]">
            {eyebrow}
          </div>
        )}
        <h1 className="rh-display mt-1.5 text-[36px] font-semibold leading-none tracking-normal text-[#2a2018] sm:text-[42px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[#6a5a48]">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="items-center self-start">{right}</div>}
    </motion.div>
  );
}
