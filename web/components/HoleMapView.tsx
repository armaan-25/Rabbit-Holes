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
import { ACCENTS, KIND_META } from "@/lib/ui";
import { useDark } from "@/lib/useDark";
import type { RabbitHole, GraphEdge, GraphNode } from "@/lib/types";

const W = 1120;
const H = 640;

type StepData = {
  label: string;
  kind: GraphNode["kind"];
  domain?: string;
  url?: string;
  accent: string;
  dark: boolean;
  aggregateCount?: number;
};

function StepNode({ data }: NodeProps<StepData>) {
  const meta = KIND_META[data.kind];
  const Tag = data.url ? "a" : "div";
  return (
    <Tag
      {...(data.url ? { href: data.url, target: "_blank", rel: "noreferrer" } : {})}
      className="block w-[158px] rounded-[10px] border bg-[var(--rh-surface)] px-3 py-2 text-left no-underline shadow-[0_12px_26px_rgba(18,11,5,.18)] transition hover:-translate-y-0.5"
      style={{ borderColor: data.dark ? "rgba(230,211,180,0.16)" : "#785a3233" }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
        <span className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[var(--rh-faint)]">{data.aggregateCount ? "More" : meta.label}</span>
      </div>
      <div className="rh-display truncate text-[13px] font-semibold leading-tight text-[var(--rh-ink)]">{data.aggregateCount ? `${data.aggregateCount} more pages` : data.label.replace(/^Search: /, "")}</div>
      {data.domain ? <div className="mt-1 truncate text-[10px] text-[var(--rh-muted)]">{data.domain}</div> : null}
    </Tag>
  );
}

const nodeTypes = { step: StepNode };
const MAX_VISIBLE_NODES = 24;

function simplifyGraph(hole: RabbitHole): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (hole.graph.nodes.length <= MAX_VISIBLE_NODES) return hole.graph;

  const searches = hole.graph.nodes.filter((node) => node.kind === "search");
  const byDomain = new Map<string, GraphNode[]>();
  const pageById = new Map(hole.pages.map((page) => [page.id, page]));
  for (const node of hole.graph.nodes.filter((item) => item.kind !== "search")) {
    const domain = pageById.get(node.id)?.domain ?? "unknown";
    const group = byDomain.get(domain) ?? [];
    group.push(node);
    byDomain.set(domain, group);
  }

  const representativePages = [...byDomain.values()]
    .map((group) => group[0])
    .filter(Boolean)
    .slice(0, Math.max(8, MAX_VISIBLE_NODES - searches.length - 1));
  const visible = [...searches.slice(0, 8), ...representativePages];
  const visibleIds = new Set(visible.map((node) => node.id));
  const hidden = hole.graph.nodes.filter((node) => !visibleIds.has(node.id));

  if (hidden.length) {
    const aggregate: GraphNode = {
      id: "__more-pages",
      label: `${hidden.length} more pages`,
      kind: "website",
      x: 0.92,
      y: 0.5,
    };
    visible.push(aggregate);
    visibleIds.add(aggregate.id);
  }

  const edges = hole.graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const firstSearch = searches[0]?.id;
  if (hidden.length && firstSearch) {
    edges.push({
      id: "__more-pages-edge",
      source: firstSearch,
      target: "__more-pages",
      kind: "discovered_through",
    });
  }

  return { nodes: visible, edges };
}

function layoutGraph(graph: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const searchNodes = graph.nodes.filter((node) => node.kind === "search");
  const contentNodes = graph.nodes.filter((node) => node.kind !== "search");
  const positions = new Map<string, { x: number; y: number }>();
  const edgesBySource = new Map<string, string[]>();
  const depth = new Map<string, number>();
  const nodeW = 158;
  const nodeH = 64;
  const rowH = 90;
  const colW = 288;
  const searchX = 96;
  const contentX = 380;
  const centerY = H / 2;

  for (const edge of graph.edges) {
    const targets = edgesBySource.get(edge.source) ?? [];
    targets.push(edge.target);
    edgesBySource.set(edge.source, targets);
  }

  for (const node of searchNodes) depth.set(node.id, 0);
  const queue = searchNodes.map((node) => node.id);
  while (queue.length > 0) {
    const source = queue.shift();
    if (!source) continue;
    const nextDepth = (depth.get(source) ?? 0) + 1;
    for (const target of edgesBySource.get(source) ?? []) {
      if (!depth.has(target) || nextDepth < (depth.get(target) ?? Infinity)) {
        depth.set(target, nextDepth);
        queue.push(target);
      }
    }
  }

  const placeColumn = (nodes: GraphNode[], x: number, offset = 0) => {
    const visibleRows = Math.max(nodes.length, 1);
    const spacing = visibleRows > 7 ? 62 : rowH;
    const startY = centerY - ((visibleRows - 1) * spacing) / 2 + offset;
    nodes.forEach((node, index) => {
      positions.set(node.id, { x, y: startY + index * spacing });
    });
  };

  placeColumn(searchNodes, searchX);

  const grouped = new Map<number, GraphNode[]>();
  for (const node of contentNodes) {
    const column = Math.max(1, Math.min(depth.get(node.id) ?? 1, 4));
    const group = grouped.get(column) ?? [];
    group.push(node);
    grouped.set(column, group);
  }

  for (const [column, nodes] of grouped.entries()) {
    placeColumn(nodes, contentX + (column - 1) * colW, column % 2 ? -24 : 24);
  }

  return graph.nodes.map((node) => ({
    node,
    position: {
      x: (positions.get(node.id)?.x ?? searchX) - nodeW / 2,
      y: (positions.get(node.id)?.y ?? centerY) - nodeH / 2,
    },
  }));
}

export function HoleMapView({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const liveHoles = useApp((s) => s.liveHoles);
  const hole: RabbitHole | undefined = liveHoles.find((h) => h.id === id) ?? getHole(id);
  const dark = useDark();

  const nodes = useMemo<Node<StepData>[]>(() => {
    if (!hole) return [];
    const graph = simplifyGraph(hole);
    const accent = ACCENTS[hole.accent].hex;
    const hiddenCount = Math.max(0, hole.graph.nodes.length - (graph.nodes.length - 1));

    return layoutGraph(graph).map(({ node: n, position }) => {
      const page = hole.pages.find((p) => p.id === n.id);
      return {
        id: n.id,
        type: "step",
        position,
        data: { label: n.label, kind: n.kind, domain: page?.domain, url: page?.url, accent, dark, aggregateCount: n.id === "__more-pages" ? hiddenCount : undefined },
        draggable: false,
      };
    });
  }, [hole, dark]);

  const edges = useMemo<Edge[]>(() => {
    if (!hole) return [];
    const graph = simplifyGraph(hole);
    return graph.edges.map((e) => {
      const dashed = e.kind === "discovered_through";
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: dark ? "#b59a6a" : "#9a7c52",
          width: 14,
          height: 14,
        },
        style: { stroke: dark ? "#b59a6a" : "#9a7c52", strokeWidth: 1.35, strokeDasharray: dashed ? "4 4" : undefined, opacity: dark ? 0.5 : 0.46 },
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
          fitViewOptions={{ padding: 0.22 }}
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
