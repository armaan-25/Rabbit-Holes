import type { RabbitHole } from "./types";
import type { Discovery } from "./store";
import { RABBIT_HOLES } from "./data";

export interface ClusterEntity {
  id: string;
  name: string;
  kind: "concept" | "company" | "person" | "repo" | "paper" | "tool";
  mentions: number;
}

export interface ClusterHole {
  client_id?: string;
  title: string;
  description: string;
  topics: string[];
  questions: string[];
  entities: ClusterEntity[];
  page_ids: string[];
  confidence: number;
}

export interface CapturedPage {
  id: string;
  url?: string | null;
  domain?: string | null;
  title?: string | null;
  at?: string | null;
  referrer?: string | null;
}

export interface CapturedSearch {
  id: string;
  query?: string | null;
  engine?: string | null;
  url?: string | null;
  at?: string | null;
}

export interface ClusterResponse {
  holes: ClusterHole[];
  pages?: CapturedPage[];
  searches?: CapturedSearch[];
  no_change?: boolean;
  source_signature?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const ACCENTS: RabbitHole["accent"][] = ["rabbit", "iris", "moss", "sky"];
export const discoveredHoleIds = new Set<string>(RABBIT_HOLES.map((h) => h.id));
const LAST_CLUSTER_SIGNATURE_KEY = "rabbit-hole-last-cluster-signature";

export function buildHoleId(title: string, pageIds: string[] = []): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (pageIds[0]) return `${base}-${pageIds[0]}`;
  return base || `rabbit-hole-${Math.random().toString(36).slice(2, 8)}`;
}

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function pickAccent(seed: string): RabbitHole["accent"] {
  return ACCENTS[hash(seed) % ACCENTS.length];
}

export function holeToDiscovery(hole: ClusterHole): Discovery {
  const id = hole.client_id ?? buildHoleId(hole.title, hole.page_ids);
  return {
    id,
    title: hole.title,
    accent: pickAccent(id),
    pages: hole.page_ids.length,
    searches: hole.topics.length,
  };
}

