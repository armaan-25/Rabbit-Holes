"use client";

import { RABBIT_HOLES, getHole as getSeedHole } from "@/lib/data";
import { useApp } from "@/lib/store";
import type { RabbitHole } from "@/lib/types";

export function useHoles(): RabbitHole[] {
  const liveHoles = useApp((s) => s.liveHoles);
  return liveHoles.length ? liveHoles : RABBIT_HOLES;
}

export function useHole(id: string): RabbitHole | undefined {
  const holes = useHoles();
  return holes.find((h) => h.id === id) ?? getSeedHole(id);
}
