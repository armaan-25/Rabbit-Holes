"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { ACCENTS } from "@/lib/ui";

const RESULT_WORDS = ["tabs", "questions", "links", "notes", "context", "patterns"];

export function RabbitDive() {
  const discovery = useApp((s) => s.discovery);
  const clear = useApp((s) => s.clearDiscovery);
  const accent = discovery ? ACCENTS[discovery.accent] : ACCENTS.rabbit;

  return (
    <AnimatePresence>
      {discovery && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clear}
        >
          <div className="absolute inset-0 bg-[#201811]/72 backdrop-blur-sm" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(246,239,225,.16),transparent_42%)]" />

          <motion.div
            className="relative w-full max-w-[560px] overflow-hidden rounded-[34px] border border-[#785a3224] bg-[#fbf6ec] shadow-[0_28px_90px_rgba(18,11,5,.34)]"
            initial={{ scale: 0.96, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[300px] overflow-hidden bg-[radial-gradient(ellipse_at_center,#fbf6ec_0%,#f2e9d6_72%,#eadfcb_100%)]">
              <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(rgba(120,90,50,.14)_1px,transparent_1px)] [background-size:18px_18px]" />

              {RESULT_WORDS.map((word, i) => (
                <motion.span
                  key={word}
                  className="absolute rh-display select-none text-[18px] italic tracking-wide text-[#8a6a48]/70"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    x: [i % 2 === 0 ? -120 : 120, 0],
                    y: [i < 3 ? -72 : 72, 8],
                    scale: [1, 0.34],
                  }}
                  transition={{ duration: 2.6, delay: i * 0.18, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
                  style={{ left: `${24 + (i % 3) * 25}%`, top: `${28 + Math.floor(i / 3) * 34}%` }}
                >
                  {word}
                </motion.span>
              ))}

              <motion.div
                className="absolute inset-x-0 bottom-[-48px] mx-auto h-[270px] w-[440px]"
                initial={{ y: 18, scale: 0.94, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute left-1/2 top-[54%] h-24 w-56 -translate-x-1/2 rounded-full bg-black/20 blur-3xl" />
                <img
                  src="/assets/images/rabbit-hole-hero.png"
                  alt=""
                  className="relative h-full w-full object-contain drop-shadow-[0_18px_36px_rgba(50,34,18,.18)]"
                />
              </motion.div>
            </div>

            <div className="relative border-t border-[#785a321f] bg-[#fffaf1] px-8 py-7">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">
                <span
                  className="h-2 w-2 rounded-full shadow-[0_0_14px_currentColor]"
                  style={{ background: accent.hex, color: accent.hex }}
                />
                New rabbit hole
              </div>

              <h2 className="rh-display text-[32px] font-semibold leading-none text-[#2a2018]">
                {discovery.title}
              </h2>
              <p className="mt-3 max-w-[440px] text-[16px] leading-6 text-[#6a5a48]">
                Clustered {discovery.pages} pages and {discovery.searches} searches into one investigation.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`/holes/${discovery.id}`}
                  className="rounded-[14px] bg-[#2a2018] px-5 py-3 text-[14px] font-semibold text-[#f6efe1] shadow-[0_10px_28px_rgba(42,32,24,.18)] transition hover:-translate-y-0.5"
                  onClick={clear}
                >
                  Open rabbit hole ↗
                </a>
                <button
                  onClick={clear}
                  className="rounded-[14px] border border-[#785a3224] bg-[#fbf6ec] px-5 py-3 text-[14px] font-semibold text-[#6a5a48] transition hover:bg-[#f2e9d6]"
                >
                  Stay here
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
