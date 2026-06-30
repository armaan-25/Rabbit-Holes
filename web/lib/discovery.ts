import type { RabbitHole } from "./types";
import type { Discovery } from "./store";
import { RABBIT_HOLES } from "./data";
import { generateJson } from "./ai-provider";

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

export class ClusterError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ClusterError";
  }
}
const ACCENTS: RabbitHole["accent"][] = ["rabbit", "iris", "moss", "sky"];
export const discoveredHoleIds = new Set<string>(RABBIT_HOLES.map((h) => h.id));
const LAST_CLUSTER_SIGNATURE_KEY = "rabbit-hole-last-cluster-signature";

interface CapturedEvent {
  type: "visit" | "search" | "title" | "tab_open" | "tab_close" | string;
  sessionId?: string;
  tabId?: number;
  url?: string | null;
  domain?: string | null;
  title?: string | null;
  query?: string | null;
  engine?: string | null;
  at?: string | null;
  referrer?: string | null;
}

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

function canonicalUrl(url?: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm_") || ["fbclid", "gclid", "mc_cid", "mc_eid", "igshid", "ref", "source"].includes(lower)) {
        u.searchParams.delete(key);
      }
    }
    u.hostname = u.hostname.replace(/^www\./, "");
    return u.toString().replace(/\/$/, "");
  } catch {
    return String(url).split("#")[0];
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

function normalizeSearchQuery(query?: string | null): string {
  return (query ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

function titleWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !["www", "com", "org", "net", "the", "and", "for", "with", "from", "this", "that", "into", "about", "google", "search"].includes(word));
}

function dedupeSearches(searches: CapturedSearch[]): CapturedSearch[] {
  const seen = new Set<string>();
  const sorted = [...searches].sort((a, b) => +new Date(a.at || 0) - +new Date(b.at || 0));
  const cleaned: CapturedSearch[] = [];
  for (const search of sorted) {
    const query = normalizeSearchQuery(search.query || search.url);
    if (!query) continue;
    const key = `${(search.engine ?? "").toLowerCase().trim()}:${query}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(search);
  }
  return cleaned;
}

function readExtensionEvents(timeoutMs = 1200): Promise<CapturedEvent[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve([]);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== "rabbit-holes:events" || event.data.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(Array.isArray(event.data.events) ? event.data.events : []);
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "rabbit-holes:get-events", requestId }, window.location.origin);
  });
}

function eventsToCaptured(events: CapturedEvent[]): { pages: CapturedPage[]; searches: CapturedSearch[] } {
  const titlesByUrl = new Map<string, string>();
  for (const event of events) {
    if (event.type === "title" && event.url && event.title) titlesByUrl.set(canonicalUrl(event.url), event.title);
  }

  const pagesByUrl = new Map<string, CapturedPage>();
  const searchesByKey = new Map<string, CapturedSearch>();
  for (const event of events) {
    if (event.type === "visit" && event.url) {
      const url = canonicalUrl(event.url);
      if (!url || pagesByUrl.has(url)) continue;
      pagesByUrl.set(url, {
        id: `p${pagesByUrl.size + 1}`,
        url,
        domain: event.domain || hostnameOf(url),
        title: titlesByUrl.get(url) || event.title || hostnameOf(url) || url,
        at: event.at || new Date().toISOString(),
        referrer: event.referrer || null,
      });
    }
    if (event.type === "search" && (event.query || event.url)) {
      const query = normalizeSearchQuery(event.query || event.url);
      if (!query || searchesByKey.has(query)) continue;
      searchesByKey.set(query, {
        id: `s${searchesByKey.size + 1}`,
        query: event.query || query,
        engine: event.engine || "Search",
        url: event.url || null,
        at: event.at || new Date().toISOString(),
      });
    }
  }
  return { pages: Array.from(pagesByUrl.values()), searches: Array.from(searchesByKey.values()) };
}

function buildLocalHole(pages: CapturedPage[], searches: CapturedSearch[], titleHint?: string): ClusterHole | null {
  if (pages.length < 3 && searches.length < 1) return null;
  const text = [
    ...searches.map((s) => s.query || ""),
    ...pages.map((p) => `${p.title || ""} ${p.domain || ""}`),
  ].join(" ");
  const words = titleWords(text);
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
  const topics = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  const domains = [...new Set(pages.map((p) => p.domain || hostnameOf(p.url)).filter(Boolean))];
  const firstQuery = titleHint || searches[0]?.query?.trim();
  const title = firstQuery
    ? firstQuery.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 52)
    : topics.length
      ? `${topics[0].replace(/\b\w/g, (c) => c.toUpperCase())} Research`
      : "Current Investigation";
  const questions = firstQuery
    ? [`What did I learn about ${firstQuery}?`, `What should I read next?`]
    : [`What connects these ${pages.length} pages?`, "Where should I continue?"];
  const entities: ClusterEntity[] = [
    ...domains.slice(0, 5).map((domain, i) => ({ id: `domain-${i + 1}`, name: domain, kind: domain.includes("github") ? "repo" as const : "tool" as const, mentions: pages.filter((p) => (p.domain || "").includes(domain)).length || 1 })),
    ...topics.slice(0, 5).map((topic, i) => ({ id: `topic-${i + 1}`, name: topic, kind: "concept" as const, mentions: counts.get(topic) || 1 })),
  ];
  return {
    client_id: buildHoleId(title, pages.map((p) => p.id)),
    title,
    description: `A local investigation built from ${pages.length} pages and ${searches.length} searches in this browser.`,
    topics: topics.length ? topics : domains.slice(0, 4),
    questions,
    entities,
    page_ids: pages.map((p) => p.id),
    confidence: Math.min(0.95, 0.58 + Math.min(pages.length, 12) * 0.025 + Math.min(searches.length, 6) * 0.025),
  };
}

function buildLocalHoles(pages: CapturedPage[], searches: CapturedSearch[]): ClusterHole[] {
  const cleanSearches = dedupeSearches(searches);
  if (pages.length < 3 && cleanSearches.length < 1) return [];
  if (cleanSearches.length <= 1 || pages.length < 6) {
    const hole = buildLocalHole(pages, cleanSearches);
    return hole ? [hole] : [];
  }

  const sortedPages = [...pages].sort((a, b) => +new Date(a.at || 0) - +new Date(b.at || 0));
  const sortedSearches = [...cleanSearches].sort((a, b) => +new Date(a.at || 0) - +new Date(b.at || 0));
  const groups = sortedSearches.map((search) => ({ search, pages: [] as CapturedPage[] }));

  for (const page of sortedPages) {
    const pageTime = +new Date(page.at || 0);
    let owner = 0;
    for (let i = 0; i < sortedSearches.length; i += 1) {
      const searchTime = +new Date(sortedSearches[i].at || 0);
      if (!Number.isNaN(pageTime) && !Number.isNaN(searchTime) && searchTime <= pageTime) owner = i;
    }
    groups[owner]?.pages.push(page);
  }

  const holes = groups
    .map((group) => buildLocalHole(group.pages, [group.search], group.search.query || undefined))
    .filter(Boolean) as ClusterHole[];

  if (holes.length) return holes.slice(0, 6);
  const fallback = buildLocalHole(pages, cleanSearches);
  return fallback ? [fallback] : [];
}

type ProviderCluster = {
  holes?: Array<{
    title?: string;
    description?: string;
    topics?: string[];
    questions?: string[];
    entities?: Array<Partial<ClusterEntity> & { name?: string }>;
    page_ids?: string[];
    confidence?: number;
  }>;
};

async function buildProviderHoles(pages: CapturedPage[], searches: CapturedSearch[]): Promise<ClusterHole[] | null> {
  if (pages.length < 3 && searches.length < 1) return null;
  const pageIds = new Set(pages.map((page) => page.id));
  const payload = {
    searches: dedupeSearches(searches).slice(0, 20),
    pages: pages.slice(0, 80).map((page) => ({
      id: page.id,
      title: page.title,
      domain: page.domain,
      url: page.url,
      at: page.at,
      referrer: page.referrer,
    })),
  };
  const generated = await generateJson<ProviderCluster>(
    `Cluster this browser session into one or more rabbit holes.

Captured session:
${JSON.stringify(payload, null, 2)}

Rules:
- Return only clusters that represent a coherent investigation.
- Prefer 1-4 high quality clusters over many tiny clusters.
- Use only page ids that appear above.
- Do not include repeated duplicate topics.
- Titles should be short and human, not generic.

Return JSON:
{
  "holes": [
    {
      "title": "AI Systems",
      "description": "What this investigation was trying to understand.",
      "topics": ["topic"],
      "questions": ["question"],
      "entities": [{"id":"entity-1","name":"vLLM","kind":"repo","mentions":2}],
      "page_ids": ["p1"],
      "confidence": 0.86
    }
  ]
}`,
    { temperature: 0.15, maxTokens: 1600 },
  );
  const holes = generated?.holes;
  if (!Array.isArray(holes)) return null;

  const normalized = holes
    .map((hole, index): ClusterHole | null => {
      const ids = (hole.page_ids || []).filter((id) => pageIds.has(id));
      if (ids.length < 2) return null;
      const title = (hole.title || `Investigation ${index + 1}`).trim().slice(0, 64);
      const entities: ClusterEntity[] = (hole.entities || [])
        .filter((entity) => entity.name)
        .slice(0, 12)
        .map((entity, entityIndex) => ({
          id: entity.id || `entity-${index + 1}-${entityIndex + 1}`,
          name: String(entity.name),
          kind: (entity.kind as ClusterEntity["kind"]) || "concept",
          mentions: Number(entity.mentions || 1),
        }));
      return {
        client_id: buildHoleId(title, ids),
        title,
        description: hole.description || `A local investigation built from ${ids.length} captured pages.`,
        topics: Array.isArray(hole.topics) ? hole.topics.slice(0, 8) : [],
        questions: Array.isArray(hole.questions) ? hole.questions.slice(0, 5) : [],
        entities,
        page_ids: ids,
        confidence: Math.max(0.4, Math.min(0.98, Number(hole.confidence || 0.78))),
      };
    })
    .filter(Boolean) as ClusterHole[];

  return normalized.length ? normalized : null;
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
  const searchSource = capturedSearches.length ? dedupeSearches(capturedSearches) : hole.topics.map((topic, i) => ({ id: `s${i}`, query: topic, engine: "Captured", at: now }));
  const searches = searchSource.map((s, i) => ({
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
        at: s.searchedAt || now,
        kind: "search" as const,
        title: `Searched "${s.query}"`,
        detail: s.engine,
      })),
      ...pages.map((p, i) => ({
        id: `t-page-${i + 1}`,
        at: p.visitedAt || now,
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

export function unseenDiscoveries(holes: ClusterHole[], seen: Set<string> = discoveredHoleIds): Discovery[] {
  return holes.map((hole) => holeToDiscovery(hole)).filter((discovery) => !seen.has(discovery.id));
}

export function markDiscoverySeen(id: string, seen: Set<string> = discoveredHoleIds) {
  seen.add(id);
}

export function markDiscoveriesSeen(discoveries: Discovery[], seen: Set<string> = discoveredHoleIds) {
  discoveries.forEach((discovery) => seen.add(discovery.id));
}

export function markDiscoveryUnseen(id: string, seen: Set<string> = discoveredHoleIds) {
  seen.delete(id);
}

export function clusterSignature(cluster: ClusterResponse): string {
  const pages = (cluster.pages ?? []).map((p) => p.url || p.title || p.id).filter(Boolean).sort();
  const searches = (cluster.searches ?? []).map((s) => s.query || s.url || s.id).filter(Boolean).sort();
  return JSON.stringify({ pages, searches });
}

export function hasMeaningfulNewContext(cluster: ClusterResponse): boolean {
  return clusterBuildState(cluster) === "ready";
}

export type ClusterBuildState = "ready" | "empty" | "duplicate" | "unclear";

export function clusterBuildState(cluster: ClusterResponse): ClusterBuildState {
  const pages = cluster.pages?.length ?? 0;
  const searches = cluster.searches?.length ?? 0;
  const holes = cluster.holes?.length ?? 0;
  const signature = clusterSignature(cluster);
  const emptySignature = JSON.stringify({ pages: [], searches: [] });

  if (cluster.no_change) return pages || searches ? "duplicate" : "empty";
  if (signature === emptySignature) return "empty";
  if (typeof window !== "undefined" && window.localStorage.getItem(LAST_CLUSTER_SIGNATURE_KEY) === signature) return "duplicate";
  if (holes === 0) return pages >= 3 || searches >= 1 ? "unclear" : "empty";
  return "ready";
}

export function rememberClusterContext(cluster: ClusterResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_CLUSTER_SIGNATURE_KEY, clusterSignature(cluster));
}

export function forgetClusterContext() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LAST_CLUSTER_SIGNATURE_KEY);
}

export async function runCluster(): Promise<ClusterResponse> {
  const events = await readExtensionEvents();
  const { pages, searches } = eventsToCaptured(events);
  const holes = (await buildProviderHoles(pages, searches)) ?? buildLocalHoles(pages, searches);
  const response: ClusterResponse = {
    holes,
    pages,
    searches,
    source_signature: JSON.stringify({ pages: pages.map((p) => p.url), searches: searches.map((s) => s.query) }),
  };
  return response;
}
