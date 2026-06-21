import type { NodeKind, EntityKind, EdgeKind, HoleStatus } from "./types";

export const ACCENTS: Record<string, { hex: string; soft: string; ring: string }> = {
  rabbit: { hex: "#c15c39", soft: "#e0865a", ring: "rgba(193,92,57,0.32)" },
  iris: { hex: "#8d7356", soft: "#c7ae84", ring: "rgba(141,115,86,0.28)" },
  moss: { hex: "#5f8a5c", soft: "#8fb384", ring: "rgba(95,138,92,0.28)" },
  sky: { hex: "#6f8f9f", soft: "#a9c0c7", ring: "rgba(111,143,159,0.28)" },
};

export const KIND_META: Record<NodeKind | "search", { label: string; color: string; glyph: string }> = {
  search: { label: "Search", color: "#a8895f", glyph: "⌕" },
  website: { label: "Site", color: "#6f8f9f", glyph: "◐" },
  repo: { label: "Repo", color: "#c15c39", glyph: "◇" },
  paper: { label: "Paper", color: "#8d7356", glyph: "▤" },
  doc: { label: "Doc", color: "#5f8a5c", glyph: "▢" },
  video: { label: "Video", color: "#b8795f", glyph: "▷" },
};

export const ENTITY_META: Record<EntityKind, { label: string; color: string }> = {
  concept: { label: "Concept", color: "#7c6cff" },
  company: { label: "Company", color: "#54b8ff" },
  person: { label: "Person", color: "#3fd29a" },
  repo: { label: "Repo", color: "#f0641e" },
  paper: { label: "Paper", color: "#a99dff" },
  tool: { label: "Tool", color: "#ff8a4c" },
};

export const EDGE_LABELS: Record<EdgeKind, string> = {
  clicked_from: "clicked from",
  searched_from: "searched from",
  discovered_through: "discovered through",
};

export const STATUS_META: Record<HoleStatus, { label: string; dot: string }> = {
  active: { label: "Active", dot: "#5f8a5c" },
  completed: { label: "Completed", dot: "#8d7356" },
  dormant: { label: "Dormant", dot: "#a8967d" },
};

export function faviconFor(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}
