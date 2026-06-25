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
          <div className="absolute inset-0 bg-[#1a120c]/76 backdrop-blur-[10px]" />
          <motion.div
            className="relative w-full max-w-[720px] overflow-hidden rounded-[34px] border border-[#f3e8d426] bg-[#17100b] shadow-[0_34px_110px_rgba(18,11,5,.48)]"
            initial={{ scale: 0.96, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[360px] overflow-hidden border-b border-[#f3e8d41f] bg-[#f2e9d6]">

              {RESULT_WORDS.map((word, i) => (
                <motion.span
                  key={word}
                  className="absolute rh-display select-none text-[22px] italic tracking-wide text-[#8a6a48]/48"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: [0, 0.58, 0],
                    x: [i % 2 === 0 ? -96 : 96, 0],
                    y: [i < 3 ? -56 : 56, 8],
                    scale: [1, 0.34],
                  }}
                  transition={{ duration: 2.6, delay: i * 0.18, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
                  style={{ left: `${24 + (i % 3) * 25}%`, top: `${28 + Math.floor(i / 3) * 34}%` }}
                >
                  {word}
                </motion.span>
              ))}

              <motion.div
                className="absolute inset-x-0 bottom-[-54px] mx-auto h-[330px] w-[560px]"
                initial={{ y: 18, scale: 0.94, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute left-1/2 top-[56%] h-24 w-64 -translate-x-1/2 rounded-full bg-black/20 blur-3xl" />
                <img
                  src="/assets/images/rabbit-hole-hero.png"
                  alt=""
                  className="relative h-full w-full object-contain drop-shadow-[0_18px_36px_rgba(50,34,18,.18)]"
                />
              </motion.div>
            </div>

            <div className="relative bg-[#17100b] px-9 py-8 text-[#f3e8d4]">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#b69b77]">
                <span
                  className="h-2 w-2 rounded-full shadow-[0_0_14px_currentColor]"
                  style={{ background: accent.hex, color: accent.hex }}
                />
                New rabbit hole
              </div>

              <h2 className="rh-display text-[46px] font-semibold leading-none text-[#f6ecd9]">
                {discovery.title}
              </h2>
              <p className="mt-4 max-w-[560px] text-[19px] leading-7 text-[#d8c8ad]">
                Clustered {discovery.pages} pages and {discovery.searches} searches into one investigation.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={`/holes/${discovery.id}`}
                  className="rounded-[16px] border border-[#f3e8d426] bg-[#2b2117] px-7 py-4 text-[17px] font-semibold text-[#f6efe1] shadow-[0_10px_28px_rgba(42,32,24,.24)] transition hover:-translate-y-0.5"
                  onClick={clear}
                >
                  Open rabbit hole ↗
                </a>
                <button
                  onClick={clear}
                  className="rounded-[16px] border border-[#f3e8d426] bg-transparent px-7 py-4 text-[17px] font-semibold text-[#cdbd9f] transition hover:bg-[#f3e8d40d]"
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
