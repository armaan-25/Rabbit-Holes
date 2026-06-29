"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const trail = [
  { title: "vLLM", detail: "Started from search", x: 8, y: 54 },
  { title: "PagedAttention", detail: "Memory layout", x: 30, y: 32 },
  { title: "DistServe", detail: "Serving paper", x: 54, y: 54 },
  { title: "Queueing theory", detail: "Background concept", x: 38, y: 76 },
  { title: "Sarathi", detail: "Suggested next", x: 78, y: 38 },
];

export function LandingDemo() {
  const [selected, setSelected] = useState(2);
  const current = trail[selected];

  return (
    <div className="overflow-hidden rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)]">
      <div className="grid min-h-[680px] lg:grid-cols-[1fr_380px]">
        <div className="relative min-h-[460px] border-b border-[var(--rh-line)] bg-[var(--rh-map-bg)] p-8 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: "radial-gradient(var(--rh-map-line) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          <div className="relative z-10 mb-12 flex items-start justify-between gap-6">
            <div>
              <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.24em]">How you got here</div>
              <h3 className="rh-display mt-2 text-[34px] font-semibold leading-tight text-[var(--rh-ink)]">Distributed inference</h3>
            </div>
            <div className="hidden rounded-full border border-[var(--rh-line)] px-4 py-2 text-[13px] text-[var(--rh-muted)] sm:block">24 pages</div>
          </div>

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full p-8">
            <path d="M 16 56 H 30 V 34 H 54 V 56 H 78 V 40" fill="none" stroke="#8a623a" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
            <path d="M 30 34 V 76 H 38" fill="none" stroke="#8a623a" strokeWidth="0.55" strokeOpacity="0.72" vectorEffect="non-scaling-stroke" />
          </svg>

          {trail.map((node, i) => (
            <button
              key={node.title}
              onClick={() => setSelected(i)}
              className={`absolute z-20 w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] border px-4 py-3 text-left transition hover:-translate-y-[calc(50%+2px)] ${selected === i ? "bg-[var(--rh-primary)] text-[var(--rh-primary-text)]" : "bg-[var(--rh-surface)] text-[var(--rh-ink)]"}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className="rh-faint mb-1 text-[10px] font-semibold uppercase tracking-[0.2em]">{i === 0 ? "Search" : i === 4 ? "Next" : "Page"}</div>
              <div className="rh-display truncate text-[19px] font-semibold leading-tight">{node.title}</div>
              <div className="mt-1 truncate text-[12.5px] opacity-75">{node.detail}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col justify-between p-8 sm:p-10">
          <div>
            <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.24em]">Current position</div>
            <motion.div key={current.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
              <h3 className="rh-display mt-3 text-[46px] font-semibold leading-none tracking-[-0.025em] text-[var(--rh-ink)]">{current.title}</h3>
              <p className="rh-muted mt-5 text-[19px] leading-[1.55]">
                You were comparing how inference systems schedule requests, move memory, and trade throughput against latency.
              </p>
            </motion.div>
          </div>

          <div className="mt-12 space-y-5">
            <div className="rounded-[22px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-5">
              <div className="rh-faint text-[11px] font-semibold uppercase tracking-[0.2em]">Question</div>
              <div className="mt-2 text-[21px] leading-snug text-[var(--rh-ink-soft)]">How does vLLM schedule requests?</div>
            </div>
            <div className="rounded-[22px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-5">
              <div className="rh-faint text-[11px] font-semibold uppercase tracking-[0.2em]">Brief</div>
              <div className="mt-2 text-[16px] leading-7 text-[var(--rh-muted)]">
                PagedAttention explains the memory model. DistServe separates prefill and decode. Sarathi is the next useful comparison.
              </div>
            </div>
            <button className="w-full rounded-full bg-[var(--rh-primary)] px-6 py-4 text-[16px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
              Continue investigation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
