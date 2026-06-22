"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import { ACCENTS, faviconFor } from "@/lib/ui";
import { EmptyHolesPage } from "@/components/EmptyHoles";
import { useHoles } from "@/hooks/useHoles";
import { useDark } from "@/lib/useDark";
import type { GraphNode, NodeKind, RabbitHole } from "@/lib/types";

type FlowNodeData = {
  node: GraphNode;
  hole: RabbitHole;
  selected: boolean;
  dark: boolean;
};

const KIND_LABEL: Record<NodeKind, string> = {
  search: "Search",
  website: "Page",
  repo: "Repo",
  paper: "Paper",
  doc: "Docs",
  video: "Video",
};

const KIND_STYLE: Record<NodeKind, { bg: string; darkBg: string; border: string; darkBorder: string; dot: string }> = {
  search: { bg: "#f6ecdc", darkBg: "#2a1f15", border: "#c79f6b", darkBorder: "#8a623a", dot: "#b77637" },
  website: { bg: "#fbf6ec", darkBg: "#241c14", border: "#d8c3a1", darkBorder: "#70583b", dot: "#8f7859" },
  repo: { bg: "#f4f0e7", darkBg: "#202018", border: "#b9aa8d", darkBorder: "#687257", dot: "#5f6f4d" },
  paper: { bg: "#f7efe7", darkBg: "#271d18", border: "#c8a891", darkBorder: "#7e5947", dot: "#9a5f45" },
  doc: { bg: "#f5f1e6", darkBg: "#222018", border: "#b9b38d", darkBorder: "#6d704f", dot: "#73805a" },
  video: { bg: "#f6eded", darkBg: "#271b1b", border: "#c9a1a1", darkBorder: "#7e5050", dot: "#9a5959" },
};

function flowNodeDomain(node: GraphNode, hole: RabbitHole) {
  return hole.pages.find((page) => page.id === node.id)?.domain;
}

