export type HoleStatus = "active" | "completed" | "dormant";

export type NodeKind = "search" | "website" | "repo" | "paper" | "doc" | "video";

export type EdgeKind = "clicked_from" | "searched_from" | "discovered_through";

export type EntityKind =
  | "concept"
  | "company"
  | "person"
  | "repo"
  | "paper"
  | "tool";

export interface PageVisit {
  id: string;
  title: string;
  url: string;
  domain: string;
  kind: NodeKind;
  /** ISO timestamp of first visit */
  visitedAt: string;
  /** seconds of active dwell time */
  dwellSeconds: number;
  /** id of the node this was opened from, if any */
  openedFrom?: string;
  favicon?: string;
}

export interface Search {
  id: string;
  query: string;
  engine: string;
  searchedAt: string;
}

export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  mentions: number;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  /** normalized 0..1 layout hints */
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
}

export interface TimelineEvent {
  id: string;
  at: string;
  kind: NodeKind | "search";
  title: string;
  detail?: string;
}

export interface RabbitHole {
  id: string;
  title: string;
  description: string;
  status: HoleStatus;
  favorite?: boolean;
  archived?: boolean;
  /** 0..1 clustering confidence */
  confidence: number;
  accent: "rabbit" | "iris" | "moss" | "sky";
  createdAt: string;
  lastActive: string;
  searches: Search[];
  pages: PageVisit[];
  domains: string[];
  entities: Entity[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  timeline: TimelineEvent[];
  summary: {
    topics: string[];
    repos: string[];
    companies: string[];
    questions: string[];
    links: { label: string; url: string }[];
  };
}
