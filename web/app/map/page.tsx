"use client";

import { useMemo, useState } from "react";
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
import { EmptyHolesPage } from "@/components/EmptyHoles";
import { useHoles } from "@/hooks/useHoles";
import { useDark } from "@/lib/useDark";
import type { GraphEdge, GraphNode, NodeKind, RabbitHole } from "@/lib/types";

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
      className="rh-map-node group block w-[160px] rounded-[10px] border px-3 py-2 text-left transition hover:-translate-y-0.5"
      style={{
        background: selected ? (dark ? "#332417" : "#fff8ea") : dark ? style.darkBg : style.bg,
        borderColor: selected ? (dark ? "#d8c3a1" : "#2a2018") : dark ? style.darkBorder : style.border,
        boxShadow: selected ? "0 0 0 1px rgba(216,195,161,.22)" : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: style.dot }} />
        <span className="text-[8.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: dark ? "#b69b77" : "#9b825f" }}>{KIND_LABEL[node.kind]}</span>
      </div>
      <div className="rh-display truncate text-[13px] font-semibold leading-tight">{node.label.replace(/^Search: /, "")}</div>
      {domain ? <div className="mt-1 truncate text-[10px]" style={{ color: dark ? "#b7a487" : "#7a6954" }}>{domain}</div> : null}
    </button>
  );
}

const nodeTypes = { flow: FlowNode };
const MAX_VISIBLE_NODES = 30;

function simplifiedGraph(hole: RabbitHole): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (hole.graph.nodes.length <= MAX_VISIBLE_NODES) return hole.graph;
  const searches = hole.graph.nodes.filter((node) => node.kind === "search").slice(0, 10);
  const pages = hole.graph.nodes.filter((node) => node.kind !== "search");
  const pageById = new Map(hole.pages.map((page) => [page.id, page]));
  const domains = new Map<string, GraphNode[]>();
  for (const node of pages) {
    const domain = pageById.get(node.id)?.domain ?? "unknown";
    const group = domains.get(domain) ?? [];
    group.push(node);
    domains.set(domain, group);
  }
  const representatives = [...domains.values()].map((group) => group[0]).filter(Boolean).slice(0, MAX_VISIBLE_NODES - searches.length - 1);
  const nodes = [...searches, ...representatives];
  const visibleIds = new Set(nodes.map((node) => node.id));
  const hiddenCount = hole.graph.nodes.filter((node) => !visibleIds.has(node.id)).length;
  if (hiddenCount > 0) {
    nodes.push({ id: "__more-pages", label: `${hiddenCount} more pages`, kind: "website", x: 0.9, y: 0.5 });
    visibleIds.add("__more-pages");
  }
  const edges = hole.graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  if (hiddenCount > 0 && searches[0]) {
    edges.push({ id: "__more-pages-edge", source: searches[0].id, target: "__more-pages", kind: "discovered_through" });
  }
  return { nodes, edges };
}

function layoutGraphNodes(hole: RabbitHole, graph = simplifiedGraph(hole)) {
  const searchNodes = graph.nodes.filter((node) => node.kind === "search");
  const contentNodes = graph.nodes.filter((node) => node.kind !== "search");
  const positions = new Map<string, { x: number; y: number }>();
  const NODE_W = 160;
  const NODE_H = 58;
  const COL_W = 240;
  const ROW_H = 78;
  const SEARCH_X = 130;
  const CONTENT_X = 365;
  const START_Y = 430;
  const edgesBySource = new Map<string, string[]>();
  const depth = new Map<string, number>();

  graph.edges.forEach((edge) => {
    const next = edgesBySource.get(edge.source) ?? [];
    next.push(edge.target);
    edgesBySource.set(edge.source, next);
  });

  searchNodes.forEach((node) => depth.set(node.id, 0));

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

  const maxSearchRows = Math.max(searchNodes.length, 1);
  const searchStartY = START_Y - ((maxSearchRows - 1) * ROW_H) / 2;

  searchNodes.forEach((node, index) => {
    positions.set(node.id, { x: SEARCH_X, y: searchStartY + index * ROW_H });
  });

  const grouped = new Map<number, GraphNode[]>();
  contentNodes.forEach((node) => {
    const col = Math.max(1, Math.min(depth.get(node.id) ?? 1, 4));
    const group = grouped.get(col) ?? [];
    group.push(node);
    grouped.set(col, group);
  });

  Array.from(grouped.entries()).forEach(([col, group]) => {
    const columnStartY = START_Y - ((group.length - 1) * ROW_H) / 2 + (col % 2 ? -16 : 22);
    group.forEach((node, row) => {
      positions.set(node.id, {
        x: CONTENT_X + (col - 1) * COL_W,
        y: columnStartY + row * ROW_H,
      });
    });
  });

  return graph.nodes.map((node) => {
    const position = positions.get(node.id) ?? { x: 0, y: 0 };
    return {
      node,
      position: {
        x: position.x - NODE_W / 2,
        y: position.y - NODE_H / 2,
      },
    };
  });
}

export default function MapPage() {
  const holes = useHoles();
  const [holeId, setHoleId] = useState(holes[0]?.id ?? "");
  const hole = holes.find((item) => item.id === holeId) ?? holes[0];
  const [selectedId, setSelectedId] = useState(hole?.graph.nodes[0]?.id ?? "");
  const dark = useDark();

  const nodes = useMemo<Node<FlowNodeData>[]>(() => {
    if (!hole) return [];
    const graph = simplifiedGraph(hole);
    return layoutGraphNodes(hole, graph).map(({ node, position }) => ({
      id: node.id,
      type: "flow",
      position,
      data: { node, hole, selected: node.id === selectedId, dark },
      draggable: false,
    }));
  }, [hole, selectedId, dark]);

  const edges = useMemo<Edge[]>(() => {
    if (!hole) return [];
    const graph = simplifiedGraph(hole);
    return graph.edges.map((edge) => {
      const color = edge.kind === "clicked_from" ? "#8a623a" : edge.kind === "searched_from" ? "#b77637" : "#5f8a5c";
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "step",
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 7,
          height: 7,
        },
        style: {
          stroke: color,
          strokeWidth: 1,
          opacity: edge.kind === "discovered_through" ? 0.34 : 0.62,
          strokeDasharray: edge.kind === "discovered_through" ? "4 5" : undefined,
        },
      };
    });
  }, [hole]);

  if (holes.length === 0) {
    return <EmptyHolesPage eyebrow="Map" title="Nothing to map yet" hint="Once the extension clusters a browsing session, your investigations show up here as a graph of searches and pages." />;
  }

  return (
    <div className="rh-app-bg min-h-screen px-5 py-7 sm:px-8 xl:px-12">
      <div className="mx-auto w-full max-w-[1720px]">
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
                  className="max-w-[240px] truncate rounded-full border px-4 py-2 text-[13px] font-semibold transition"
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

        <div className="mt-7">
          <div className="rh-map-shell h-[820px] overflow-hidden rounded-[28px] border">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              defaultViewport={{ x: 32, y: 42, zoom: 0.9 }}
              minZoom={0.35}
              maxZoom={1.25}
              proOptions={{ hideAttribution: true }}
              nodesConnectable={false}
              edgesFocusable={false}
              onNodeClick={(_, node) => setSelectedId(node.id)}
            >
              <Background variant={BackgroundVariant.Dots} gap={26} size={1.2} color={dark ? "#3a2e1f" : "#3a2a1d"} />
              <Controls showInteractive={false} className="!border-[var(--rh-map-line)] !bg-[var(--rh-surface)] !shadow-none" />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}
