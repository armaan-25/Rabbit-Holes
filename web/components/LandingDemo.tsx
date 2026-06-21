"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = ["Capture", "Cluster", "Holes", "Map", "Ask"] as const;
const DURATION = 3400;

/** A self-playing product walkthrough — a fake app window that cycles through
 *  the flow: capture → cluster → holes → map → ask. Pure CSS/SVG, no assets. */
export function LandingDemo() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % STEPS.length), DURATION);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="mx-auto w-full max-w-[940px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-[20px] border border-[#785a3224] bg-[#fbf6ec] shadow-[0_40px_90px_rgba(42,32,24,.28)]">
        {/* title bar */}
        <div className="flex items-center gap-3 border-b border-[#785a3221] bg-[#f6efe1] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#d98a5f]" />
            <span className="h-3 w-3 rounded-full bg-[#c7ae84]" />
            <span className="h-3 w-3 rounded-full bg-[#6a8050]" />
          </div>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#785a3221] bg-[#fbf6ec] px-4 py-1 text-[12.5px] text-[#8a7860]">
            <span>🔒</span> rabbithole.app
          </div>
        </div>

        {/* step tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#785a3221] px-3 py-2.5">
          {STEPS.map((s, idx) => (
            <button
              key={s}
              onClick={() => setI(idx)}
              className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                idx === i ? "bg-[#2a2018] text-[#f3e8d4]" : "text-[#8a7860] hover:text-[#2a2018]"
              }`}
            >
              {s}
              {idx === i && !paused && (
                <motion.span
                  key={`${i}-bar`}
                  className="absolute bottom-1 left-3.5 right-3.5 h-[2px] origin-left rounded-full bg-[#f3e8d4]/40"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: DURATION / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* stage */}
        <div className="relative h-[380px] overflow-hidden bg-[radial-gradient(120%_120%_at_50%_0%,#fffaf1,transparent_70%)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 p-7"
            >
              {SCENES[i]()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── scenes ──────────────────────────────────────────────────────────── */

function SceneHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">{kicker}</div>
      <div className="rh-display text-[24px] font-semibold leading-tight text-[#2a2018]">{title}</div>
    </div>
  );
}

const CAPTURED = [
  { glyph: "⌕", label: "vllm paged attention", kind: "search" },
  { glyph: "▤", label: "FlashAttention — fast exact attention", kind: "paper" },
  { glyph: "⌕", label: "continuous batching throughput", kind: "search" },
  { glyph: "◇", label: "github.com/vllm-project/vllm", kind: "repo" },
];

