"use client";

import { RABBIT_HOLES, getHole as getSeedHole } from "@/lib/data";
import { useApp } from "@/lib/store";
import { useSignedIn } from "@/lib/useAuth";
import type { RabbitHole } from "@/lib/types";

/**
 * Holes to render. A signed-in account shows only its own live holes (empty
 * until the extension clusters a session). The sample RABBIT_HOLES are demo
 * content for logged-out visitors exploring the marketing demo only.
 */
export function useHoles(): RabbitHole[] {
  const liveHoles = useApp((s) => s.liveHoles);
  const signedIn = useSignedIn();
  if (liveHoles.length) return liveHoles;
  return signedIn === false ? RABBIT_HOLES : [];
}

export function useHole(id: string): RabbitHole | undefined {
  const liveHoles = useApp((s) => s.liveHoles);
  return liveHoles.find((h) => h.id === id) ?? getSeedHole(id);
}
