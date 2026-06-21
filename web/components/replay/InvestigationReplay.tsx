"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { RabbitHole } from "@/lib/types";
import { KIND_META } from "@/lib/ui";
import { clockTime } from "@/lib/format";
import type { PlaybackState } from "@/types/features";

export function InvestigationReplay({ hole }: { hole: RabbitHole }) {
  const events = useMemo(() => [...hole.timeline].sort((a, b) => +new Date(a.at) - +new Date(b.at)), [hole.timeline]);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<PlaybackState>("idle");
  const current = events[index] ?? events[0];

  useEffect(() => {
    if (state !== "playing") return;
    const timer = window.setTimeout(() => {
      setIndex((value) => {
        if (value >= events.length - 1) {
          setState("finished");
          return value;
        }
        return value + 1;
      });
    }, 950);
    return () => window.clearTimeout(timer);
  }, [events.length, index, state]);

  if (!events.length) return null;

  function play() {
    if (state === "finished") setIndex(0);
    setState("playing");
  }

  function pause() {
    setState("paused");
  }

  function stop() {
    setIndex(0);
    setState("idle");
  }

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#785a3224] bg-[#fbf6ec] shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="border-b border-[#785a321f] px-5 py-4">
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">Replay</div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <h2 className="rh-display text-[25px] font-semibold text-[#2a2018]">Investigation replay</h2>
          <div className="flex gap-2">
            <button onClick={state === "playing" ? pause : play} className="rounded-full bg-[#2a2018] px-5 py-2.5 text-[14px] font-semibold text-[#f3e8d4] transition hover:-translate-y-0.5">
              {state === "playing" ? "Pause" : "Play"}
            </button>
            <button onClick={stop} className="rounded-full border border-[#785a3224] bg-[#f2e9d6] px-4 py-2.5 text-[14px] font-semibold text-[#5a4a38]">Stop</button>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="p-5">
          <input
            type="range"
            min={0}
            max={events.length - 1}
            value={index}
            onChange={(event) => {
              setIndex(Number(event.target.value));
              setState("paused");
            }}
            className="mb-5 h-1 w-full cursor-pointer appearance-none rounded-full bg-[#d8c3a1] accent-[#2a2018]"
          />
          <div className="relative ml-2 space-y-2 border-l border-[#cdbb9e] pl-6">
            {events.map((event, i) => {
              const meta = KIND_META[event.kind];
              const active = i === index;
              const passed = i <= index;
              return (
                <motion.div
                  key={event.id}
                  animate={{ opacity: passed ? 1 : 0.34, x: active ? 4 : 0 }}
                  className="relative py-2"
                >
                  <span className="absolute -left-[33px] top-3 grid h-5 w-5 place-items-center rounded-full border bg-[#fbf6ec] text-[10px]" style={{ borderColor: active ? meta.color : `${meta.color}66`, color: meta.color, boxShadow: active ? `0 0 0 5px ${meta.color}20` : undefined }}>{meta.glyph}</span>
                  <div className="flex gap-4">
                    <span className="w-12 shrink-0 font-mono text-[12px] tabular-nums text-[#a8967d]">{clockTime(event.at)}</span>
                    <div>
                      <div className="text-[15px] font-semibold text-[#2a2018]">{event.title}</div>
                      {event.detail ? <div className="mt-0.5 text-[12.5px] text-[#8a7860]">{event.detail}</div> : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div key={current.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="border-t border-[#785a321f] bg-[#f6efe1] p-6 lg:border-l lg:border-t-0">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">Now replaying</div>
          <div className="mt-4 rh-display text-[34px] font-semibold leading-none text-[#2a2018]">{clockTime(current.at)}</div>
          <div className="mt-4 text-[20px] font-semibold leading-tight text-[#2a2018]">{current.title}</div>
          {current.detail ? <div className="mt-2 text-[14px] text-[#6a5a48]">{current.detail}</div> : null}
          <div className="mt-6 text-[13px] text-[#8a7860]">Step {index + 1} of {events.length}</div>
        </motion.div>
      </div>
    </section>
  );
}
