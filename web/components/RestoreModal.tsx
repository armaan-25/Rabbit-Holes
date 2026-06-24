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
            className="rh-surface relative z-10 flex max-h-[86vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[22px] border shadow-[0_30px_80px_rgba(42,32,24,.34)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--rh-line)] px-7 pb-5 pt-6">
              <div className="min-w-0">
                <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.18em]">Resume rabbit hole</div>
                <h2 className="rh-display rh-ink mt-1 line-clamp-2 text-[27px] font-semibold leading-tight">{hole.title}</h2>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[18px] text-[var(--rh-muted)] transition hover:bg-[var(--rh-line)] hover:text-[var(--rh-ink)]">×</button>
            </div>

            <div className="overflow-y-auto px-7 py-6">
              <div className="rounded-[16px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-5">
                <div className="rh-faint mb-2 text-[12px] font-semibold uppercase tracking-[0.14em]">Where you left off</div>
                <p className="rh-muted text-[15.5px] leading-[1.55]">{whereYouLeftOff}</p>
                {openQuestion && (
                  <div className="mt-4 flex items-start gap-2 border-t border-[var(--rh-line)] pt-4 text-[15px] leading-snug text-[var(--rh-ink-soft)]">
                    <span className="text-[#c2703f]">↳</span>
                    <span><span className="font-semibold">Open question:</span> {openQuestion}</span>
                  </div>
                )}
              </div>

              <div className="mb-3 mt-6 flex items-baseline justify-between">
                <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.14em]">Reopen the trail · {ordered.length} pages</div>
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
                      className="flex items-center gap-3 rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3.5 py-2.5 transition hover:border-[var(--rh-line-strong)]"
                    >
                      <span className="w-4 text-[12px] tabular-nums text-[var(--rh-faint)]">{i + 1}</span>
                      <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-[var(--rh-line)] bg-[var(--rh-surface)] text-[12px] font-semibold" style={{ color: meta.color }}>
                        {p.domain ? <img src={faviconFor(p.domain)} alt="" className="h-4 w-4 rounded" /> : meta.glyph}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium text-[var(--rh-ink)]">{p.title}</span>
                        <span className="block truncate text-[12px] text-[var(--rh-muted)]">{p.domain}</span>
                      </span>
                      <span className="shrink-0 text-[15px] text-[#c3b49b]">↗</span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--rh-line)] bg-[var(--rh-surface-2)] px-7 py-4">
              <button onClick={onClose} className="text-[14px] font-medium text-[var(--rh-muted)] transition hover:text-[var(--rh-ink)]">Cancel</button>
              <button
                onClick={openAll}
                className="rh-primary rounded-[12px] px-5 py-3 text-[14.5px] font-semibold shadow-[0_10px_28px_rgba(42,32,24,.2)] transition hover:-translate-y-0.5"
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