const Capture = () => (
  <div>
    <div className="mb-5 flex items-center justify-between">
      <SceneHeader kicker="01 · Capturing" title="It records the trail as you browse" />
      <div className="inline-flex items-center gap-2 rounded-full border border-[#b8795f3d] bg-[#b8795f1a] px-3 py-1.5 text-[12.5px] font-semibold text-[#a8472a]">
        <motion.span className="h-2 w-2 rounded-full bg-[#c14f33]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
        REC 0:42
      </div>
    </div>
    <div className="space-y-2.5">
      {CAPTURED.map((c, idx) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + idx * 0.18 }}
          className="flex items-center gap-3 rounded-[12px] border border-[#785a3221] bg-[#fbf6ec] px-4 py-3"
        >
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#f2e9d6] text-[14px] text-[#a8895f]">{c.glyph}</span>
          <span className="flex-1 truncate text-[15px] text-[#3a2f25]">{c.label}</span>
          <span className="text-[11.5px] uppercase tracking-wide text-[#a8967d]">{c.kind}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

const Cluster = () => (
  <div className="flex h-full flex-col items-center justify-center text-center">
    <motion.div
      className="grid h-20 w-20 place-items-center rounded-full border border-[#785a3224] bg-[#f6efe1]"
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 1.6, repeat: Infinity }}
    >
      <img src="/assets/images/rabbit-hole-hero.png" alt="" className="h-12 w-12 object-contain" />
    </motion.div>
    <div className="rh-display mt-5 text-[26px] font-semibold text-[#2a2018]">Building rabbit holes…</div>
    <div className="mt-2 text-[15px] text-[#6a5a48]">Claude clusters 14 signals into the questions you were actually chasing.</div>
    <div className="mt-6 h-1.5 w-[260px] overflow-hidden rounded-full bg-[#785a321f]">
      <motion.div
        className="h-full rounded-full bg-[linear-gradient(90deg,#c2703f,#e0865a)]"
        initial={{ width: "8%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2.6, ease: "easeInOut" }}
      />
    </div>
  </div>
);

const HOLES = [
  { title: "AI Systems", desc: "Inference serving for LLMs", match: 94, dot: "#c2703f" },
  { title: "Startup Research", desc: "The AI-native productivity space", match: 81, dot: "#8d7356" },
];

const Holes = () => (
  <div>
    <SceneHeader kicker="02 · Your rabbit holes" title="Named investigations, not a tab pile" />
    <div className="grid grid-cols-2 gap-3">
      {HOLES.map((h, idx) => (
        <motion.div
          key={h.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + idx * 0.12 }}
          className="rounded-[14px] border border-[#785a3221] bg-[#fbf6ec] p-4"
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: h.dot }} />
            <span className="rh-display text-[18px] font-semibold text-[#2a2018]">{h.title}</span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-[#6a5a48]">{h.desc}</p>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#785a321f]">
              <div className="h-full rounded-full" style={{ width: `${h.match}%`, background: `linear-gradient(90deg,${h.dot},#e0865a)` }} />
            </div>
            <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: h.dot }}>{h.match}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const NODES = [
  { label: "AI Systems", x: 27, y: 32 },
  { label: "Startups", x: 78, y: 27 },
  { label: "Quant", x: 33, y: 78 },
  { label: "Inference", x: 75, y: 75 },
];

const Map = () => (
  <div>
    <SceneHeader kicker="03 · The map" title="See how the thread actually connects" />
    <div className="relative h-[250px] overflow-hidden rounded-[18px] border border-[#4a3928] bg-[#1b130d] [background-image:radial-gradient(rgba(194,112,63,.18)_1px,transparent_1px)] [background-size:22px_22px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,90,50,.08),transparent_62%)]" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {NODES.map((n, idx) => (
          <motion.line
            key={idx}
            x1="50"
            y1="50"
            x2={n.x}
            y2={n.y}
            stroke="#8a623a"
            strokeWidth="0.7"
            opacity="0.62"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: idx * 0.12, duration: 0.65, ease: "easeOut" }}
          />
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#6a5137] bg-[#2a2018] text-[12px] font-semibold uppercase tracking-wide text-[#b69b77] shadow-[0_10px_24px_rgba(0,0,0,.22)]">
        YOU
      </div>
      {NODES.map((n, idx) => (
        <motion.div
          key={n.label}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 + idx * 0.1 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-[#5b4530] bg-[#21170f] px-4 py-2 text-[14px] font-semibold text-[#f3e8d4] shadow-[0_10px_24px_rgba(0,0,0,.2)]"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          {n.label}
        </motion.div>
      ))}
    </div>
  </div>
);

const Ask = () => (
  <div>
    <SceneHeader kicker="04 · Ask" title="Question your own history" />
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-[14px] rounded-br-[4px] bg-[#2a2018] px-4 py-2.5 text-[14.5px] text-[#f3e8d4]">
        Where did these sources disagree?
      </div>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-3 max-w-[88%] rounded-[14px] rounded-bl-[4px] border border-[#785a3221] bg-[#f6efe1] px-4 py-3 text-[14.5px] leading-[1.55] text-[#3a2f25]"
    >
      vLLM&rsquo;s paged-attention claims big throughput wins, but the continuous-batching write-up argues the gains shrink under long-context loads.
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#785a3221] pt-3">
        {["FlashAttention paper", "vLLM docs", "batching blog"].map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-[#785a3224] bg-[#fbf6ec] px-2.5 py-1 text-[11.5px] text-[#6a5a48]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c2703f]" /> {c}
          </span>
        ))}
      </div>
    </motion.div>
  </div>
);

const SCENES: Array<() => JSX.Element> = [Capture, Cluster, Holes, Map, Ask];