function hostnameOf(url?: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pageKind(url?: string | null, title?: string | null): RabbitHole["pages"][number]["kind"] {
  const haystack = `${url ?? ""} ${title ?? ""}`.toLowerCase();
  if (haystack.includes("github.com")) return "repo";
  if (haystack.includes("arxiv.org") || haystack.includes("paper")) return "paper";
  if (haystack.includes("docs.") || haystack.includes("documentation")) return "doc";
  if (haystack.includes("youtube.com") || haystack.includes("youtu.be")) return "video";
  return "website";
}

export function clusterHoleToRabbitHole(hole: ClusterHole, capturedPages: CapturedPage[] = [], capturedSearches: CapturedSearch[] = []): RabbitHole {
  const id = hole.client_id ?? buildHoleId(hole.title, hole.page_ids);
  const now = new Date().toISOString();
  const capturedById = new Map(capturedPages.map((p) => [p.id, p]));
  const selectedPages = (hole.page_ids.length ? hole.page_ids : capturedPages.map((p) => p.id)).map((pid) => capturedById.get(pid)).filter(Boolean) as CapturedPage[];
  const pages = selectedPages.map((p, i) => ({
    id: p.id || `p${i}`,
    title: p.title || p.url || `Captured page ${i + 1}`,
    url: p.url || "#",
    domain: p.domain || hostnameOf(p.url) || "unknown",
    kind: pageKind(p.url, p.title),
    visitedAt: p.at || now,
    dwellSeconds: 0,
  }));
  const domains = Array.from(new Set(pages.map((p) => p.domain).filter((d) => d && d !== "unknown")));
  const searches = (capturedSearches.length ? capturedSearches : hole.topics.map((topic, i) => ({ id: `s${i}`, query: topic, engine: "Captured", at: now }))).map((s, i) => ({
    id: s.id || `s${i}`,
    query: s.query || hole.topics[i] || "Captured search",
    engine: s.engine || "Captured",
    searchedAt: s.at || now,
  }));

  return {
    id,
    title: hole.title,
    description: hole.description,
    status: "active",
    confidence: hole.confidence,
    accent: pickAccent(id),
    createdAt: now,
    lastActive: now,
    domains: domains.length ? domains : ["unknown"],
    searches,
    pages,
    entities: hole.entities,
    graph: {
      nodes: [
        ...searches.map((s, i) => ({
          id: s.id,
          label: `Search: ${s.query}`,
          kind: "search" as const,
          x: 0.12,
          y: searches.length <= 1 ? 0.5 : 0.2 + (i / Math.max(searches.length - 1, 1)) * 0.6,
        })),
        ...pages.map((p, i) => ({
          id: p.id,
          label: p.title,
          kind: "website" as const,
          x: pages.length <= 1 ? 0.62 : 0.36 + (i / Math.max(pages.length - 1, 1)) * 0.5,
          y: pages.length <= 1 ? 0.5 : 0.22 + (i / Math.max(pages.length - 1, 1)) * 0.56,
        })),
      ],
      edges: pages.map((p, i) => ({
        id: `g${i + 1}`,
        source: searches[i % Math.max(searches.length, 1)]?.id ?? p.id,
        target: p.id,
        kind: "searched_from" as const,
      })),
    },
    timeline: [
      ...searches.map((s, i) => ({
        id: `t-search-${i + 1}`,
        at: now,
        kind: "search" as const,
        title: `Searched "${s.query}"`,
        detail: s.engine,
      })),
      ...pages.map((p, i) => ({
        id: `t-page-${i + 1}`,
        at: now,
        kind: "website" as const,
        title: p.title,
        detail: p.domain,
      })),
    ],
    summary: {
      topics: hole.topics,
      repos: hole.entities.filter((e) => e.kind === "repo").map((e) => e.name),
      companies: hole.entities.filter((e) => e.kind === "company").map((e) => e.name),
      questions: hole.questions,
      links: [],
    },
  };
}

export function nextUnseenDiscovery(holes: ClusterHole[], seen: Set<string> = discoveredHoleIds): Discovery | null {
  for (const hole of holes) {
    const discovery = holeToDiscovery(hole);
    if (!seen.has(discovery.id)) return discovery;
  }
  return null;
}

export function markDiscoverySeen(id: string, seen: Set<string> = discoveredHoleIds) {
  seen.add(id);
}

export function clusterSignature(cluster: ClusterResponse): string {
  const pages = (cluster.pages ?? []).map((p) => p.url || p.title || p.id).filter(Boolean).sort();
  const searches = (cluster.searches ?? []).map((s) => s.query || s.url || s.id).filter(Boolean).sort();
  return JSON.stringify({ pages, searches });
}

export function hasMeaningfulNewContext(cluster: ClusterResponse): boolean {
  if (cluster.no_change) return false;
  if (typeof window === "undefined") return true;
  const signature = clusterSignature(cluster);
  if (signature === JSON.stringify({ pages: [], searches: [] })) return false;
  return window.localStorage.getItem(LAST_CLUSTER_SIGNATURE_KEY) !== signature;
}

export function rememberClusterContext(cluster: ClusterResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_CLUSTER_SIGNATURE_KEY, clusterSignature(cluster));
}

async function authHeaders(): Promise<HeadersInit> {
  if (typeof window === "undefined") return {};
  const { supabase } = await import("@/lib/supabase/client");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function runCluster(): Promise<ClusterResponse> {
  const res = await fetch(`${BACKEND_URL}/cluster`, { method: "POST", headers: await authHeaders() });
  if (!res.ok) {
    throw new Error(`cluster request failed: ${res.status}`);
  }
  const data = (await res.json()) as ClusterResponse;
  return { holes: data.holes ?? [], pages: data.pages ?? [], searches: data.searches ?? [], no_change: data.no_change, source_signature: data.source_signature };
}
