"use client";

import { HoleCard } from "@/components/HoleCard";
import { EmptyHoles } from "@/components/EmptyHoles";
import { BuildNotice, DiscoverButton, RabbitHoleLoading } from "@/components/DiscoverButton";
import { clusterBuildState, clusterHoleToRabbitHole, forgetClusterContext, markDiscoveriesSeen, markDiscoveryUnseen, rememberClusterContext, runCluster, unseenDiscoveries, type ClusterBuildState } from "@/lib/discovery";
import { useApp } from "@/lib/store";
import { bulkPatchBackendHoles, patchBackendHole, preGenerateHoleBriefs } from "@/lib/api";
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
  const [routeErrorStatus, setRouteErrorStatus] = useState<number | undefined>(undefined);
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
    markDiscoveryUnseen(id);
    forgetClusterContext();
    deleteHole(id);
    setSelectedIds((ids) => ids.filter((x) => x !== id));
    void patchBackendHole(id, { deleted: true }).catch((err) => console.error("delete persist failed", err));
  }

  function bulk(action: "favorite" | "archive" | "delete") {
    const ids = selectedIds;
    if (!ids.length) return;
    if (action === "favorite") patchHoles(ids, { favorite: true });
    if (action === "archive") patchHoles(ids, { archived: true, status: "dormant" });
    if (action === "delete") {
      ids.forEach((id) => markDiscoveryUnseen(id));
      forgetClusterContext();
      deleteHoles(ids);
    }
    setSelectedIds([]);
    void bulkPatchBackendHoles(ids, action).catch((err) => console.error("bulk persist failed", err));
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cluster") !== "1") return;

    let cancelled = false;
    setSyncLabel("clustering");
    setRouteBuildState("loading");
    setRouteErrorStatus(undefined);

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
        const liveHoles = cluster.holes.map((hole) => clusterHoleToRabbitHole(hole, cluster.pages, cluster.searches));
        setLiveHoles(liveHoles);
        rememberClusterContext(cluster);
        const discoveries = unseenDiscoveries(cluster.holes);
        const shown = discoveries.length ? discoveries : cluster.holes.map((hole) => ({
          id: hole.client_id ?? hole.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          title: hole.title,
          accent: "rabbit" as const,
          pages: hole.page_ids.length,
          searches: hole.topics.length,
        }));
        setSyncLabel("writing brief");
        await preGenerateHoleBriefs(liveHoles);
        if (cancelled) return;
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
          const status = undefined;
          setRouteErrorStatus(status);
          setSyncLabel("local build issue");
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
      {routeBuildState === "error" && <BuildNotice type="error" stats={stats} errorStatus={routeErrorStatus} onClose={() => setRouteBuildState("idle")} />}
      <AppFrame className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="rh-faint mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
              Library
            </div>
            <h1 className="rh-display rh-ink text-[clamp(42px,7vw,72px)] font-semibold leading-none tracking-[-0.035em]">
              Rabbit holes
            </h1>
          </div>
          <DiscoverButton />
        </div>

        {holes.length === 0 ? (
          <div className="mt-14">
            <EmptyHoles eyebrow="Your rabbit holes" />
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-5">
              {latest && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-[var(--rh-muted)]">
                  <span className="inline-flex items-center gap-2 font-semibold text-[var(--rh-ink)]">
                    <span className={`h-2 w-2 rounded-full ${stats.captureState === "recording" ? "bg-[#5f8a5c]" : stats.captureState === "paused" ? "bg-[#c7ae84]" : "bg-[#b8795f]"}`} />
                    {statusLabel}
                  </span>
                  {typeof stats.elapsedMs === "number" && <span>{formatElapsed(stats.elapsedMs)}</span>}
                  <span>{stats.pages} pages</span>
                  <span>{stats.searches} searches</span>
                  <span>{stats.tabs} tabs</span>
                  <span className="rh-faint">{stats.source === "extension" ? "extension" : syncLabel}</span>
                </div>
              )}

              <ToolbarFrame className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="min-w-[220px] flex-1"
                  />
                  <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-[128px]">
                    <option value="active">Active</option>
                    <option value="favorites">Favorites</option>
                    <option value="archived">Archived</option>
                    <option value="all">All</option>
                  </Select>
                  <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-[138px]">
                    <option value="recent">Recent</option>
                    <option value="pages">Pages</option>
                    <option value="confidence">Match</option>
                  </Select>
                </div>
              </ToolbarFrame>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--rh-muted)]">
              <span>{visibleHoles.length} shown · {holes.length} total</span>
              {query || filter !== "active" || sort !== "recent" ? (
                <button className="font-semibold text-[var(--rh-ink)]" onClick={() => { setQuery(""); setFilter("active"); setSort("recent"); }}>
                  Reset view
                </button>
              ) : null}
            </div>

            {selectedIds.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[16px] border border-[var(--rh-line)] bg-[var(--rh-surface)] px-3 py-3">
                <div className="mr-auto px-1 text-[13px] font-semibold text-[var(--rh-ink)]">{selectedIds.length} selected</div>
                <Button size="sm" variant="ghost" onClick={() => bulk("favorite")}>Favorite</Button>
                <Button size="sm" variant="ghost" onClick={() => bulk("archive")}>Archive</Button>
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
              <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] xl:[grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
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
          </>
        )}
      </AppFrame>
    </div>
  );
}
