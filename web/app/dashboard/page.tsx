"use client";

import { HoleCard } from "@/components/HoleCard";
import { EmptyHoles } from "@/components/EmptyHoles";
import { BuildNotice, DiscoverButton, RabbitHoleLoading } from "@/components/DiscoverButton";
import { clusterBuildState, clusterHoleToRabbitHole, markDiscoveriesSeen, rememberClusterContext, runCluster, unseenDiscoveries, type ClusterBuildState } from "@/lib/discovery";
import { useApp } from "@/lib/store";
import { bulkPatchBackendHoles, patchBackendHole } from "@/lib/api";
import { useLibraryHoles } from "@/hooks/useHoles";
import { flushExtensionEvents, formatElapsed, useSessionStats } from "@/hooks/useSessionStats";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppFrame, ToolbarFrame } from "@/components/ui/frame";
import { Input, Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function Dashboard() {
  const setLiveHoles = useApp((s) => s.setLiveHoles);
  const triggerDiscovery = useApp((s) => s.triggerDiscovery);
  const triggerDiscoveries = useApp((s) => s.triggerDiscoveries);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const toggleArchive = useApp((s) => s.toggleArchive);
  const deleteHole = useApp((s) => s.deleteHole);
  const patchHoles = useApp((s) => s.patchHoles);
  const deleteHoles = useApp((s) => s.deleteHoles);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [syncLabel, setSyncLabel] = useState("live");
  const [routeBuildState, setRouteBuildState] = useState<"idle" | "loading" | Exclude<ClusterBuildState, "ready"> | "error">("idle");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"active" | "favorites" | "archived" | "all">("active");
  const [sort, setSort] = useState<"recent" | "pages" | "confidence">("recent");
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
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

  function updateSelection(id: string, selected: boolean) {
    setSelectedIds((ids) => selected ? Array.from(new Set([...ids, id])) : ids.filter((x) => x !== id));
  }

  function favoriteOne(id: string) {
    const hole = holes.find((h) => h.id === id);
    toggleFavorite(id);
    void patchBackendHole(id, { favorite: !(hole?.favorite ?? false) }).catch((err) => console.error("favorite persist failed", err));
  }

  function archiveOne(id: string) {
    const hole = holes.find((h) => h.id === id);
    toggleArchive(id);
    void patchBackendHole(id, { archived: !(hole?.archived ?? false) }).catch((err) => console.error("archive persist failed", err));
  }

  function deleteOne(id: string) {
    deleteHole(id);
    setSelectedIds((ids) => ids.filter((x) => x !== id));
    void patchBackendHole(id, { deleted: true }).catch((err) => console.error("delete persist failed", err));
  }

  function bulk(action: "favorite" | "archive" | "delete") {
    const ids = selectedIds;
    if (!ids.length) return;
    if (action === "favorite") patchHoles(ids, { favorite: true });
    if (action === "archive") patchHoles(ids, { archived: true, status: "dormant" });
    if (action === "delete") deleteHoles(ids);
    setSelectedIds([]);
    void bulkPatchBackendHoles(ids, action).catch((err) => console.error("bulk persist failed", err));
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cluster") !== "1") return;

    let cancelled = false;
    setSyncLabel("clustering");
    setRouteBuildState("loading");

    async function buildFromRoute() {
      try {
        await flushExtensionEvents().catch(() => false);
        const cluster = await runCluster();
        if (cancelled) return;
        window.history.replaceState(null, "", "/dashboard");
        const buildState = clusterBuildState(cluster);
        if (buildState !== "ready") {
          setSyncLabel(buildState === "duplicate" ? "already up to date" : buildState === "unclear" ? "no clear thread" : "no browsing");
          setRouteBuildState(buildState);
          return;
        }
        setLiveHoles(cluster.holes.map((hole) => clusterHoleToRabbitHole(hole, cluster.pages, cluster.searches)));
        rememberClusterContext(cluster);
        const discoveries = unseenDiscoveries(cluster.holes);
        const shown = discoveries.length ? discoveries : cluster.holes.map((hole) => ({
          id: hole.client_id ?? hole.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          title: hole.title,
          accent: "rabbit" as const,
          pages: hole.page_ids.length,
          searches: hole.topics.length,
        }));
        setSyncLabel("updated");
        setRouteBuildState("idle");
        if (shown.length) {
          markDiscoveriesSeen(shown);
          window.setTimeout(() => (shown.length > 1 ? triggerDiscoveries(shown) : triggerDiscovery(shown[0])), 80);
        }
      } catch (err) {
        console.error("cluster failed", err);
        if (!cancelled) {
          window.history.replaceState(null, "", "/dashboard");
          setSyncLabel("backend offline");
          setRouteBuildState("error");
        }
      }
    }

    void buildFromRoute();

    return () => {
      cancelled = true;
    };
  }, [setLiveHoles, triggerDiscovery, triggerDiscoveries]);

  return (
    <div className="rh-paper min-h-screen px-5 py-8 sm:px-8 xl:px-12">
      <ConfirmDialog
        open={confirmBulkDelete}
        eyebrow="Delete rabbit holes"
        title={`Delete ${selectedIds.length} selected rabbit ${selectedIds.length === 1 ? "hole" : "holes"}?`}
        body="This removes the selected rabbit holes from your library. This action is meant for cleanup and cannot be undone from the app."
        confirmLabel="Delete selected"
        danger
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={() => {
          setConfirmBulkDelete(false);
          bulk("delete");
        }}
      />
      {routeBuildState === "loading" && <RabbitHoleLoading />}
      {routeBuildState === "empty" && <BuildNotice type="empty" stats={stats} onClose={() => setRouteBuildState("idle")} />}
      {routeBuildState === "duplicate" && <BuildNotice type="duplicate" stats={stats} onClose={() => setRouteBuildState("idle")} />}
      {routeBuildState === "unclear" && <BuildNotice type="unclear" stats={stats} onClose={() => setRouteBuildState("idle")} />}
      {routeBuildState === "error" && <BuildNotice type="error" stats={stats} onClose={() => setRouteBuildState("idle")} />}
      <AppFrame>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="rh-faint mb-2 text-[12px] font-semibold uppercase tracking-[0.22em]">
              Your rabbit holes · {holes.length} total
            </div>
            <h1 className="rh-display rh-ink text-[42px] font-semibold leading-none tracking-normal">
              Rabbit holes
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Card className="hidden items-center gap-5 rounded-xl px-4 py-2.5 sm:flex">
              <HeaderStat n={stats.pages} label="pages" />
              <HeaderStat n={stats.searches} label="searches" />
              <HeaderStat n={stats.tabs} label="tabs" accent />
            </Card>
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
              <Card className="mt-6 flex items-center gap-3 rounded-2xl px-5 py-4">
                <span className={`h-2 w-2 shrink-0 rounded-full ${stats.captureState === "recording" ? "bg-[#5f8a5c]" : stats.captureState === "paused" ? "bg-[#c7ae84]" : "bg-[#b8795f]"}`} />
                <div className="min-w-0 truncate text-[15px] text-[var(--rh-muted)]">
                  <span className="font-semibold text-[var(--rh-ink)]">{statusLabel}</span>
                  {typeof stats.elapsedMs === "number" ? <span className="font-semibold"> · {formatElapsed(stats.elapsedMs)}</span> : null}
                  {" "}— {stats.pages} pages · {stats.searches} searches · {stats.tabs} tabs
                </div>
                <div className="rh-faint ml-auto hidden text-[12px] sm:block">{stats.source === "extension" ? "extension" : syncLabel}</div>
              </Card>
            )}

            <ToolbarFrame className="mt-7">
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
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search holes, domains, topics..."
                    className="min-w-[220px] flex-1"
                  />
                  <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-[132px]">
                    <option value="active">Active</option>
                    <option value="favorites">Favorites</option>
                    <option value="archived">Archived</option>
                    <option value="all">All</option>
                  </Select>
                  <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-[150px]">
                    <option value="recent">Recent</option>
                    <option value="pages">Most pages</option>
                    <option value="confidence">Confidence</option>
                  </Select>
                </div>
              </div>
            </ToolbarFrame>

            {selectedIds.length > 0 && (
              <div className="sticky top-4 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-[#5f8a5c42] bg-[var(--rh-surface)]/95 px-4 py-3 shadow-[0_12px_34px_rgba(70,45,20,.12)] backdrop-blur">
                <div className="mr-auto text-[14px] font-semibold text-[#37502f]">{selectedIds.length} selected</div>
                <Button size="sm" onClick={() => bulk("favorite")}>Favorite</Button>
                <Button size="sm" onClick={() => bulk("archive")}>Archive</Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmBulkDelete(true)}>Delete</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
              </div>
            )}

            {visibleHoles.length === 0 ? (
              <Card className="mt-6 border-dashed px-8 py-12 text-center">
                <div className="rh-display rh-ink text-[28px] font-semibold">Nothing matches this view</div>
                <p className="rh-muted mx-auto mt-2 max-w-[46ch] text-[15px] leading-6">
                  Clear the search, switch filters, or build a fresh rabbit hole after browsing something new.
                </p>
                <Button variant="primary" className="mt-5" onClick={() => { setQuery(""); setFilter("active"); }}>
                  Reset library view
                </Button>
              </Card>
            ) : (
              <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))] xl:[grid-template-columns:repeat(auto-fit,minmax(372px,1fr))]">
                {visibleHoles.map((h) => (
                  <HoleCard
                    key={h.id}
                    hole={h}
                    selected={selectedIds.includes(h.id)}
                    onSelect={updateSelection}
                    onFavorite={favoriteOne}
                    onArchive={archiveOne}
                    onDelete={deleteOne}
                  />
                ))}
              </div>
            )}

            <p className="rh-muted mt-8 text-center text-[13px] italic">
              Smart history for your research.
            </p>
          </>
        )}
      </AppFrame>
    </div>
  );
}

function HeaderStat({ n, label, accent }: { readonly n: number; readonly label: string; readonly accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={`text-[19px] font-semibold tabular-nums ${accent ? "text-[#5f8a5c]" : "text-[var(--rh-ink)]"}`}>
        {n}
      </span>
      <span className="rh-faint text-[10px] uppercase tracking-[0.14em]">{label}</span>
    </div>
  );
}
