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
      className="mx-auto w-full max-w-[1080px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-[20px] border border-[#4a3928] bg-[#21170f]">
        {/* title bar */}
        <div className="flex items-center gap-3 border-b border-[#4a3928] bg-[#2a2118] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#d98a5f]" />
            <span className="h-3 w-3 rounded-full bg-[#c7ae84]" />
            <span className="h-3 w-3 rounded-full bg-[#6a8050]" />
          </div>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#5b4731] bg-[#21170f] px-4 py-1 text-[12.5px] text-[#d8c8ad]">
            <span>●</span> Rabbit Holes
          </div>
        </div>

        {/* step tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#4a3928] bg-[#1d140d] px-3 py-2.5">
          {STEPS.map((s, idx) => (
            <button
              key={s}
              onClick={() => setI(idx)}
              className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                idx === i ? "bg-[#f3e8d4] text-[#21170f]" : "text-[#b7a487] hover:text-[#f3e8d4]"
              }`}
            >
              {s}
              {idx === i && !paused && (
                <motion.span
                  key={`${i}-bar`}
                  className="absolute bottom-1 left-3.5 right-3.5 h-[2px] origin-left rounded-full bg-[#21170f]/30"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: DURATION / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* stage */}
        <div className="relative h-[520px] overflow-hidden bg-[#18100a] sm:h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 p-5 sm:p-7"
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
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#9b825f]">{kicker}</div>
      <div className="rh-display text-[24px] font-semibold leading-tight text-[#f6ecd9]">{title}</div>
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
          className="flex items-center gap-3 rounded-[12px] border border-[#4a3928] bg-[#21170f] px-4 py-3"
        >
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#2a2118] text-[14px] text-[#c7ae84]">{c.glyph}</span>
          <span className="flex-1 truncate text-[15px] text-[#f3e8d4]">{c.label}</span>
          <span className="text-[11.5px] uppercase tracking-wide text-[#9b825f]">{c.kind}</span>
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
    <div className="rh-display mt-5 text-[26px] font-semibold text-[#f6ecd9]">Building rabbit holes...</div>
    <div className="mt-2 max-w-[44ch] text-[15px] text-[#cdbd9f]">Clustering the session into the questions you were actually chasing.</div>
    <div className="mt-6 h-1.5 w-[260px] overflow-hidden rounded-full bg-[#4a3928]">
      <motion.div
        className="h-full rounded-full bg-[#c2703f]"
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
          className="rounded-[14px] border border-[#4a3928] bg-[#21170f] p-4"
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: h.dot }} />
            <span className="rh-display text-[18px] font-semibold text-[#f6ecd9]">{h.title}</span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-[#cdbd9f]">{h.desc}</p>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#4a3928]">
              <div className="h-full rounded-full" style={{ width: `${h.match}%`, background: h.dot }} />
            </div>
            <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: h.dot }}>{h.match}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

/* Mirrors the real /map graph: a search → page/repo/paper flow with orthogonal
 * step connectors and domains. Node styling matches the app's dark FlowNode. */
type MapKind = "search" | "repo" | "doc" | "paper" | "page";

const MAP_KIND: Record<MapKind, { label: string; bg: string; border: string; dot: string }> = {
  search: { label: "Search", bg: "#2a1f15", border: "#8a623a", dot: "#b77637" },
  repo: { label: "Repo", bg: "#202018", border: "#687257", dot: "#5f6f4d" },
  doc: { label: "Docs", bg: "#222018", border: "#6d704f", dot: "#73805a" },
  paper: { label: "Paper", bg: "#271d18", border: "#7e5947", dot: "#9a5f45" },
  page: { label: "Page", bg: "#241c14", border: "#70583b", dot: "#8f7859" },
};

const MAP_NODES: { id: string; kind: MapKind; label: string; domain?: string; x: number; y: number }[] = [
  { id: "s0", kind: "search", label: "vLLM", x: 13, y: 13 },
  { id: "s1", kind: "search", label: "PagedAttention", x: 13, y: 30 },
  { id: "s2", kind: "search", label: "DistServe", x: 13, y: 47 },
  { id: "s3", kind: "search", label: "queueing theory", x: 13, y: 64 },
  { id: "s4", kind: "search", label: "SGLang", x: 13, y: 81 },
  { id: "r0", kind: "repo", label: "vllm repo", domain: "github.com", x: 48, y: 11 },
  { id: "r1", kind: "doc", label: "vLLM docs", domain: "docs.vllm.ai", x: 48, y: 25.4 },
  { id: "r2", kind: "paper", label: "PagedAttention paper", domain: "arxiv.org", x: 48, y: 39.8 },
  { id: "r3", kind: "paper", label: "DistServe paper", domain: "arxiv.org", x: 48, y: 54.2 },
  { id: "r4", kind: "page", label: "Queueing theory", domain: "wikipedia.org", x: 48, y: 68.6 },
  { id: "r5", kind: "repo", label: "SGLang", domain: "github.com", x: 48, y: 83 },
  { id: "d0", kind: "page", label: "Continuous batching", domain: "anyscale.com", x: 80, y: 41 },
  { id: "d1", kind: "repo", label: "FlashAttention", domain: "github.com", x: 80, y: 61 },
];

