"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { clusterHoleToRabbitHole, hasMeaningfulNewContext, markDiscoveriesSeen, rememberClusterContext, runCluster, unseenDiscoveries } from "@/lib/discovery";
import { preGenerateHoleBriefs } from "@/lib/api";
import { ACCENTS } from "@/lib/ui";
import { useApp } from "@/lib/store";
import { useHoles } from "@/hooks/useHoles";

interface Item {
  label: string;
  hint: string;
  href: string;
  glyph: string;
  color?: string;
  action?: () => void;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, togglePalette, triggerDiscovery, triggerDiscoveries, setLiveHoles } = useApp();
  const visibleHoles = useHoles();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette, setPaletteOpen]);

  useEffect(() => {
    if (!paletteOpen) setQ("");
    setCursor(0);
  }, [paletteOpen]);

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = [
      { label: "Dashboard", hint: "All rabbit holes", href: "/dashboard", glyph: "⊞" },
      { label: "Map", hint: "Global graph", href: "/map", glyph: "⌗" },
      { label: "Timeline", hint: "Replay curiosity", href: "/timeline", glyph: "≣" },
      {
        label: "Run clustering",
        hint: "Build from local extension history",
        href: "#discover",
        glyph: "✨",
        action: () => {
          void (async () => {
            try {
              const cluster = await runCluster();
              if (!hasMeaningfulNewContext(cluster)) return;
              const liveHoles = cluster.holes.map((hole) => clusterHoleToRabbitHole(hole, cluster.pages, cluster.searches));
              setLiveHoles(liveHoles);
              rememberClusterContext(cluster);
              const discoveries = unseenDiscoveries(cluster.holes);
              if (!discoveries.length) return;
              await preGenerateHoleBriefs(liveHoles);
              markDiscoveriesSeen(discoveries);
              discoveries.length > 1 ? triggerDiscoveries(discoveries) : triggerDiscovery(discoveries[0]);
            } catch (err) {
              console.error("cluster failed", err);
            }
          })();
        },
      },
    ];
    const holes: Item[] = visibleHoles.map((h) => ({
      label: h.title,
      hint: `${h.pages.length} pages · ${h.entities.length} entities`,
      href: `/holes/${h.id}`,
      glyph: "🐇",
      color: ACCENTS[h.accent].hex,
    }));
    const all = [...holes, ...pages];
    if (!q.trim()) return all;
    const needle = q.toLowerCase();
    return all.filter(
      (i) => i.label.toLowerCase().includes(needle) || i.hint.toLowerCase().includes(needle)
    );
  }, [q, triggerDiscovery, triggerDiscoveries, visibleHoles, setLiveHoles]);

  function go(item: Item) {
    setPaletteOpen(false);
    if (item.action) {
      item.action();
      return;
    }
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && items[cursor]) {
      go(items[cursor]);
    }
  }

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPaletteOpen(false)}
        >
          <div className="absolute inset-0 bg-[#1a100980] backdrop-blur-sm" />
          <motion.div
            className="rh-surface relative w-full max-w-[560px] overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(42,32,24,.34)]"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--rh-line)] px-4 py-3.5">
              <span className="rh-faint">⌕</span>
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Jump to a rabbit hole or view…"
                className="w-full bg-transparent text-[14px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]"
              />
              <kbd className="rounded border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--rh-muted)]">
                esc
              </kbd>
            </div>
            <div className="max-h-[340px] overflow-y-auto p-1.5">
              {items.length === 0 && (
                <div className="rh-muted px-3 py-6 text-center text-[13px]">
                  Nothing matches “{q}”.
                </div>
              )}
              {items.map((i, idx) => (
                <button
                  key={i.href}
                  onMouseEnter={() => setCursor(idx)}
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    cursor === idx ? "bg-[var(--rh-line)]" : ""
                  }`}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md border border-[var(--rh-line)] bg-[var(--rh-surface-3)] text-[13px]"
                    style={i.color ? { boxShadow: `inset 0 0 0 1px ${i.color}40` } : undefined}
                  >
                    {i.glyph}
                  </span>
                  <span className="flex-1">
                    <span className="block truncate text-[13.5px] text-[var(--rh-ink)]">{i.label}</span>
                    <span className="block truncate text-[11.5px] text-[var(--rh-muted)]">{i.hint}</span>
                  </span>
                  <span className="text-[11px] text-[var(--rh-faint)]">↵</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
