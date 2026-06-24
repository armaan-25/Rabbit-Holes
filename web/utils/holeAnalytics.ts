import type { GraphNode, PageVisit, RabbitHole } from "@/lib/types";

export function minutesSpent(hole: RabbitHole): number {
  const dwellSeconds = hole.pages.reduce((sum, page) => sum + page.dwellSeconds, 0);
  if (dwellSeconds > 0) return Math.max(1, Math.round(dwellSeconds / 60));

  // Extension-generated cluster pages do not always have active dwell time yet.
  // Use a conservative estimate so summaries/heatmaps do not render as "0m"
  // after a valid browsing session.
  return Math.max(1, hole.pages.length * 2 + hole.searches.length);
}

export function getGraphNode(hole: RabbitHole, id: string): GraphNode | undefined {
  return hole.graph.nodes.find((node) => node.id === id);
}

export function getSourceSearch(hole: RabbitHole, page: PageVisit) {
  let current = page.openedFrom;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const search = hole.searches.find((item) => item.id === current);
    if (search) return search;
    current = hole.pages.find((item) => item.id === current)?.openedFrom;
  }
  return undefined;
}

export function getNavigationPath(hole: RabbitHole, pageId: string) {
  const byPage = new Map(hole.pages.map((page) => [page.id, page]));
  const path: Array<{ id: string; label: string; kind: "search" | PageVisit["kind"]; detail?: string }> = [];
  let current: string | undefined = pageId;
  const seen = new Set<string>();

  while (current && !seen.has(current)) {
    seen.add(current);
    const page = byPage.get(current);
    const search = hole.searches.find((item) => item.id === current);
    const graphNode = getGraphNode(hole, current);
    if (page) {
      path.unshift({ id: page.id, label: page.title, kind: page.kind, detail: page.domain });
      current = page.openedFrom;
      continue;
    }
    if (search) {
      path.unshift({ id: search.id, label: search.query, kind: "search", detail: search.engine });
      break;
    }
    if (graphNode) path.unshift({ id: graphNode.id, label: graphNode.label, kind: graphNode.kind });
    break;
  }

  return path;
}

export function buildPrimaryChain(hole: RabbitHole) {
  const { nodes, edges } = hole.graph;
  const incoming = new Set(edges.map((edge) => edge.target));
  const start = nodes.find((node) => !incoming.has(node.id)) ?? nodes[0];
  if (!start) return [];
  const chain = [start];
  const seen = new Set([start.id]);
  let current = start.id;
  while (true) {
    const next = edges.find((edge) => edge.source === current && !seen.has(edge.target));
    const node = next ? nodes.find((item) => item.id === next.target) : undefined;
    if (!node) break;
    chain.push(node);
    seen.add(node.id);
    current = node.id;
  }
  return chain;
}

export function sourceBreakdown(hole: RabbitHole) {
  const counts = new Map<string, number>();
  for (const page of hole.pages) counts.set(page.kind, (counts.get(page.kind) ?? 0) + page.dwellSeconds);
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0) || 1;
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value, pct: Math.round((value / total) * 100) }))
    .sort((a, b) => b.value - a.value);
}

export function topicBreakdown(hole: RabbitHole) {
  const total = hole.entities.reduce((sum, entity) => sum + entity.mentions, 0) || 1;
  return [...hole.entities]
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 5)
    .map((entity) => ({ label: entity.name, value: entity.mentions, pct: Math.round((entity.mentions / total) * 100) }));
}

export function activityBreakdown(hole: RabbitHole) {
  const active = hole.pages.reduce((sum, page) => sum + page.dwellSeconds, 0);
  const searches = hole.searches.length * 90;
  const switching = Math.max(hole.pages.length - 1, 1) * 45;
  const total = active + searches + switching;
  return [
    { label: "Reading", value: active, pct: Math.round((active / total) * 100) },
    { label: "Searching", value: searches, pct: Math.round((searches / total) * 100) },
    { label: "Following leads", value: switching, pct: Math.round((switching / total) * 100) },
  ];
}

export function heatmapDays(holes: RabbitHole[]) {
  const days = new Map<string, { date: Date; holes: Set<string>; minutes: number; topic: string }>();
  for (const hole of holes) {
    for (const page of hole.pages) {
      const date = new Date(page.visitedAt);
      const key = date.toISOString().slice(0, 10);
      const current = days.get(key) ?? { date, holes: new Set<string>(), minutes: 0, topic: hole.title };
      current.holes.add(hole.title);
      current.minutes += page.dwellSeconds > 0 ? Math.max(1, Math.round(page.dwellSeconds / 60)) : 2;
      current.topic = hole.title;
      days.set(key, current);
    }
  }
  return [...days.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}
