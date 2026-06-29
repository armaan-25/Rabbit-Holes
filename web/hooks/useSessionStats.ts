"use client";

import { useEffect, useState } from "react";

export type CaptureState = "recording" | "paused" | "stopped";

export interface CapturedTab {
  title: string;
  url: string;
  domain: string;
  at?: string | null;
}

export interface SessionStats {
  pages: number;
  searches: number;
  tabs: number;
  captureState: CaptureState;
  elapsedMs?: number;
  capturedTabs?: CapturedTab[];
  source: "extension" | "local";
}

const EMPTY_STATS: SessionStats = {
  pages: 0,
  searches: 0,
  tabs: 0,
  captureState: "recording",
  source: "local",
};

export function formatElapsed(ms = 0): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h ? `${h}:` : ""}${h ? String(m).padStart(2, "0") : String(m)}:${String(s).padStart(2, "0")}`;
}

function readExtensionStats(timeoutMs = 450): Promise<SessionStats | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== "rabbit-holes:stats" || event.data.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      const stats = event.data.stats as Partial<SessionStats> | null;
      resolve(stats ? { ...EMPTY_STATS, ...stats, source: "extension" } : null);
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "rabbit-holes:get-stats", requestId }, window.location.origin);
  });
}

/** Ask the extension (via stats-bridge.js) to pause/resume/stop capture. Resolves false if no extension answers. */
export function setExtensionCapture(state: CaptureState, timeoutMs = 1500): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(false);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== "rabbit-holes:capture-updated" || event.data.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(Boolean(event.data.ok));
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "rabbit-holes:set-capture", requestId, state }, window.location.origin);
  });
}

/** Remove one captured tab from the extension's local capture queue. */
export function removeCapturedTab(url: string, timeoutMs = 1500): Promise<boolean> {
  if (typeof window === "undefined" || !url) return Promise.resolve(false);
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(false);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== "rabbit-holes:tab-removed" || event.data.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(Boolean(event.data.ok));
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "rabbit-holes:remove-tab", requestId, url }, window.location.origin);
  });
}

/** Legacy compatibility: clustering is local-first, so flushing is no longer required. */
export function flushExtensionEvents(timeoutMs = 1800): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(false);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== "rabbit-holes:flush-complete" || event.data.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(Boolean(event.data.ok));
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "rabbit-holes:flush", requestId }, window.location.origin);
  });
}

export function useSessionStats(): SessionStats {
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);

  useEffect(() => {
    let active = true;

    async function load() {
      const extensionStats = await readExtensionStats();
      if (active && extensionStats) {
        setStats(extensionStats);
        return;
      }

      if (active) setStats(EMPTY_STATS);
    }

    void load();
    const id = window.setInterval(() => void load(), 2000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  return stats;
}
