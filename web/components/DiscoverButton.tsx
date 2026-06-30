"use client";

import { clusterBuildState, clusterHoleToRabbitHole, markDiscoveriesSeen, rememberClusterContext, runCluster, unseenDiscoveries, type ClusterBuildState } from "@/lib/discovery";
import { useApp } from "@/lib/store";
import type { CSSProperties } from "react";
import { useState } from "react";
import { flushExtensionEvents, useSessionStats } from "@/hooks/useSessionStats";
import { preGenerateHoleBriefs } from "@/lib/api";
import { RabbitEars } from "@/components/Logo";

/** Triggers the discovery overlay from a real /cluster response. */
export function DiscoverButton() {
  const trigger = useApp((s) => s.triggerDiscovery);
  const triggerMany = useApp((s) => s.triggerDiscoveries);
  const setLiveHoles = useApp((s) => s.setLiveHoles);
  const stats = useSessionStats();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("Build rabbit holes");
  const [notice, setNotice] = useState<null | Exclude<ClusterBuildState, "ready"> | "error">(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>(undefined);

  async function discover() {
    if (busy) return;
    setNotice(null);
    setErrorStatus(undefined);
    setBusy(true);
    setLabel("Clustering…");

    try {
      await flushExtensionEvents().catch(() => false);
      const cluster = await runCluster();
      const buildState = clusterBuildState(cluster);
      if (buildState !== "ready") {
        setLabel(buildState === "duplicate" ? "Already up to date" : buildState === "unclear" ? "No clear thread yet" : "No browsing yet");
        setNotice(buildState);
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

      if (!shown.length) {
        setLabel("No new rabbit holes");
        setNotice("duplicate");
        return;
      }

      setLabel(shown.length > 1 ? "Writing briefs…" : "Writing brief…");
      await preGenerateHoleBriefs(liveHoles);
      markDiscoveriesSeen(shown);
      setLabel(shown.length > 1 ? `Found ${shown.length} rabbit holes` : `Found: ${shown[0].title}`);
      setBusy(false);
      window.setTimeout(() => (shown.length > 1 ? triggerMany(shown) : trigger(shown[0])), 80);
    } catch (err) {
      console.error("cluster failed", err);
      const status = undefined;
      setErrorStatus(status);
      setLabel("Could not build");
      setNotice("error");
    } finally {
      setBusy(false);
      window.setTimeout(() => setLabel("Build rabbit holes"), 1300);
    }
  }

  return (
    <>
      <button
        onClick={discover}
        disabled={busy}
        className="rh-surface group relative overflow-hidden rounded-[14px] border px-4 py-2.5 text-[13px] font-semibold shadow-[0_4px_18px_rgba(70,45,20,.06)] transition hover:border-[var(--rh-line-strong)] disabled:cursor-wait disabled:opacity-65"
      >
        <span className="relative inline-flex items-center gap-2">{label}</span>
      </button>
      {busy && <RabbitHoleLoading />}
      {notice === "empty" && <BuildNotice type="empty" stats={stats} onClose={() => setNotice(null)} />}
      {notice === "duplicate" && <BuildNotice type="duplicate" stats={stats} onClose={() => setNotice(null)} />}
      {notice === "unclear" && <BuildNotice type="unclear" stats={stats} onClose={() => setNotice(null)} />}
      {notice === "error" && <BuildNotice type="error" stats={stats} errorStatus={errorStatus} onClose={() => setNotice(null)} />}
    </>
  );
}

const WORDS = [
  { text: "tabs", x: "-245px", y: "-132px", d: "0s" },
  { text: "searches", x: "248px", y: "-112px", d: ".16s" },
  { text: "links", x: "-238px", y: "92px", d: ".32s" },
  { text: "questions", x: "230px", y: "92px", d: ".48s" },
  { text: "notes", x: "-62px", y: "-170px", d: ".64s" },
  { text: "pages", x: "54px", y: "154px", d: ".8s" },
];

export function RabbitHoleLoading() {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-[#140d08]/76 px-4 backdrop-blur-[8px]">
      <style>{`
        @keyframes word-to-hole {
          0% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0; filter: blur(0); }
          12% { opacity: .78; }
          70% { opacity: .5; }
          100% { transform: translate(0, 32px) scale(.16); opacity: 0; filter: blur(2px); }
        }
        @keyframes load-bar {
          0% { transform: translateX(-100%); }
          52% { transform: translateX(-18%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="relative flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[34px] border border-[#f3e8d442] bg-[#17100b] shadow-[0_40px_130px_rgba(18,11,5,.58)]">
        <div className="relative flex min-h-[350px] flex-1 items-center justify-center overflow-hidden bg-[#21170f] px-6 pb-10 pt-10">
          <div className="relative grid place-items-center">
            {WORDS.map((word) => (
              <span
                key={word.text}
                className="absolute left-1/2 top-1/2 z-10 rh-display select-none text-[27px] italic tracking-wide text-[#d7c3a1]/80"
                style={{
                  "--x": word.x,
                  "--y": word.y,
                  animation: `word-to-hole 2.45s cubic-bezier(.52,0,.18,1) ${word.d} infinite`,
                } as CSSProperties}
              >
                {word.text}
              </span>
            ))}
            <div className="relative z-20 grid h-[220px] w-[220px] place-items-center rounded-full border border-[#f3e8d438] bg-[#17100b] text-[#f6ecd9] shadow-[0_22px_70px_rgba(18,11,5,.36)]">
              <RabbitEars className="h-24 w-24" />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#f3e8d43b] bg-[#18100a] px-8 py-8 text-center">
          <div className="mx-auto mb-6 h-2 max-w-[520px] overflow-hidden rounded-full bg-[#3a2a18]">
            <div className="h-full w-3/5 rounded-full bg-[#c79a5b] [animation:load-bar_1.55s_cubic-bezier(.45,0,.2,1)_infinite]" />
          </div>
          <div className="rh-display text-[44px] font-semibold leading-none text-[#f8ecd6]">Building rabbit holes</div>
          <div className="mt-3 text-[17px] italic text-[#b8a486]">Following the thread through your session.</div>
        </div>
      </div>
    </div>
  );
}

export function BuildNotice({ type, stats, errorStatus, onClose }: { readonly type: "empty" | "duplicate" | "unclear" | "error"; readonly stats: ReturnType<typeof useSessionStats>; readonly errorStatus?: number; readonly onClose: () => void }) {
  const empty = type === "empty";
  const duplicate = type === "duplicate";
  const unclear = type === "unclear";
  if (empty || duplicate || unclear) {
    const eyebrow = empty ? "Not enough history" : duplicate ? "Already up to date" : "No clear thread yet";
    const title = empty
        ? "Uh oh, not enough search history to make a rabbit hole."
      : duplicate
        ? "You already built this rabbit hole."
        : "There is history, but no clear rabbit hole yet.";
    const body = empty
        ? "Browse a few related searches and pages first. Rabbit Holes needs a real trail before it can cluster an investigation."
      : duplicate
        ? "Your current browsing trail has already been clustered. Browse a few new related pages or searches, then build again."
        : "Rabbit Holes found browsing activity, but it was too scattered to form one clean investigation. Keep going on one thread, then try again.";
    return (
      <div className="fixed inset-0 z-[75] grid place-items-center bg-[#140d08]/76 px-4 backdrop-blur-[10px]">
        <style>{`
          @keyframes soft-word-drift {
            0% { transform: translateY(10px); opacity: 0; }
            35% { opacity: .56; }
            100% { transform: translateY(-18px); opacity: 0; }
          }
        `}</style>
        <div className="relative w-full max-w-[720px] overflow-hidden rounded-[34px] border border-[#f3e8d426] bg-[#17100b] shadow-[0_34px_110px_rgba(18,11,5,.48)]">
          <div className="relative h-[360px] overflow-hidden border-b border-[#f3e8d41f] bg-[#2b2117]">
            {["searches", "pages", "links", "tabs"].map((word, i) => (
              <span
                key={word}
                className="absolute rh-display select-none text-[24px] italic tracking-wide text-[#d7c3a1]/60"
                style={{
                  left: `${18 + i * 19}%`,
                  top: `${22 + (i % 2) * 42}%`,
                  animation: `soft-word-drift 2.8s ease-in-out ${i * 0.2}s infinite`,
                }}
              >
                {word}
              </span>
            ))}
            <div className="absolute inset-x-0 bottom-[68px] mx-auto grid h-[150px] w-[150px] place-items-center rounded-full border border-[#f3e8d438] bg-[#17100b] text-[#f6ecd9] shadow-[0_22px_70px_rgba(18,11,5,.34)]">
              <RabbitEars className="h-16 w-16" />
            </div>
          </div>

          <div className="bg-[#17100b] px-9 py-8 text-[#f3e8d4]">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#b69b77]">
              <span className="h-2 w-2 rounded-full bg-[#d6a95f] shadow-[0_0_14px_#d6a95f]" />
              {eyebrow}
            </div>
            <h2 className="rh-display text-[42px] font-semibold leading-tight text-[#f6ecd9]">
              {title}
            </h2>
            <p className="mt-4 max-w-[560px] text-[18px] leading-7 text-[#d8c8ad]">
              {body}
            </p>
            <div className="mt-7 grid max-w-[520px] grid-cols-3 divide-x divide-[#f3e8d426] rounded-[18px] border border-[#f3e8d426] bg-[#21170f] px-3 py-4">
              <MiniBuildStat label="pages" value={stats.pages} />
              <MiniBuildStat label="searches" value={stats.searches} />
              <MiniBuildStat label="tabs" value={stats.tabs} />
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={onClose}
                className="rounded-[16px] border border-[#f3e8d426] bg-[#2b2117] px-7 py-4 text-[17px] font-semibold text-[#f6efe1] shadow-[0_10px_28px_rgba(42,32,24,.24)] transition hover:-translate-y-0.5"
              >
                Keep browsing
              </button>
              <a
                href="/install"
                className="rounded-[16px] border border-[#f3e8d426] bg-transparent px-7 py-4 text-[17px] font-semibold text-[#cdbd9f] no-underline transition hover:bg-[#f3e8d40d]"
              >
                Check extension setup
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const title =
    "Could not build this rabbit hole";
  const body =
    "Rabbit Holes could not read enough local browser activity from the extension. Keep browsing on one thread, reload the extension if needed, then try again.";
  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-[#140d08]/72 px-4 backdrop-blur-[8px]">
      <div className="rh-surface w-full max-w-[560px] rounded-[28px] border p-7 text-center shadow-[0_34px_90px_rgba(18,11,5,.42)]">
        <div className="rh-faint text-[11px] font-semibold uppercase tracking-[0.22em]">
          Could not build
        </div>
        <h2 className="rh-display rh-ink mt-3 text-[34px] font-semibold leading-tight">
          {title}
        </h2>
        <p className="rh-muted mx-auto mt-3 max-w-[42ch] text-[15.5px] leading-6">
          {body}
        </p>
        <div className="rh-surface-2 mt-6 grid grid-cols-3 divide-x divide-[var(--rh-line)] rounded-[18px] border px-3 py-4">
          <MiniBuildStat label="pages" value={stats.pages} />
          <MiniBuildStat label="searches" value={stats.searches} />
          <MiniBuildStat label="tabs" value={stats.tabs} />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={onClose} className="rh-primary rounded-full px-6 py-3 text-[14px] font-semibold">
            Close
          </button>
          <a href="/install" className="rh-surface-2 rounded-full border px-6 py-3 text-[14px] font-semibold no-underline">
            Check extension setup
          </a>
        </div>
      </div>
    </div>
  );
}

function MiniBuildStat({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="px-3 text-center">
      <div className="rh-display rh-ink text-[26px] font-semibold tabular-nums">{value}</div>
      <div className="rh-faint mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</div>
    </div>
  );
}
