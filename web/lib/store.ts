import { create } from "zustand";
import type { RabbitHole } from "./types";

export interface Discovery {
  id: string;
  title: string;
  accent: RabbitHole["accent"];
  pages: number;
  searches: number;
}

interface AppState {
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  togglePalette: () => void;

  liveHoles: RabbitHole[];
  setLiveHoles: (holes: RabbitHole[]) => void;
  updateHole: (id: string, patch: Partial<RabbitHole>) => void;
  deleteHole: (id: string) => void;
  patchHoles: (ids: string[], patch: Partial<RabbitHole>) => void;
  deleteHoles: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;

  discovery: Discovery | null;
  triggerDiscovery: (d: Discovery) => void;
  clearDiscovery: () => void;
}

const LIVE_HOLES_KEY = "rabbit-hole-live-holes";

function readLiveHoles(): RabbitHole[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIVE_HOLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLiveHoles(holes: RabbitHole[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIVE_HOLES_KEY, JSON.stringify(holes));
}

export const useApp = create<AppState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),

  liveHoles: readLiveHoles(),
  setLiveHoles: (holes) => {
    writeLiveHoles(holes);
    set({ liveHoles: holes });
  },
  updateHole: (id, patch) => set((s) => {
    const holes = s.liveHoles.map((h) => (h.id === id ? { ...h, ...patch } : h));
    writeLiveHoles(holes);
    return { liveHoles: holes };
  }),
  deleteHole: (id) => set((s) => {
    const holes = s.liveHoles.filter((h) => h.id !== id);
    writeLiveHoles(holes);
    return { liveHoles: holes };
  }),
  patchHoles: (ids, patch) => set((s) => {
    const selected = new Set(ids);
    const holes = s.liveHoles.map((h) => (selected.has(h.id) ? { ...h, ...patch } : h));
    writeLiveHoles(holes);
    return { liveHoles: holes };
  }),
  deleteHoles: (ids) => set((s) => {
    const selected = new Set(ids);
    const holes = s.liveHoles.filter((h) => !selected.has(h.id));
    writeLiveHoles(holes);
    return { liveHoles: holes };
  }),
  toggleFavorite: (id) => set((s) => {
    const holes = s.liveHoles.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h));
    writeLiveHoles(holes);
    return { liveHoles: holes };
  }),
  toggleArchive: (id) => set((s) => {
    const holes = s.liveHoles.map((h) => (h.id === id ? { ...h, archived: !h.archived, status: h.archived ? ("active" as const) : ("dormant" as const) } : h));
    writeLiveHoles(holes);
    return { liveHoles: holes };
  }),

  discovery: null,
  triggerDiscovery: (d) => set({ discovery: d, paletteOpen: false }),
  clearDiscovery: () => set({ discovery: null }),
}));
