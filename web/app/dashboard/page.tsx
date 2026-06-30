"use client";

import { HoleCard } from "@/components/HoleCard";
import { EmptyHoles } from "@/components/EmptyHoles";
import { BuildNotice, DiscoverButton, RabbitHoleLoading } from "@/components/DiscoverButton";
import { clusterBuildState, clusterHoleToRabbitHole, forgetClusterContext, markDiscoveriesSeen, markDiscoveryUnseen, rememberClusterContext, runCluster, unseenDiscoveries, type ClusterBuildState } from "@/lib/discovery";
import { useApp } from "@/lib/store";
import { bulkPatchBackendHoles, patchBackendHole, preGenerateHoleBriefs } from "@/lib/api";
import { useLibraryHoles } from "@/hooks/useHoles";
import { flushExtensionEvents, useSessionStats } from "@/hooks/useSessionStats";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppFrame } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

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
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const holes = useLibraryHoles();
  const stats = useSessionStats();
  const visibleHoles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return holes
      .filter((h) => {
        if (h.archived) return false;
        if (!needle) return true;
        const haystack = [h.title, h.description, ...h.domains, ...h.summary.topics, ...h.searches.map((s) => s.query)].join(" ").toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => +new Date(b.lastActive) - +new Date(a.lastActive));
  }, [holes, query]);

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
    <div className="rh-paper min-h-screen px-5 py-12 sm:px-8 xl:px-12">
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
      <AppFrame className="mx-auto max-w-[1120px]">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="rh-faint mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]">
              Library
            </div>
            <h1 className="rh-display rh-ink text-[clamp(38px,5vw,58px)] font-semibold leading-none tracking-[-0.03em]">
              Rabbit holes
            </h1>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--rh-muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--rh-green)] shadow-[0_0_12px_var(--rh-green)]" />
              Extension connected
            </div>
            <DiscoverButton />
          </div>
        </div>

        {holes.length === 0 ? (
          <div className="mt-12 space-y-8">
            <EmptyHoles
              eyebrow="Your library"
              title="Your first investigation will appear here."
              hint="Install the extension, browse normally, and Rabbit Holes will preserve the thread when a real trail forms."
            />
            <ExampleInvestigation />
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <ContinueInvestigation hole={visibleHoles[0] ?? holes[0]} />
              <LibraryContext holesCount={visibleHoles.length} syncLabel={syncLabel} />
            </div>

            <div className="mt-10 max-w-[380px]">
              <div className="rh-faint mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Recent investigations</div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rabbit holes"
              />
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
              <Card className="mt-8 border-dashed px-8 py-12 text-center shadow-none">
                <div className="rh-display rh-ink text-[28px] font-semibold">Nothing matches this view</div>
                <p className="rh-muted mx-auto mt-2 max-w-[46ch] text-[15px] leading-6">
                  Clear the search, switch filters, or build a fresh rabbit hole after browsing something new.
                </p>
                <Button variant="primary" className="mt-5" onClick={() => setQuery("")}>
                  Reset library view
                </Button>
              </Card>
            ) : (
              <div className="mt-8 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] xl:[grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
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

function ExampleInvestigation() {
  return (
    <section className="rh-surface mx-auto overflow-hidden rounded-[28px] border">
      <div className="grid gap-0 lg:grid-cols-[1fr_.9fr]">
        <div className="border-b border-[var(--rh-line)] p-7 lg:border-b-0 lg:border-r lg:p-9">
          <div className="rh-faint mb-5 text-[11px] font-semibold uppercase tracking-[0.2em]">Example investigation</div>
          <div className="space-y-3">
            {[
              ["Search", "vLLM request scheduling"],
              ["Repo", "vllm-project/vllm"],
              ["Paper", "DistServe"],
            ].map(([label, value]) => (
              <div key={value} className="rounded-[18px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] px-5 py-4">
                <div className="rh-faint text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</div>
                <div className="rh-display rh-ink mt-1 text-[22px] font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-7 lg:p-9">
          <div className="rh-faint mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]">Current investigation</div>
          <h2 className="rh-display rh-ink text-[clamp(36px,5vw,58px)] font-semibold leading-none tracking-[-0.03em]">AI Systems</h2>
          <div className="mt-7 overflow-hidden rounded-[20px] border border-[var(--rh-line)]">
            <ExampleRow label="Question" value="How does vLLM schedule requests?" />
            <ExampleRow label="Last stop" value="DistServe, section 4" />
            <ExampleRow label="Next" value="Compare against Sarathi" last />
          </div>
          <Link href="/install" className="mt-7 inline-flex rounded-full bg-[var(--rh-ink)] px-6 py-3 text-[15px] font-semibold text-[var(--rh-paper)] no-underline transition hover:opacity-90">
            Continue investigation →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ExampleRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`px-5 py-4 ${last ? "" : "border-b border-[var(--rh-line)]"}`}>
      <div className="rh-faint text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</div>
      <div className="rh-ink mt-1 text-[18px] font-semibold">{value}</div>
    </div>
  );
}

function ContinueInvestigation({ hole }: { hole: ReturnType<typeof useLibraryHoles>[number] }) {
  const lastPage = hole.pages[hole.pages.length - 1];
  const question = hole.summary.questions[0] || hole.description;
  return (
    <section className="rh-surface rounded-[26px] border p-7">
      <div className="rh-faint mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Continue investigation</div>
      <h2 className="rh-display rh-ink text-[clamp(32px,4vw,48px)] font-semibold leading-none">{hole.title}</h2>
      <div className="mt-6 grid gap-3">
        <ExampleRow label="Current question" value={question} />
        <ExampleRow label="Last stop" value={lastPage ? lastPage.title : "Recently active"} last />
      </div>
      <Link href={`/holes/${hole.id}`} className="mt-6 inline-flex rounded-full bg-[var(--rh-ink)] px-5 py-3 text-[14px] font-semibold text-[var(--rh-paper)] no-underline transition hover:opacity-90">
        Open thread →
      </Link>
    </section>
  );
}

function LibraryContext({ holesCount, syncLabel }: { holesCount: number; syncLabel: string }) {
  return (
    <section className="rh-surface rounded-[26px] border p-7">
      <div className="rh-faint mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Library status</div>
      <div className="space-y-4 text-[16px]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--rh-line)] pb-4">
          <span className="rh-muted">Investigations</span>
          <span className="rh-ink font-semibold">{holesCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--rh-line)] pb-4">
          <span className="rh-muted">Capture</span>
          <span className="rh-ink font-semibold">Connected</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="rh-muted">Last update</span>
          <span className="rh-ink font-semibold">{syncLabel}</span>
        </div>
      </div>
    </section>
  );
}
