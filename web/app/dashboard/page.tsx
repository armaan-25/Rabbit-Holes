"use client";

import { HoleCard } from "@/components/HoleCard";
import { EmptyHoles } from "@/components/EmptyHoles";
import { DiscoverButton } from "@/components/DiscoverButton";
import { clusterHoleToRabbitHole, hasMeaningfulNewContext, rememberClusterContext, runCluster } from "@/lib/discovery";
import { useApp } from "@/lib/store";
import { useLibraryHoles } from "@/hooks/useHoles";
import { formatElapsed, useSessionStats } from "@/hooks/useSessionStats";
import { useEffect, useMemo, useState } from "react";

export default function Dashboard() {
  const setLiveHoles = useApp((s) => s.setLiveHoles);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const toggleArchive = useApp((s) => s.toggleArchive);
  const deleteHole = useApp((s) => s.deleteHole);
  const [syncLabel, setSyncLabel] = useState("live");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"active" | "favorites" | "archived" | "all">("active");
  const [sort, setSort] = useState<"recent" | "pages" | "confidence">("recent");
  const holes = useLibraryHoles();
  const stats = useSessionStats();
  const visibleHoles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return holes
      .filter((h) => {
        if (filter === "active" && h.archived) return false;
        if (filter === "favorites" && !h.favorite) return false;
        if (filter === "archived" && !h.archived) return false;
        if (!needle) return true;
        const haystack = [h.title, h.description, ...h.domains, ...h.summary.topics, ...h.searches.map((s) => s.query)].join(" ").toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => {
        if (sort === "pages") return b.pages.length - a.pages.length;
        if (sort === "confidence") return b.confidence - a.confidence;
        return +new Date(b.lastActive) - +new Date(a.lastActive);
      });
  }, [filter, holes, query, sort]);
  const latest = visibleHoles.find((h) => h.status === "active") ?? visibleHoles[0];
  const statusLabel = stats.captureState === "recording" ? "Capturing" : stats.captureState === "paused" ? "Paused" : "Stopped";

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cluster") !== "1") return;

    let cancelled = false;
    setSyncLabel("clustering");
    void runCluster()
      .then((cluster) => {
        if (cancelled) return;
        if (!hasMeaningfulNewContext(cluster)) {
          setSyncLabel("no new browsing");
          return;
        }
        setLiveHoles(cluster.holes.map((hole) => clusterHoleToRabbitHole(hole, cluster.pages, cluster.searches)));
        rememberClusterContext(cluster);
        setSyncLabel("updated");
      })
      .catch((err) => {
        console.error("cluster failed", err);
        if (!cancelled) setSyncLabel("backend offline");
      });

    return () => {
      cancelled = true;
    };
  }, [setLiveHoles]);

  return (
    <div className="rh-paper min-h-screen px-5 py-8 sm:px-8 xl:px-12">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#a8967d]">
              Your rabbit holes · {holes.length} total
            </div>
            <h1 className="rh-display text-[42px] font-semibold leading-none tracking-normal text-[#2a2018]">
              Rabbit holes
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-5 rounded-xl border border-[#785a321f] bg-[#fbf6ec] px-4 py-2.5 shadow-[0_2px_16px_rgba(70,45,20,.06)] sm:flex">
              <HeaderStat n={stats.pages} label="pages" />
              <HeaderStat n={stats.searches} label="searches" />
              <HeaderStat n={stats.tabs} label="tabs" accent />
            </div>
            <DiscoverButton />
          </div>
        </div>

        {holes.length === 0 ? (
          <div className="mt-12">
            <EmptyHoles eyebrow="Your rabbit holes" />
          </div>
        ) : (
          <>
            {latest && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#5f8a5c42] bg-[linear-gradient(100deg,rgba(95,138,92,.13),rgba(95,138,92,.05))] px-5 py-4">
                <div className="relative h-[11px] w-[11px] shrink-0">
                  <span className={`absolute inset-0 rounded-full ${stats.captureState === "recording" ? "bg-[#5f8a5c] [animation:dash-pulse_2s_ease-in-out_infinite]" : "bg-[#c7ae84]"}`} />
                  {stats.captureState === "recording" && <span className="absolute inset-0 rounded-full bg-[#5f8a5c] [animation:dash-ring_2s_ease-out_infinite]" />}
                </div>
                <div className="text-[15.5px] text-[#3f5a3d]">
                  <span className="font-semibold text-[#37502f]">{statusLabel}</span>
                  {typeof stats.elapsedMs === "number" ? <span className="font-semibold"> · {formatElapsed(stats.elapsedMs)}</span> : null}
                  {" "}— {stats.pages} pages · {stats.searches} searches · {stats.tabs} tabs
                </div>
                <div className="ml-auto hidden text-[13px] italic text-[#7f9a7c] sm:block">{stats.source === "extension" ? "extension live" : syncLabel}</div>
              </div>
            )}

            <div className="mt-7 rounded-[22px] border border-[#785a3224] bg-[#fbf6ec] p-4 shadow-[0_2px_16px_rgba(70,45,20,.05)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">
                    Library
                  </h2>
                  <p className="mt-1 text-[14px] text-[#6a5a48]">
                    Search, favorite, archive, and clean up old investigations.
                  </p>
                </div>
                <div className="flex flex-1 flex-wrap gap-2 lg:max-w-[760px] lg:justify-end">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search holes, domains, topics..."
                    className="min-w-[240px] flex-1 rounded-[13px] border border-[#785a3224] bg-[#fffaf1] px-4 py-3 text-[14px] text-[#2a2018] outline-none placeholder:text-[#a8967d] focus:border-[#785a3255]"
                  />
                  <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-[13px] border border-[#785a3224] bg-[#f6efe1] px-3 py-3 text-[14px] text-[#5a4a38] outline-none">
                    <option value="active">Active</option>
                    <option value="favorites">Favorites</option>
                    <option value="archived">Archived</option>
                    <option value="all">All</option>
                  </select>
                  <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-[13px] border border-[#785a3224] bg-[#f6efe1] px-3 py-3 text-[14px] text-[#5a4a38] outline-none">
                    <option value="recent">Recent</option>
                    <option value="pages">Most pages</option>
                    <option value="confidence">Confidence</option>
                  </select>
                </div>
              </div>
            </div>

            {visibleHoles.length === 0 ? (
              <div className="mt-6 rounded-[22px] border border-dashed border-[#785a3224] bg-[#fbf6ec] px-8 py-12 text-center">
                <div className="rh-display text-[28px] font-semibold text-[#2a2018]">Nothing matches this view</div>
                <p className="mx-auto mt-2 max-w-[46ch] text-[15px] leading-6 text-[#6a5a48]">
                  Clear the search, switch filters, or build a fresh rabbit hole after browsing something new.
                </p>
                <button onClick={() => { setQuery(""); setFilter("active"); }} className="mt-5 rounded-full bg-[#2a2018] px-5 py-3 text-[14px] font-semibold text-[#f3e8d4]">
                  Reset library view
                </button>
              </div>
            ) : (
              <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))] xl:[grid-template-columns:repeat(auto-fit,minmax(372px,1fr))]">
                {visibleHoles.map((h, i) => (
                  <HoleCard key={h.id} hole={h} index={i} onFavorite={toggleFavorite} onArchive={toggleArchive} onDelete={deleteHole} />
                ))}
              </div>
            )}

            <p className="mt-8 text-center text-[13px] italic text-[#9c8b75]">
              Smart history for your research.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function HeaderStat({ n, label, accent }: { readonly n: number; readonly label: string; readonly accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={`text-[19px] font-semibold tabular-nums ${accent ? "text-[#5f8a5c]" : "text-[#2a2018]"}`}>
        {n}
      </span>
      <span className="text-[10px] uppercase tracking-[0.14em] text-[#a8967d]">{label}</span>
    </div>
  );
}
