"use client";

import { clusterHoleToRabbitHole, holeToDiscovery, markDiscoverySeen, nextUnseenDiscovery, runCluster } from "@/lib/discovery";
import { useApp } from "@/lib/store";
import type { CSSProperties } from "react";
import { useState } from "react";

/** Triggers the discovery overlay from a real /cluster response. */
export function DiscoverButton() {
  const trigger = useApp((s) => s.triggerDiscovery);
  const setLiveHoles = useApp((s) => s.setLiveHoles);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("Build rabbit holes");

  async function discover() {
    if (busy) return;
    setBusy(true);
    setLabel("Clustering…");

    try {
      const cluster = await runCluster();
      setLiveHoles(cluster.holes.map((hole) => clusterHoleToRabbitHole(hole, cluster.pages, cluster.searches)));
      const next = nextUnseenDiscovery(cluster.holes) ?? (cluster.holes[0] ? holeToDiscovery(cluster.holes[0]) : null);

      if (!next) {
        setLabel("No new rabbit holes");
        return;
      }

      markDiscoverySeen(next.id);
      trigger(next);
      setLabel(`Found: ${next.title}`);
    } catch (err) {
      console.error("cluster failed", err);
      setLabel("Backend offline");
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
        className="group relative overflow-hidden rounded-[14px] border border-[#8b6b3f33] bg-[#fbf6ec] px-4 py-2.5 text-[13px] font-semibold text-[#3a2a18] shadow-[0_4px_18px_rgba(70,45,20,.08)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(70,45,20,.13)] disabled:cursor-wait disabled:opacity-65"
      >
        <span className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(80%_120%_at_20%_20%,rgba(180,143,88,.26),transparent_55%),radial-gradient(90%_120%_at_90%_80%,rgba(95,138,92,.18),transparent_58%)]" />
        <span className="relative inline-flex items-center gap-2">
          <img src="/assets/images/rabbit-hole-hero.png" alt="" className="h-5 w-5 object-contain opacity-85" />
          {label}
        </span>
      </button>
      {busy && <RabbitHoleLoading />}
    </>
  );
}

const WORDS = [
  { text: "tabs", x: "-300px", y: "-128px", d: "0s" },
  { text: "searches", x: "286px", y: "-124px", d: ".18s" },
  { text: "notes", x: "-260px", y: "18px", d: ".34s" },
  { text: "links", x: "262px", y: "24px", d: ".52s" },
  { text: "threads", x: "-272px", y: "150px", d: ".7s" },
  { text: "questions", x: "280px", y: "146px", d: ".9s" },
  { text: "ideas", x: "-82px", y: "-190px", d: "1.08s" },
  { text: "context", x: "96px", y: "-184px", d: "1.24s" },
  { text: "memory", x: "-92px", y: "204px", d: "1.42s" },
  { text: "patterns", x: "92px", y: "202px", d: "1.62s" },
];

function RabbitHoleLoading() {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-[#1a130d]/58 px-5 backdrop-blur-[10px]">
      <style>{`
        @keyframes word-to-hole {
          0% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0; filter: blur(0); }
          16% { opacity: .72; }
          70% { opacity: .58; }
          100% { transform: translate(0, 6px) scale(.2); opacity: 0; filter: blur(2px); }
        }
        @keyframes hole-breathe {
          0%, 100% { transform: scale(1); filter: saturate(.95) contrast(1.02); }
          50% { transform: scale(1.035); filter: saturate(1.05) contrast(1.08); }
        }
        @keyframes loading-grain {
          0%, 100% { opacity: .35; transform: translate3d(0,0,0); }
          50% { opacity: .55; transform: translate3d(-1%,1%,0); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(246,239,225,.10),transparent_46%)]" />

      <div className="relative grid h-[650px] w-full max-w-[920px] place-items-center overflow-hidden rounded-[42px] border border-[#f3e8d426] bg-[#f6efe1] shadow-[0_38px_120px_rgba(18,11,5,.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,252,244,.86),rgba(246,239,225,.74)_62%,rgba(230,218,199,.88))]" />
        <div className="pointer-events-none absolute inset-0 opacity-55 mix-blend-multiply [animation:loading-grain_3.2s_ease-in-out_infinite] [background-image:radial-gradient(rgba(120,90,50,.12)_1px,transparent_1px)] [background-size:22px_22px]" />
        {WORDS.map((word) => (
          <span
            key={word.text}
            className="absolute rh-display select-none text-[25px] italic tracking-wide text-[#8a6a48]/62"
            style={{
              "--x": word.x,
              "--y": word.y,
              animation: `word-to-hole 2.15s cubic-bezier(.55,0,.22,1) ${word.d} infinite`,
            } as CSSProperties}
          >
            {word.text}
          </span>
        ))}

        <div className="relative grid place-items-center">
          <div className="absolute h-48 w-80 rounded-full bg-[#5f8a5c]/12 blur-3xl" />
          <img
            src="/assets/images/rabbit-hole-hero.png"
            alt=""
            className="relative h-[330px] w-[520px] object-contain [animation:hole-breathe_2.4s_ease-in-out_infinite]"
          />
          <div className="absolute bottom-[86px] h-12 w-44 rounded-full bg-black/26 blur-2xl" />
        </div>

        <div className="absolute bottom-14 text-center">
          <div className="rh-display text-[42px] font-semibold leading-none text-[#2a2018]">Building rabbit holes</div>
          <div className="mt-3 text-[16px] italic text-[#8a7860]">Following the thread through your session.</div>
        </div>
      </div>
    </div>
  );
}
