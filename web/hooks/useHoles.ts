"use client";

import { RABBIT_HOLES, getHole as getSeedHole } from "@/lib/data";
import { useApp } from "@/lib/store";
import type { RabbitHole } from "@/lib/types";

/**
 * Holes to render. Local browser storage is the source of truth. Seed holes
 * remain available only as stable demo/detail fixtures.
 */
export function useHoles(): RabbitHole[] {
  const liveHoles = useApp((s) => s.liveHoles);
  if (liveHoles.length) return liveHoles.filter((h) => !h.archived);
  return [];
}

export function useLibraryHoles(): RabbitHole[] {
  const liveHoles = useApp((s) => s.liveHoles);
  if (liveHoles.length) return liveHoles;
  return [];
}

export function useHole(id: string): RabbitHole | undefined {
  const liveHoles = useApp((s) => s.liveHoles);
  return liveHoles.find((h) => h.id === id) ?? getSeedHole(id);
}
