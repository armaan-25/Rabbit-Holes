import type { RabbitHole } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorMessage(error: unknown, action: string): string {
  if (!(error instanceof ApiError)) return `Could not ${action}. Try again in a moment.`;
  return `Could not ${action}. Check your local provider settings, then try again.`;
}

/** The compact context local/provider adapters consume for one rabbit hole. */
export function holeContext(hole: RabbitHole) {
  return {
    title: hole.title,
    description: hole.description,
    searches: hole.searches.map((s) => s.query),
    pages: hole.pages.map((p) => ({
      id: p.id,
      title: p.title,
      domain: p.domain,
      url: p.url,
      kind: p.kind,
    })),
    topics: hole.summary.topics,
    questions: hole.summary.questions,
  };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AskAnswer {
  answer: string;
  citations: string[];
}

export async function askHole(hole: RabbitHole, question: string, history: ChatTurn[]): Promise<AskAnswer> {
  const relevantPages = hole.pages.slice(0, 5);
  const citations = relevantPages.map((page) => page.url).filter(Boolean);
  const focus = hole.summary.topics.slice(0, 3).join(", ") || hole.title;
  const previous = history.length ? ` Based on the previous ${history.length} turns,` : "";
  return {
    answer: `${previous} this investigation is mostly about ${focus}. For "${question}", start with ${relevantPages[0]?.title || "the first captured page"} and compare it against ${relevantPages[1]?.title || "the next source"}. Configure a model provider in Settings when you want a generated answer instead of this local summary.`,
    citations,
  };
}

export interface ComparisonItem {
  title: string;
  points: string[];
}

export interface Brief {
  summary: string;
  comparison: ComparisonItem[];
  contradictions: string[];
  open_questions: string[];
  next_steps: string[];
}

export async function synthesizeHole(hole: RabbitHole): Promise<Brief> {
  const topics = hole.summary.topics.length ? hole.summary.topics : hole.domains;
  const pageTitles = hole.pages.slice(0, 4).map((p) => p.title);
  return {
    summary: `${hole.title} is a local investigation built from ${hole.pages.length} pages and ${hole.searches.length} searches. It appears to center on ${topics.slice(0, 3).join(", ") || "one browsing thread"}.`,
    comparison: pageTitles.length
      ? [{ title: "Main sources", points: pageTitles.map((title) => `Captured: ${title}`) }]
      : [],
    contradictions: [],
    open_questions: hole.summary.questions.length ? hole.summary.questions : ["What is the strongest next source?", "What changed your understanding?"],
    next_steps: [
      hole.summary.links[0]?.label ? `Return to ${hole.summary.links[0].label}.` : "Open the most relevant captured page.",
      "Configure a model provider in Settings for richer generated synthesis.",
    ],
  };
}

export function briefCacheKey(holeId: string): string {
  return `rabbit-hole-brief:${holeId}`;
}

export function readCachedBrief(holeId: string): Brief | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = window.localStorage.getItem(briefCacheKey(holeId));
    return cached ? (JSON.parse(cached) as Brief) : null;
  } catch {
    return null;
  }
}

export function writeCachedBrief(holeId: string, brief: Brief): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(briefCacheKey(holeId), JSON.stringify(brief));
  } catch {
    // Cache writes should never block the actual brief UI.
  }
}

export async function preGenerateHoleBrief(hole: RabbitHole): Promise<Brief | null> {
  const cached = readCachedBrief(hole.id);
  if (cached) return cached;
  try {
    const brief = await synthesizeHole(hole);
    writeCachedBrief(hole.id, brief);
    return brief;
  } catch (error) {
    console.error("brief pre-generation failed", error);
    return null;
  }
}

export async function preGenerateHoleBriefs(holes: RabbitHole[]): Promise<void> {
  for (const hole of holes) {
    await preGenerateHoleBrief(hole);
  }
}

export async function exportBackendData(): Promise<unknown | null> {
  if (typeof window === "undefined") return null;
  return {
    exportedAt: new Date().toISOString(),
    holes: JSON.parse(window.localStorage.getItem("rabbit-hole-live-holes") || "[]"),
    provider: JSON.parse(window.localStorage.getItem("rabbit-hole-ai-provider") || "null"),
  };
}

export async function clearBackendData(): Promise<void> {
  if (typeof window !== "undefined") window.localStorage.removeItem("rabbit-hole-live-holes");
}

export type HolePatch = {
  favorite?: boolean;
  archived?: boolean;
  deleted?: boolean;
};

export async function patchBackendHole(id: string, patch: HolePatch): Promise<void> {
  void id;
  void patch;
}

export async function bulkPatchBackendHoles(ids: string[], action: "favorite" | "unfavorite" | "archive" | "restore" | "delete"): Promise<void> {
  void ids;
  void action;
}
