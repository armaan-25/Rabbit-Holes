import type { RabbitHole } from "./types";

/**
 * Seed rabbit holes for demos and visual fixtures. Real investigations in the
 * staging pivot come from extension-local browser storage.
 */

const aiSystems: RabbitHole = {
  id: "ai-systems",
  title: "AI Systems",
  description:
    "Inference serving for LLMs — how vLLM, paged attention, and disaggregated prefill push tokens/sec without melting latency.",
  status: "active",
  confidence: 0.94,
  accent: "rabbit",
  createdAt: "2026-06-15T09:42:00Z",
  lastActive: "2026-06-17T20:05:00Z",
  domains: ["github.com", "docs.vllm.ai", "arxiv.org", "lmsys.org", "pytorch.org"],
  searches: [
    { id: "s1", query: "vLLM", engine: "Google", searchedAt: "2026-06-17T18:14:00Z" },
    { id: "s2", query: "PagedAttention", engine: "Google", searchedAt: "2026-06-17T18:31:00Z" },
    { id: "s3", query: "DistServe disaggregated prefill", engine: "Google", searchedAt: "2026-06-17T19:02:00Z" },
    { id: "s4", query: "queueing theory tail latency", engine: "Google", searchedAt: "2026-06-17T19:48:00Z" },
    { id: "s5", query: "SGLang radix attention", engine: "Google", searchedAt: "2026-06-17T20:00:00Z" },
  ],
  pages: [
    { id: "p1", title: "vLLM — Easy, fast, and cheap LLM serving", url: "https://github.com/vllm-project/vllm", domain: "github.com", kind: "repo", visitedAt: "2026-06-17T18:14:30Z", dwellSeconds: 420, openedFrom: "s1" },
    { id: "p2", title: "vLLM Documentation — Quickstart", url: "https://docs.vllm.ai/en/latest/", domain: "docs.vllm.ai", kind: "doc", visitedAt: "2026-06-17T18:22:00Z", dwellSeconds: 640, openedFrom: "p1" },
    { id: "p3", title: "Efficient Memory Management for LLM Serving with PagedAttention", url: "https://arxiv.org/abs/2309.06180", domain: "arxiv.org", kind: "paper", visitedAt: "2026-06-17T18:31:30Z", dwellSeconds: 980, openedFrom: "s2" },
    { id: "p4", title: "DistServe: Disaggregating Prefill and Decoding", url: "https://arxiv.org/abs/2401.09670", domain: "arxiv.org", kind: "paper", visitedAt: "2026-06-17T19:02:30Z", dwellSeconds: 1240, openedFrom: "s3" },
    { id: "p5", title: "FlashAttention — Fast and Memory-Efficient Exact Attention", url: "https://github.com/Dao-AILab/flash-attention", domain: "github.com", kind: "repo", visitedAt: "2026-06-17T19:25:00Z", dwellSeconds: 360, openedFrom: "p3" },
    { id: "p6", title: "Queueing theory and tail latency in serving systems", url: "https://en.wikipedia.org/wiki/Queueing_theory", domain: "wikipedia.org", kind: "website", visitedAt: "2026-06-17T19:48:30Z", dwellSeconds: 520, openedFrom: "s4" },
    { id: "p7", title: "SGLang: Efficient Execution of Structured LM Programs", url: "https://github.com/sgl-project/sglang", domain: "github.com", kind: "repo", visitedAt: "2026-06-17T20:00:30Z", dwellSeconds: 300, openedFrom: "s5" },
    { id: "p8", title: "How continuous batching enables 23x throughput", url: "https://www.anyscale.com/blog/continuous-batching-llm-inference", domain: "anyscale.com", kind: "website", visitedAt: "2026-06-17T18:40:00Z", dwellSeconds: 410, openedFrom: "p2" },
  ],
  entities: [
    { id: "e1", name: "PagedAttention", kind: "concept", mentions: 14 },
    { id: "e2", name: "Continuous batching", kind: "concept", mentions: 9 },
    { id: "e3", name: "Disaggregated prefill", kind: "concept", mentions: 7 },
    { id: "e4", name: "vllm-project/vllm", kind: "repo", mentions: 11 },
    { id: "e5", name: "DistServe", kind: "paper", mentions: 6 },
    { id: "e6", name: "FlashAttention", kind: "repo", mentions: 5 },
    { id: "e7", name: "LMSYS", kind: "company", mentions: 4 },
    { id: "e8", name: "Woosuk Kwon", kind: "person", mentions: 3 },
  ],
  graph: {
    nodes: [
      { id: "s1", label: "Search: vLLM", kind: "search", x: 0.08, y: 0.5 },
      { id: "p1", label: "vllm repo", kind: "repo", x: 0.28, y: 0.32 },
      { id: "p2", label: "vLLM docs", kind: "doc", x: 0.28, y: 0.68 },
      { id: "p8", label: "Continuous batching", kind: "website", x: 0.46, y: 0.84 },
      { id: "s2", label: "Search: PagedAttention", kind: "search", x: 0.46, y: 0.18 },
      { id: "p3", label: "PagedAttention paper", kind: "paper", x: 0.62, y: 0.34 },
      { id: "p5", label: "FlashAttention", kind: "repo", x: 0.78, y: 0.16 },
      { id: "s3", label: "Search: DistServe", kind: "search", x: 0.66, y: 0.62 },
      { id: "p4", label: "DistServe paper", kind: "paper", x: 0.82, y: 0.5 },
      { id: "s4", label: "Search: queueing theory", kind: "search", x: 0.7, y: 0.86 },
      { id: "p6", label: "Queueing theory", kind: "website", x: 0.9, y: 0.78 },
      { id: "s5", label: "Search: SGLang", kind: "search", x: 0.94, y: 0.34 },
      { id: "p7", label: "SGLang", kind: "repo", x: 0.98, y: 0.56 },
    ],
    edges: [
      { id: "g1", source: "s1", target: "p1", kind: "searched_from" },
      { id: "g2", source: "s1", target: "p2", kind: "searched_from" },
      { id: "g3", source: "p1", target: "p2", kind: "clicked_from" },
      { id: "g4", source: "p2", target: "p8", kind: "clicked_from" },
      { id: "g5", source: "p1", target: "s2", kind: "searched_from" },
      { id: "g6", source: "s2", target: "p3", kind: "searched_from" },
      { id: "g7", source: "p3", target: "p5", kind: "discovered_through" },
      { id: "g8", source: "p3", target: "s3", kind: "searched_from" },
      { id: "g9", source: "s3", target: "p4", kind: "searched_from" },
      { id: "g10", source: "p4", target: "s4", kind: "searched_from" },
      { id: "g11", source: "s4", target: "p6", kind: "searched_from" },
      { id: "g12", source: "p4", target: "s5", kind: "searched_from" },
      { id: "g13", source: "s5", target: "p7", kind: "searched_from" },
    ],
  },
  timeline: [
    { id: "t1", at: "2026-06-17T18:14:00Z", kind: "search", title: "Searched “vLLM”", detail: "Google" },
    { id: "t2", at: "2026-06-17T18:14:30Z", kind: "repo", title: "Opened vllm-project/vllm", detail: "github.com" },
    { id: "t3", at: "2026-06-17T18:22:00Z", kind: "doc", title: "Read vLLM Quickstart", detail: "7m active" },
    { id: "t4", at: "2026-06-17T18:31:00Z", kind: "search", title: "Searched “PagedAttention”" },
    { id: "t5", at: "2026-06-17T18:31:30Z", kind: "paper", title: "Read PagedAttention paper", detail: "16m active" },
    { id: "t6", at: "2026-06-17T19:02:00Z", kind: "search", title: "Searched “DistServe disaggregated prefill”" },
    { id: "t7", at: "2026-06-17T19:02:30Z", kind: "paper", title: "Found DistServe", detail: "20m active" },
    { id: "t8", at: "2026-06-17T19:48:00Z", kind: "search", title: "Searched “queueing theory tail latency”" },
    { id: "t9", at: "2026-06-17T20:00:00Z", kind: "repo", title: "Opened SGLang", detail: "still open" },
  ],
  summary: {
    topics: ["LLM inference serving", "KV-cache memory management", "Prefill/decode disaggregation", "Tail latency"],
    repos: ["vllm-project/vllm", "Dao-AILab/flash-attention", "sgl-project/sglang"],
    companies: ["LMSYS", "Anyscale"],
    questions: [
      "How does PagedAttention reduce KV-cache fragmentation?",
      "When does disaggregating prefill from decode actually win?",
      "What sets the tail latency floor under continuous batching?",
    ],
    links: [
      { label: "PagedAttention paper", url: "https://arxiv.org/abs/2309.06180" },
      { label: "DistServe paper", url: "https://arxiv.org/abs/2401.09670" },
      { label: "vLLM docs", url: "https://docs.vllm.ai/en/latest/" },
    ],
  },
};

