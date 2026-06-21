"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RabbitHole } from "@/lib/types";
import { KIND_META, faviconFor } from "@/lib/ui";
import { relativeTime } from "@/lib/format";

export function RestoreModal({ hole, open, onClose }: { hole: RabbitHole; open: boolean; onClose: () => void }) {
  // Ordered the way the investigation actually unfolded.
  const ordered = useMemo(
    () => [...hole.pages].sort((a, b) => +new Date(a.visitedAt) - +new Date(b.visitedAt)),
    [hole.pages]
  );

  const lastSearch = hole.searches[hole.searches.length - 1]?.query;
  const openQuestion = hole.summary.questions[0];
  const whereYouLeftOff = `${hole.description} You last touched this ${relativeTime(hole.lastActive)}, after pulling ${hole.searches.length} thread${hole.searches.length === 1 ? "" : "s"} across ${hole.pages.length} pages and ${hole.domains.length} domains${lastSearch ? ` — the last thing you searched was “${lastSearch}.”` : "."}`;

  function openAll() {
    ordered.forEach((p) => window.open(p.url, "_blank", "noopener"));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#1a100980] backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[86vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[22px] border border-[#785a3233] bg-[#fbf6ec] shadow-[0_30px_80px_rgba(42,32,24,.34)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#785a3221] px-7 pb-5 pt-6">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">Resume rabbit hole</div>
                <h2 className="rh-display mt-1 text-[27px] font-semibold leading-tight text-[#2a2018]">{hole.title}</h2>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-[18px] text-[#9c8b75] transition hover:bg-[#785a3214] hover:text-[#2a2018]">×</button>
            </div>

            <div className="overflow-y-auto px-7 py-6">
              <div className="rounded-[16px] border border-[#785a3221] bg-[#f6efe1] p-5">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a8967d]">Where you left off</div>
                <p className="text-[15.5px] leading-[1.55] text-[#5a4a38]">{whereYouLeftOff}</p>
                {openQuestion && (
                  <div className="mt-4 flex items-start gap-2 border-t border-[#785a3221] pt-4 text-[15px] leading-snug text-[#3a2f25]">
                    <span className="text-[#c2703f]">↳</span>
                    <span><span className="font-semibold">Open question:</span> {openQuestion}</span>
                  </div>
                )}
              </div>

              <div className="mb-3 mt-6 flex items-baseline justify-between">
                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a8967d]">Reopen the trail · {ordered.length} pages</div>
              </div>
              <div className="space-y-2">
                {ordered.map((p, i) => {
                  const meta = KIND_META[p.kind];
                  return (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-[12px] border border-[#785a3221] bg-white/70 px-3.5 py-2.5 transition hover:border-[#785a3240] hover:bg-white"
                    >
                      <span className="w-4 text-[12px] tabular-nums text-[#b6a488]">{i + 1}</span>
                      <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-[#785a3224] bg-white text-[12px] font-semibold" style={{ color: meta.color }}>
                        {p.domain ? <img src={faviconFor(p.domain)} alt="" className="h-4 w-4 rounded" /> : meta.glyph}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium text-[#2a2018]">{p.title}</span>
                        <span className="block truncate text-[12px] text-[#9c8b75]">{p.domain}</span>
                      </span>
                      <span className="shrink-0 text-[15px] text-[#c3b49b]">↗</span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#785a3221] bg-[#f6efe1] px-7 py-4">
              <button onClick={onClose} className="text-[14px] font-medium text-[#8a7860] transition hover:text-[#2a2018]">Cancel</button>
              <button
                onClick={openAll}
                className="rounded-[12px] bg-[#2a2018] px-5 py-3 text-[14.5px] font-semibold text-[#f3e8d4] shadow-[0_10px_28px_rgba(42,32,24,.2)] transition hover:-translate-y-0.5"
              >
                Open all {ordered.length} in order ↗
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
