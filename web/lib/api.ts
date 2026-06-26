import type { RabbitHole } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-production-4e5a6.up.railway.app";

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
  if (error.status === 401 || error.status === 403) return `Sign in again to ${action}.`;
  if (error.status === 429) return `Rabbit Holes is rate limited right now. Wait a bit, then try again.`;
  if (error.status && error.status >= 500) return `The backend is reachable, but ${action} failed inside the service. Try again after the backend redeploy finishes.`;
  if (typeof error.status === "number") return `Could not ${action}. The backend returned ${error.status}.`;
  return `Could not reach the Rabbit Holes backend. Check the deployment, then try again.`;
}

async function apiErrorFromResponse(res: Response, label: string): Promise<ApiError> {
  let detail: unknown = null;
  try {
    detail = await res.json();
  } catch {
    detail = await res.text().catch(() => null);
  }
  return new ApiError(`${label} failed: ${res.status}`, res.status, detail);
}

async function authHeaders(extra: HeadersInit = {}): Promise<HeadersInit> {
  if (typeof window === "undefined") return extra;
  const { supabase } = await import("@/lib/supabase/client");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

/** The compact context the backend AI endpoints consume for one rabbit hole. */
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
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/ask`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ hole: holeContext(hole), question, history }),
    });
  } catch (error) {
    throw new ApiError("Could not reach the Rabbit Holes backend.", undefined, error);
  }
  if (!res.ok) throw await apiErrorFromResponse(res, "ask");
  return res.json();
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
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/synthesize`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ hole: holeContext(hole) }),
    });
  } catch (error) {
    throw new ApiError("Could not reach the Rabbit Holes backend.", undefined, error);
  }
  if (!res.ok) throw await apiErrorFromResponse(res, "synthesize");
  return res.json();
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
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/export`, { headers: await authHeaders() });
  } catch (error) {
    throw new ApiError("Could not reach the Rabbit Holes backend.", undefined, error);
  }
  if (res.status === 401) return null;
  if (!res.ok) throw await apiErrorFromResponse(res, "export");
  return res.json();
}

export async function clearBackendData(): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/clear`, { method: "POST", headers: await authHeaders({ "Content-Type": "application/json" }) });
  } catch (error) {
    throw new ApiError("Could not reach the Rabbit Holes backend.", undefined, error);
  }
  if (res.status === 401) return;
  if (!res.ok) throw await apiErrorFromResponse(res, "clear data");
}

export type HolePatch = {
  favorite?: boolean;
  archived?: boolean;
  deleted?: boolean;
};

export async function patchBackendHole(id: string, patch: HolePatch): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/holes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(patch),
    });
  } catch (error) {
    throw new ApiError("Could not reach the Rabbit Holes backend.", undefined, error);
  }
  if (res.status === 401) return;
  if (!res.ok) throw await apiErrorFromResponse(res, "update hole");
}

export async function bulkPatchBackendHoles(ids: string[], action: "favorite" | "unfavorite" | "archive" | "restore" | "delete"): Promise<void> {
  if (!ids.length) return;
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/holes/bulk`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ids, action }),
    });
  } catch (error) {
    throw new ApiError("Could not reach the Rabbit Holes backend.", undefined, error);
  }
  if (res.status === 401) return;
  if (!res.ok) throw await apiErrorFromResponse(res, "update holes");
}