const startupResearch: RabbitHole = {
  id: "startup-research",
  title: "Startup Research",
  description:
    "Mapping the AI-native productivity space — who's building memory layers, what they charge, and where the moats actually are.",
  status: "active",
  confidence: 0.81,
  accent: "iris",
  createdAt: "2026-06-14T15:10:00Z",
  lastActive: "2026-06-16T22:30:00Z",
  domains: ["news.ycombinator.com", "crunchbase.com", "linear.app", "granola.ai", "cosmos.so"],
  searches: [
    { id: "s1", query: "AI memory layer startups", engine: "Google", searchedAt: "2026-06-16T20:05:00Z" },
    { id: "s2", query: "Granola pricing", engine: "Google", searchedAt: "2026-06-16T20:40:00Z" },
    { id: "s3", query: "Linear funding round", engine: "Google", searchedAt: "2026-06-16T21:15:00Z" },
  ],
  pages: [
    { id: "p1", title: "Granola — The AI notepad for meetings", url: "https://www.granola.ai", domain: "granola.ai", kind: "website", visitedAt: "2026-06-16T20:05:30Z", dwellSeconds: 360, openedFrom: "s1" },
    { id: "p2", title: "Cosmos — A home for your visual inspiration", url: "https://www.cosmos.so", domain: "cosmos.so", kind: "website", visitedAt: "2026-06-16T20:20:00Z", dwellSeconds: 280, openedFrom: "p1" },
    { id: "p3", title: "Linear — Plan and build products", url: "https://linear.app", domain: "linear.app", kind: "website", visitedAt: "2026-06-16T21:15:30Z", dwellSeconds: 300, openedFrom: "s3" },
    { id: "p4", title: "Ask HN: Who is building AI memory infrastructure?", url: "https://news.ycombinator.com/item?id=40000000", domain: "news.ycombinator.com", kind: "website", visitedAt: "2026-06-16T20:50:00Z", dwellSeconds: 520, openedFrom: "s1" },
  ],
  entities: [
    { id: "e1", name: "Granola", kind: "company", mentions: 8 },
    { id: "e2", name: "Linear", kind: "company", mentions: 6 },
    { id: "e3", name: "Cosmos", kind: "company", mentions: 5 },
    { id: "e4", name: "Memory layer", kind: "concept", mentions: 7 },
    { id: "e5", name: "Notion", kind: "company", mentions: 3 },
    { id: "e6", name: "Mem", kind: "company", mentions: 3 },
    { id: "e7", name: "Rewind", kind: "company", mentions: 2 },
  ],
  graph: {
    nodes: [
      { id: "s1", label: "Search: AI memory layer", kind: "search", x: 0.1, y: 0.5 },
      { id: "p1", label: "Granola", kind: "website", x: 0.34, y: 0.3 },
      { id: "p4", label: "HN thread", kind: "website", x: 0.34, y: 0.72 },
      { id: "p2", label: "Cosmos", kind: "website", x: 0.58, y: 0.22 },
      { id: "s3", label: "Search: Linear funding", kind: "search", x: 0.6, y: 0.66 },
      { id: "p3", label: "Linear", kind: "website", x: 0.86, y: 0.5 },
    ],
    edges: [
      { id: "g1", source: "s1", target: "p1", kind: "searched_from" },
      { id: "g2", source: "s1", target: "p4", kind: "searched_from" },
      { id: "g3", source: "p1", target: "p2", kind: "discovered_through" },
      { id: "g4", source: "p4", target: "s3", kind: "searched_from" },
      { id: "g5", source: "s3", target: "p3", kind: "searched_from" },
    ],
  },
  timeline: [
    { id: "t1", at: "2026-06-16T20:05:00Z", kind: "search", title: "Searched “AI memory layer startups”" },
    { id: "t2", at: "2026-06-16T20:05:30Z", kind: "website", title: "Opened Granola", detail: "6m active" },
    { id: "t3", at: "2026-06-16T20:20:00Z", kind: "website", title: "Discovered Cosmos" },
    { id: "t4", at: "2026-06-16T20:50:00Z", kind: "website", title: "Read HN thread", detail: "9m active" },
    { id: "t5", at: "2026-06-16T21:15:00Z", kind: "search", title: "Searched “Linear funding round”" },
  ],
  summary: {
    topics: ["AI-native productivity", "Memory infrastructure", "Design-led tools"],
    repos: [],
    companies: ["Granola", "Linear", "Cosmos", "Notion", "Mem", "Rewind"],
    questions: [
      "Is the moat the model or the captured context?",
      "What's the pricing ceiling for prosumer AI tools?",
    ],
    links: [
      { label: "Granola", url: "https://www.granola.ai" },
      { label: "Cosmos", url: "https://www.cosmos.so" },
    ],
  },
};

