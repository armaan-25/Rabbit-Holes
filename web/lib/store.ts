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

  discovery: null,
  triggerDiscovery: (d) => set({ discovery: d, paletteOpen: false }),
  clearDiscovery: () => set({ discovery: null }),
}));
