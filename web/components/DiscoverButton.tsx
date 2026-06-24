"use client";

import { clusterHoleToRabbitHole, hasMeaningfulNewContext, holeToDiscovery, markDiscoverySeen, nextUnseenDiscovery, rememberClusterContext, runCluster } from "@/lib/discovery";
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
      if (!hasMeaningfulNewContext(cluster)) {
        setLabel("No new browsing yet");
        return;
      }
      setLiveHoles(cluster.holes.map((hole) => clusterHoleToRabbitHole(hole, cluster.pages, cluster.searches)));
      rememberClusterContext(cluster);
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
        className="rh-surface group relative overflow-hidden rounded-[14px] border px-4 py-2.5 text-[13px] font-semibold shadow-[0_4px_18px_rgba(70,45,20,.08)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(70,45,20,.13)] disabled:cursor-wait disabled:opacity-65"
      >
        <span className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(80%_120%_at_20%_20%,rgba(180,143,88,.26),transparent_55%),radial-gradient(90%_120%_at_90%_80%,rgba(95,138,92,.18),transparent_58%)]" />
        <span className="relative inline-flex items-center gap-2">{label}</span>
      </button>
      {busy && <RabbitHoleLoading />}
    </>
  );
}

const WORDS = [
  { text: "tabs", x: "-270px", y: "-132px", d: "0s" },
  { text: "searches", x: "246px", y: "-112px", d: ".18s" },
  { text: "notes", x: "-238px", y: "4px", d: ".34s" },
  { text: "links", x: "238px", y: "22px", d: ".52s" },
  { text: "threads", x: "-220px", y: "124px", d: ".7s" },
  { text: "questions", x: "226px", y: "124px", d: ".9s" },
  { text: "ideas", x: "-74px", y: "-180px", d: "1.08s" },
  { text: "context", x: "96px", y: "-172px", d: "1.24s" },
];

function RabbitHoleLoading() {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-[#140d08]/72 px-4 backdrop-blur-[8px]">
      <style>{`
        @keyframes word-to-hole {
          0% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0; filter: blur(0); }
          16% { opacity: .62; }
          66% { opacity: .44; }
          100% { transform: translate(0, 18px) scale(.22); opacity: 0; filter: blur(2.2px); }
        }
        @keyframes hole-breathe {
          0%, 100% { transform: scale(1); filter: saturate(.98) contrast(1.02); }
          50% { transform: scale(1.025); filter: saturate(1.05) contrast(1.08); }
        }
        @keyframes loading-grain {
          0%, 100% { opacity: .28; transform: translate3d(0,0,0); }
          50% { opacity: .42; transform: translate3d(-1%,1%,0); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(246,239,225,.10),transparent_38%)]" />

      <div className="relative flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[34px] border border-[#f3e8d442] bg-[#f7edda] shadow-[0_40px_130px_rgba(18,11,5,.58)]">
        {/* Scene — cream paper fills the whole upper region, sprite centered, words converging into the hole */}
        <div className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(255,252,244,.94),rgba(246,239,225,.82)_64%,rgba(226,213,193,.92))] px-6 pt-10 pb-14">
          <div className="pointer-events-none absolute inset-0 opacity-65 mix-blend-multiply [animation:loading-grain_3.2s_ease-in-out_infinite] [background-image:radial-gradient(rgba(120,90,50,.13)_1.1px,transparent_1.1px)] [background-size:24px_24px]" />

          <div className="relative grid place-items-center">
            <div className="absolute h-52 w-[420px] rounded-full bg-[#5f8a5c]/12 blur-3xl" />
            {WORDS.map((word) => (
              <span
                key={word.text}
                className="absolute left-1/2 top-1/2 rh-display select-none text-[24px] italic tracking-wide text-[#8a6a48]/54"
                style={{
                  "--x": word.x,
                  "--y": word.y,
                  animation: `word-to-hole 2.15s cubic-bezier(.55,0,.22,1) ${word.d} infinite`,
                } as CSSProperties}
              >
                {word.text}
              </span>
            ))}
            <img
              src="/assets/images/rabbit-hole-hero.png"
              alt=""
              className="relative h-auto w-[460px] max-h-[40vh] max-w-full object-contain [animation:hole-breathe_2.4s_ease-in-out_infinite]"
            />
            <div className="absolute bottom-[40px] h-12 w-52 rounded-full bg-black/24 blur-2xl" />
          </div>
        </div>

        <div className="shrink-0 border-t border-[#f3e8d43b] bg-[#18100a] px-8 py-9 text-center">
          <div className="mx-auto mb-6 h-1.5 max-w-[520px] overflow-hidden rounded-full bg-[#3a2a18]">
            <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,#c79a5b,#d8835a)] [animation:hole-breathe_1.6s_ease-in-out_infinite]" />
          </div>
          <div className="rh-display text-[44px] font-semibold leading-none text-[#f8ecd6]">Building rabbit holes</div>
          <div className="mt-3 text-[17px] italic text-[#b8a486]">Following the thread through your session.</div>
        </div>
      </div>
    </div>
  );
}