function FlowNode({ data }: NodeProps<FlowNodeData>) {
  const { node, hole, selected, dark } = data;
  const style = KIND_STYLE[node.kind];
  const domain = flowNodeDomain(node, hole);

  return (
    <button
      type="button"
      className="rh-map-node group block w-[210px] rounded-[16px] border px-3.5 py-3 text-left shadow-[0_12px_28px_rgba(25,15,6,.16)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(25,15,6,.22)]"
      style={{
        background: selected ? (dark ? "#332417" : "#fff8ea") : dark ? style.darkBg : style.bg,
        borderColor: selected ? (dark ? "#d8c3a1" : "#2a2018") : dark ? style.darkBorder : style.border,
        boxShadow: selected ? "0 0 0 3px rgba(216,195,161,.12), 0 18px 40px rgba(25,15,6,.28)" : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div className="mb-2 flex items-center gap-2">
        {domain ? (
          <img src={faviconFor(domain)} alt="" className="h-5 w-5 rounded-full bg-white" />
        ) : (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/70">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: style.dot }} />
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: dark ? "#b69b77" : "#9b825f" }}>{KIND_LABEL[node.kind]}</span>
      </div>
      <div className="rh-display line-clamp-2 text-[18px] font-semibold leading-tight">{node.label.replace(/^Search: /, "")}</div>
      {domain ? <div className="mt-2 truncate text-[12px]" style={{ color: dark ? "#b7a487" : "#7a6954" }}>{domain}</div> : null}
    </button>
  );
}

const nodeTypes = { flow: FlowNode };

function selectedInsight(hole: RabbitHole, nodeId: string) {
  const page = hole.pages.find((p) => p.id === nodeId);
  const search = hole.searches.find((s) => s.id === nodeId);
  const graphNode = hole.graph.nodes.find((n) => n.id === nodeId);
  const incoming = hole.graph.edges.filter((edge) => edge.target === nodeId);
  const outgoing = hole.graph.edges.filter((edge) => edge.source === nodeId);

  if (page) {
    const from = page.openedFrom ? hole.graph.nodes.find((n) => n.id === page.openedFrom)?.label : null;
    return {
      title: page.title,
      eyebrow: page.domain,
      detail: `${Math.round(page.dwellSeconds / 60)} min active${from ? ` · came from ${from.replace(/^Search: /, "")}` : ""}`,
      url: page.url,
      flow: `${incoming.length} path in · ${outgoing.length} path${outgoing.length === 1 ? "" : "s"} out`,
    };
  }

  if (search) {
    return {
      title: search.query,
      eyebrow: `${search.engine} search`,
      detail: "This search opened the next branch of the rabbit hole.",
      url: null,
      flow: `${incoming.length} path in · ${outgoing.length} result${outgoing.length === 1 ? "" : "s"} followed`,
    };
  }

  return {
    title: graphNode?.label ?? hole.title,
    eyebrow: hole.title,
    detail: hole.description,
    url: null,
    flow: `${incoming.length} path in · ${outgoing.length} paths out`,
  };
}

export default function MapPage() {
  const holes = useHoles();
  const [holeId, setHoleId] = useState(holes[0]?.id ?? "");
  const hole = holes.find((item) => item.id === holeId) ?? holes[0];
  const [selectedId, setSelectedId] = useState(hole?.graph.nodes[0]?.id ?? "");
  const dark = useDark();

  const nodes = useMemo<Node<FlowNodeData>[]>(() => {
    if (!hole) return [];
    const WIDTH = 210;
    const HEIGHT = 86;
    return hole.graph.nodes.map((node) => ({
      id: node.id,
      type: "flow",
      position: {
        x: node.x * 1120 - WIDTH / 2,
        y: node.y * 560 - HEIGHT / 2,
      },
      data: { node, hole, selected: node.id === selectedId, dark },
      draggable: false,
    }));
  }, [hole, selectedId, dark]);

  const edges = useMemo<Edge[]>(() => {
    if (!hole) return [];
    return hole.graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: edge.kind === "discovered_through",
      style: {
        stroke: edge.kind === "clicked_from" ? "#8a623a" : edge.kind === "searched_from" ? "#b77637" : "#5f8a5c",
        strokeWidth: 2,
        opacity: 0.72,
      },
    }));
  }, [hole]);

  const insight = hole ? selectedInsight(hole, selectedId) : null;

  if (holes.length === 0) {
    return <EmptyHolesPage eyebrow="Map" title="Nothing to map yet" hint="Once the extension clusters a browsing session, your investigations show up here as a graph of searches and pages." />;
  }

  return (
    <div className="rh-app-bg min-h-screen px-5 py-7 sm:px-8 xl:px-12">
      <div className="mx-auto w-full max-w-[1480px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="rh-faint mb-2 text-[12px] font-semibold uppercase tracking-[0.22em]">Map</div>
            <h1 className="rh-display rh-ink text-[46px] font-semibold leading-none">See the thread</h1>
            <p className="rh-muted mt-3 max-w-[640px] text-[15.5px] leading-6">
              Click a node to see how a search became a page, how that page led somewhere else, and what the thread was actually about.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {holes.map((item) => {
              const active = item.id === hole?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setHoleId(item.id);
                    setSelectedId(item.graph.nodes[0]?.id ?? "");
                  }}
                  className="rounded-full border px-4 py-2 text-[13px] font-semibold transition"
                  style={{
                    background: active ? "var(--rh-primary)" : "var(--rh-surface)",
                    borderColor: active ? "var(--rh-primary)" : "var(--rh-line-strong)",
                    color: active ? "var(--rh-primary-text)" : "var(--rh-ink-soft)",
                  }}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rh-map-shell h-[690px] overflow-hidden rounded-[28px] border shadow-[0_24px_70px_rgba(40,25,10,.18)]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.45}
              maxZoom={1.35}
              proOptions={{ hideAttribution: true }}
              nodesConnectable={false}
              edgesFocusable={false}
              onNodeClick={(_, node) => setSelectedId(node.id)}
            >
              <Background variant={BackgroundVariant.Dots} gap={26} size={1.2} color={dark ? "#3a2e1f" : "#3a2a1d"} />
              <Controls showInteractive={false} className="!border-[var(--rh-map-line)] !bg-[var(--rh-surface)] !shadow-none" />
            </ReactFlow>
          </div>

          <aside className="rh-map-panel rounded-[28px] border p-6 shadow-[0_18px_50px_rgba(70,45,20,.10)]">
            <div className="rh-faint text-[11px] font-semibold uppercase tracking-[0.2em]">Selected node</div>
            <h2 className="rh-display rh-ink mt-3 text-[31px] font-semibold leading-tight">{insight?.title}</h2>
            <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--rh-faint)" }}>{insight?.eyebrow}</div>
            <p className="rh-muted mt-4 text-[15px] leading-6">{insight?.detail}</p>
            <div className="rh-surface-2 mt-5 rounded-2xl border p-4 text-[14px] font-semibold">
              {insight?.flow}
            </div>
            {insight?.url ? (
              <a
                href={insight.url}
                target="_blank"
                rel="noreferrer"
                className="rh-primary mt-4 inline-flex rounded-full px-5 py-3 text-[14px] font-semibold no-underline"
              >
                Open source →
              </a>
            ) : null}
            {hole ? (
              <Link
                href={`/map/${hole.id}`}
                className="rh-surface-2 mt-3 inline-flex rounded-full border px-5 py-3 text-[14px] font-semibold no-underline"
              >
                Open full hole
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