const quantRecruiting: RabbitHole = {
  id: "quant-recruiting",
  title: "Quant Recruiting",
  description:
    "Comparing systematic trading shops — comp bands, interview loops, and which desks actually let new grads touch alpha.",
  status: "dormant",
  confidence: 0.76,
  accent: "moss",
  createdAt: "2026-06-10T12:00:00Z",
  lastActive: "2026-06-13T16:45:00Z",
  domains: ["janestreet.com", "citadel.com", "hudsonrivertrading.com", "levels.fyi", "glassdoor.com"],
  searches: [
    { id: "s1", query: "Jane Street quant trader new grad comp", engine: "Google", searchedAt: "2026-06-13T15:00:00Z" },
    { id: "s2", query: "HRT vs Citadel interview", engine: "Google", searchedAt: "2026-06-13T15:40:00Z" },
  ],
  pages: [
    { id: "p1", title: "Jane Street — Quantitative Trader", url: "https://www.janestreet.com/join-jane-street/", domain: "janestreet.com", kind: "website", visitedAt: "2026-06-13T15:00:30Z", dwellSeconds: 300, openedFrom: "s1" },
    { id: "p2", title: "Hudson River Trading — Algorithm Developer", url: "https://www.hudsonrivertrading.com/careers/", domain: "hudsonrivertrading.com", kind: "website", visitedAt: "2026-06-13T15:40:30Z", dwellSeconds: 260, openedFrom: "s2" },
    { id: "p3", title: "Levels.fyi — Quant comp data", url: "https://www.levels.fyi", domain: "levels.fyi", kind: "website", visitedAt: "2026-06-13T15:20:00Z", dwellSeconds: 340, openedFrom: "p1" },
  ],
  entities: [
    { id: "e1", name: "Jane Street", kind: "company", mentions: 9 },
    { id: "e2", name: "Citadel", kind: "company", mentions: 6 },
    { id: "e3", name: "Hudson River Trading", kind: "company", mentions: 5 },
    { id: "e4", name: "Two Sigma", kind: "company", mentions: 3 },
    { id: "e5", name: "Market making", kind: "concept", mentions: 4 },
  ],
  graph: {
    nodes: [
      { id: "s1", label: "Search: Jane Street comp", kind: "search", x: 0.12, y: 0.4 },
      { id: "p1", label: "Jane Street", kind: "website", x: 0.4, y: 0.28 },
      { id: "p3", label: "Levels.fyi", kind: "website", x: 0.66, y: 0.5 },
      { id: "s2", label: "Search: HRT vs Citadel", kind: "search", x: 0.4, y: 0.74 },
      { id: "p2", label: "HRT careers", kind: "website", x: 0.78, y: 0.78 },
    ],
    edges: [
      { id: "g1", source: "s1", target: "p1", kind: "searched_from" },
      { id: "g2", source: "p1", target: "p3", kind: "clicked_from" },
      { id: "g3", source: "p1", target: "s2", kind: "searched_from" },
      { id: "g4", source: "s2", target: "p2", kind: "searched_from" },
    ],
  },
  timeline: [
    { id: "t1", at: "2026-06-13T15:00:00Z", kind: "search", title: "Searched “Jane Street new grad comp”" },
    { id: "t2", at: "2026-06-13T15:00:30Z", kind: "website", title: "Opened Jane Street careers" },
    { id: "t3", at: "2026-06-13T15:20:00Z", kind: "website", title: "Checked Levels.fyi" },
    { id: "t4", at: "2026-06-13T15:40:00Z", kind: "search", title: "Searched “HRT vs Citadel interview”" },
  ],
  summary: {
    topics: ["Systematic trading", "New-grad compensation", "Interview loops"],
    repos: [],
    companies: ["Jane Street", "Citadel", "Hudson River Trading", "Two Sigma"],
    questions: [
      "Which desks let new grads own a signal?",
      "How wide is the comp spread across shops?",
    ],
    links: [
      { label: "Jane Street careers", url: "https://www.janestreet.com/join-jane-street/" },
      { label: "Levels.fyi", url: "https://www.levels.fyi" },
    ],
  },
};

export const RABBIT_HOLES: RabbitHole[] = [aiSystems, startupResearch, quantRecruiting];

export function getHole(id: string): RabbitHole | undefined {
  return RABBIT_HOLES.find((h) => h.id === id);
}
