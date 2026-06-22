"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { clusterHoleToRabbitHole, hasMeaningfulNewContext, markDiscoverySeen, nextUnseenDiscovery, rememberClusterContext, runCluster } from "@/lib/discovery";
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
  const { paletteOpen, setPaletteOpen, togglePalette, triggerDiscovery, setLiveHoles } = useApp();
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
        hint: "Trigger from backend /cluster",
        href: "#discover",
        glyph: "✨",
        action: () => {
          void (async () => {
            try {
              const cluster = await runCluster();
              if (!hasMeaningfulNewContext(cluster)) return;
              setLiveHoles(cluster.holes.map((hole) => clusterHoleToRabbitHole(hole, cluster.pages, cluster.searches)));
              rememberClusterContext(cluster);
              const next = nextUnseenDiscovery(cluster.holes);
              if (!next) return;
              markDiscoverySeen(next.id);
              triggerDiscovery(next);
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
  }, [q, triggerDiscovery, visibleHoles, setLiveHoles]);

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
            className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#785a3233] bg-[#fbf6ec] shadow-[0_30px_80px_rgba(42,32,24,.34)]"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#785a3221] px-4 py-3.5">
              <span className="text-[#a8967d]">⌕</span>
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Jump to a rabbit hole or view…"
                className="w-full bg-transparent text-[14px] text-[#2a2018] outline-none placeholder:text-[#a8967d]"
              />
              <kbd className="rounded border border-[#785a3224] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#8a7860]">
                esc
              </kbd>
            </div>
            <div className="max-h-[340px] overflow-y-auto p-1.5">
              {items.length === 0 && (
                <div className="px-3 py-6 text-center text-[13px] text-[#9c8b75]">
                  Nothing matches “{q}”.
                </div>
              )}
              {items.map((i, idx) => (
                <button
                  key={i.href}
                  onMouseEnter={() => setCursor(idx)}
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    cursor === idx ? "bg-[#785a3214]" : ""
                  }`}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md border border-[#785a3224] bg-white text-[13px]"
                    style={i.color ? { boxShadow: `inset 0 0 0 1px ${i.color}40` } : undefined}
                  >
                    {i.glyph}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13.5px] text-[#2a2018]">{i.label}</span>
                    <span className="block text-[11.5px] text-[#9c8b75]">{i.hint}</span>
                  </span>
                  <span className="text-[11px] text-[#b6a488]">↵</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