const MAP_EDGES: { from: string; to: string; tone: "amber" | "brown" | "green" }[] = [
  { from: "s0", to: "r0", tone: "amber" },
  { from: "s0", to: "r1", tone: "amber" },
  { from: "s1", to: "r2", tone: "amber" },
  { from: "s2", to: "r3", tone: "amber" },
  { from: "s3", to: "r4", tone: "amber" },
  { from: "s4", to: "r5", tone: "amber" },
  { from: "r2", to: "d0", tone: "brown" },
  { from: "r3", to: "d0", tone: "brown" },
  { from: "r3", to: "d1", tone: "green" },
];

const MAP_TONE = {
  amber: { stroke: "#b77637", opacity: 0.6, dash: undefined as string | undefined, marker: "demo-arrow-amber" },
  brown: { stroke: "#8a623a", opacity: 0.6, dash: undefined as string | undefined, marker: "demo-arrow-brown" },
  green: { stroke: "#5f8a5c", opacity: 0.4, dash: "4 5" as string | undefined, marker: "demo-arrow-green" },
} as const;

const mapNode = (id: string) => MAP_NODES.find((n) => n.id === id)!;

const Map = () => (
  <div>
    <div className="mb-4 flex items-end justify-between gap-4">
      <SceneHeader kicker="03 · The map" title="See the route you actually took" />
      <div className="hidden gap-1.5 sm:flex">
        {["AI Systems", "Startups", "Quant"].map((item, idx) => (
          <span key={item} className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${idx === 0 ? "border-[#f3e8d4] bg-[#f3e8d4] text-[#21170f]" : "border-[#6d5639] bg-[#21170f] text-[#cdbd9f]"}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
    <div className="relative h-[420px] overflow-hidden rounded-[18px] border border-[#4a3928] bg-[#1b130d] sm:h-[470px]">
      <div className="absolute inset-0 opacity-[0.28]" style={{ backgroundImage: "radial-gradient(#6d5639 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          {(["amber", "brown", "green"] as const).map((tone) => (
            <marker key={tone} id={MAP_TONE[tone].marker} viewBox="0 0 12 12" markerWidth="9" markerHeight="9" refX="9" refY="6" orient="auto" markerUnits="strokeWidth">
              <path d="M1,1 L10,6 L1,11" fill="none" stroke={MAP_TONE[tone].stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          ))}
        </defs>
        {MAP_EDGES.map((edge, idx) => {
          const a = mapNode(edge.from);
          const b = mapNode(edge.to);
          const tone = MAP_TONE[edge.tone];
          const sx = a.x + 7;
          const tx = b.x - 7;
          const mx = (sx + tx) / 2;
          return (
            <motion.path
              key={`${edge.from}-${edge.to}`}
              d={`M ${sx} ${a.y} H ${mx} V ${b.y} H ${tx}`}
              fill="none"
              stroke={tone.stroke}
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={tone.dash}
              vectorEffect="non-scaling-stroke"
              opacity={tone.opacity}
              markerEnd={`url(#${tone.marker})`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.1 + idx * 0.07, duration: 0.6, ease: "easeOut" }}
            />
          );
        })}
      </svg>
      {MAP_NODES.map((n, idx) => {
        const meta = MAP_KIND[n.kind];
        return (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="absolute w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-[10px] border px-3 py-2 shadow-[0_12px_26px_rgba(18,11,5,.22)]"
            style={{ left: `${n.x}%`, top: `${n.y}%`, background: meta.bg, borderColor: meta.border }}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.dot }} />
              <span className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#b69b77]">{meta.label}</span>
            </div>
            <div className="rh-display truncate text-[13px] font-semibold leading-tight text-[#f6ecd9]">{n.label}</div>
            {n.domain && <div className="mt-1 truncate text-[10px] text-[#b7a487]">{n.domain}</div>}
          </motion.div>
        );
      })}
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
      className="mt-3 max-w-[88%] rounded-[14px] rounded-bl-[4px] border border-[#4a3928] bg-[#21170f] px-4 py-3 text-[14.5px] leading-[1.55] text-[#f3e8d4]"
    >
      vLLM&rsquo;s paged-attention claims big throughput wins, but the continuous-batching write-up argues the gains shrink under long-context loads.
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#4a3928] pt-3">
        {["FlashAttention paper", "vLLM docs", "batching blog"].map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-[#4a3928] bg-[#1a1009] px-2.5 py-1 text-[11.5px] text-[#cdbd9f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c2703f]" /> {c}
          </span>
        ))}
      </div>
    </motion.div>
  </div>
);

const SCENES: Array<() => JSX.Element> = [Capture, Cluster, Holes, Map, Ask];
