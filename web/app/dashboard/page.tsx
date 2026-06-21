"use client";

import { RABBIT_HOLES } from "@/lib/data";
import { HoleCard } from "@/components/HoleCard";
import { DiscoverButton } from "@/components/DiscoverButton";
import { clusterHoleToRabbitHole, runCluster } from "@/lib/discovery";
import { useApp } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";

export default function Dashboard() {
  const liveHoles = useApp((s) => s.liveHoles);
  const setLiveHoles = useApp((s) => s.setLiveHoles);
  const [syncLabel, setSyncLabel] = useState("live");
  const holes = useMemo(() => (liveHoles.length ? liveHoles : RABBIT_HOLES), [liveHoles]);
  const totalTabs = holes.reduce((a, h) => a + h.pages.length, 0);
  const active = holes.filter((h) => h.status === "active").length;
  const latest = holes.find((h) => h.status === "active") ?? holes[0];

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cluster") !== "1") return;

    let cancelled = false;
    setSyncLabel("clustering");
    void runCluster()
      .then((cluster) => {
        if (cancelled) return;
        setLiveHoles(cluster.holes.map((hole) => clusterHoleToRabbitHole(hole, cluster.pages, cluster.searches)));
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
              Your rabbit holes · {holes.length} holes
            </div>
            <h1 className="rh-display text-[42px] font-semibold leading-none tracking-normal text-[#2a2018]">
              Rabbit holes
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-5 rounded-xl border border-[#785a321f] bg-[#fbf6ec] px-4 py-2.5 shadow-[0_2px_16px_rgba(70,45,20,.06)] sm:flex">
              <HeaderStat n={holes.length} label="holes" />
              <HeaderStat n={totalTabs} label="pages" />
              <HeaderStat n={active} label="active" accent />
            </div>
            <DiscoverButton />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#5f8a5c42] bg-[linear-gradient(100deg,rgba(95,138,92,.13),rgba(95,138,92,.05))] px-5 py-4">
          <div className="relative h-[11px] w-[11px] shrink-0">
            <span className="absolute inset-0 rounded-full bg-[#5f8a5c] [animation:dash-pulse_2s_ease-in-out_infinite]" />
            <span className="absolute inset-0 rounded-full bg-[#5f8a5c] [animation:dash-ring_2s_ease-out_infinite]" />
          </div>
          <div className="text-[15.5px] text-[#3f5a3d]">
            <span className="font-semibold text-[#37502f]">Capturing now</span> — this session is feeding <span className="font-semibold">{latest.title}</span> · {latest.pages.length} pages captured
          </div>
          <div className="ml-auto hidden text-[13px] italic text-[#7f9a7c] sm:block">{syncLabel}</div>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">
            Active investigations
          </h2>
        </div>

        <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))] xl:[grid-template-columns:repeat(auto-fit,minmax(372px,1fr))]">
          {holes.map((h, i) => (
            <HoleCard key={h.id} hole={h} index={i} />
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] italic text-[#9c8b75]">
          Smart history for your research.
        </p>
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
