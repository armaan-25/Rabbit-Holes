"use client";

import { useMemo } from "react";
import Link from "next/link";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import { getHole } from "@/lib/data";
import { useApp } from "@/lib/store";
import { ACCENTS, KIND_META, EDGE_LABELS, faviconFor } from "@/lib/ui";
import { useDark } from "@/lib/useDark";
import type { RabbitHole, GraphNode } from "@/lib/types";

const W = 1240;
const H = 760;

type StepData = {
  label: string;
  kind: GraphNode["kind"];
  domain?: string;
  url?: string;
  accent: string;
  dark: boolean;
};

function StepNode({ data }: NodeProps<StepData>) {
  const meta = KIND_META[data.kind];
  const Tag = data.url ? "a" : "div";
  return (
    <Tag
      {...(data.url ? { href: data.url, target: "_blank", rel: "noreferrer" } : {})}
      className="flex max-w-[240px] items-center gap-2.5 rounded-[14px] border bg-[var(--rh-surface)] px-3.5 py-2.5 no-underline shadow-[0_8px_22px_rgba(70,45,20,.1)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(70,45,20,.16)]"
      style={{ borderColor: data.dark ? "rgba(230,211,180,0.16)" : "#785a3233" }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <span
        className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[9px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] text-[13px] font-semibold"
        style={{ color: meta.color }}
      >
        {data.domain ? <img src={faviconFor(data.domain)} alt="" className="h-5 w-5 rounded" /> : meta.glyph}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-semibold leading-tight text-[var(--rh-ink)]">{data.label}</span>
        <span className="block text-[11px] capitalize text-[var(--rh-faint)]">{meta.label}</span>
      </span>
    </Tag>
  );
}

const nodeTypes = { step: StepNode };

export function HoleMapView({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const liveHoles = useApp((s) => s.liveHoles);
  const hole: RabbitHole | undefined = liveHoles.find((h) => h.id === id) ?? getHole(id);
  const dark = useDark();

  const nodes = useMemo<Node<StepData>[]>(() => {
    if (!hole) return [];
    const accent = ACCENTS[hole.accent].hex;
    // Stretch the raw 0..1 layout to fill the canvas so clustered steps spread out.
    const xs = hole.graph.nodes.map((n) => n.x);
    const ys = hole.graph.nodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const spanX = Math.max(...xs) - minX || 1;
    const spanY = Math.max(...ys) - minY || 1;
    return hole.graph.nodes.map((n) => {
      const page = hole.pages.find((p) => p.id === n.id);
      return {
        id: n.id,
        type: "step",
        position: { x: ((n.x - minX) / spanX) * W, y: ((n.y - minY) / spanY) * H },
        data: { label: n.label, kind: n.kind, domain: page?.domain, url: page?.url, accent, dark },
        draggable: true,
      };
    });
  }, [hole, dark]);

  const edges = useMemo<Edge[]>(() => {
    if (!hole) return [];
    return hole.graph.edges.map((e) => {
      const dashed = e.kind === "discovered_through";
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: EDGE_LABELS[e.kind],
        type: "smoothstep",
        animated: e.kind === "searched_from",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: dark ? "#b59a6a" : "#9a7c52",
          width: 13,
          height: 13,
        },
        style: { stroke: dark ? "#b59a6a" : "#9a7c52", strokeWidth: 1.35, strokeDasharray: dashed ? "4 4" : undefined, opacity: dark ? 0.55 : 0.5 },
        labelStyle: { fill: dark ? "#c8b89d" : "#8a7860", fontSize: 10.5, fontFamily: "var(--font-mono)" },
        labelBgStyle: { fill: dark ? "#211a14" : "#f6efe1" },
        labelBgPadding: [5, 2] as [number, number],
        labelBgBorderRadius: 6,
      };
    });
  }, [hole, dark]);

  if (!hole) {
    return (
      <div className="rh-paper flex min-h-screen items-center justify-center px-6">
        <div className="rh-surface max-w-md rounded-[20px] border p-8 text-center">
          <div className="rh-display rh-ink text-[28px] font-semibold">Rabbit hole not found</div>
          <Link href="/map" className="rh-primary mt-5 inline-flex rounded-[14px] px-5 py-3 text-[14px] font-semibold">← Back to the map</Link>
        </div>
      </div>
    );
  }

  const accent = ACCENTS[hole.accent];

  return (
    <div className={`${embedded ? "h-full bg-[#1b130d]" : "rh-paper relative min-h-screen"}`}>
      {!embedded && (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-start justify-between gap-5 px-6 pt-7 sm:px-10">
          <div>
            <Link href="/map" className="rh-muted pointer-events-auto text-[13.5px] font-medium transition hover:text-[#a8472a]">← The map</Link>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent.hex, boxShadow: `0 0 10px ${accent.ring}` }} />
              <h1 className="rh-display rh-ink line-clamp-2 text-[34px] font-semibold leading-none">{hole.title}</h1>
            </div>
            <p className="rh-muted mt-2 max-w-[560px] text-[14.5px] leading-6">
              How this investigation unfolded — {hole.graph.nodes.length} steps across {hole.domains.length} domains. Click a page to open it.
            </p>
          </div>
          <Link
            href={`/holes/${hole.id}`}
            className="rh-primary pointer-events-auto shrink-0 rounded-[12px] px-4 py-3 text-[14px] font-semibold shadow-[0_10px_28px_rgba(42,32,24,.16)] transition hover:-translate-y-0.5"
          >
            Open details ↗
          </Link>
        </div>
      )}

      <div className={`${embedded ? "h-full" : "h-screen"} w-full`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.4}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          edgesFocusable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={30} size={1.4} color={dark ? "#3a2e1f" : "#cbb596"} />
          <Controls showInteractive={false} className="!border-[#785a3233] !shadow-none" />
        </ReactFlow>
      </div>
    </div>
  );
}
