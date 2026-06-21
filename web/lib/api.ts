import type { RabbitHole } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
  const res = await fetch(`${BACKEND_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hole: holeContext(hole), question, history }),
  });
  if (!res.ok) throw new Error(`ask failed: ${res.status}`);
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
  const res = await fetch(`${BACKEND_URL}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hole: holeContext(hole) }),
  });
  if (!res.ok) throw new Error(`synthesize failed: ${res.status}`);
  return res.json();
}
