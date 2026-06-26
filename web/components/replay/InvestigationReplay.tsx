"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { RabbitHole } from "@/lib/types";
import { KIND_META } from "@/lib/ui";
import { clockTime } from "@/lib/format";
import { cleanTimelineEvents } from "@/lib/timeline";
import type { PlaybackState } from "@/types/features";

export function InvestigationReplay({ hole }: { hole: RabbitHole }) {
  const events = useMemo(() => cleanTimelineEvents(hole.timeline), [hole.timeline]);
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
    <section className="rh-surface overflow-hidden rounded-[20px] border shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="border-b border-[var(--rh-line)] px-5 py-4">
        <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.18em]">Replay</div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <h2 className="rh-display rh-ink text-[25px] font-semibold">Investigation replay</h2>
          <div className="flex gap-2">
            <button onClick={state === "playing" ? pause : play} className="rh-primary rounded-full px-5 py-2.5 text-[14px] font-semibold transition hover:-translate-y-0.5">
              {state === "playing" ? "Pause" : "Play"}
            </button>
            <button onClick={stop} className="rh-surface-2 rounded-full border px-4 py-2.5 text-[14px] font-semibold">Stop</button>
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
            className="mb-5 h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--rh-line-strong)] accent-[var(--rh-primary)]"
          />
          <div className="relative ml-2 space-y-2 border-l border-[var(--rh-line-strong)] pl-6">
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
                  <span className="absolute -left-[33px] top-3 grid h-5 w-5 place-items-center rounded-full border bg-[var(--rh-surface)] text-[10px]" style={{ borderColor: active ? meta.color : `${meta.color}66`, color: meta.color, boxShadow: active ? `0 0 0 5px ${meta.color}20` : undefined }}>{meta.glyph}</span>
                  <div className="flex min-w-0 gap-4">
                    <span className="w-12 shrink-0 font-mono text-[12px] tabular-nums text-[var(--rh-faint)]">{clockTime(event.at)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold text-[var(--rh-ink)]">{event.title}</div>
                      {event.detail ? <div className="mt-0.5 line-clamp-2 text-[12.5px] text-[var(--rh-muted)]">{event.detail}</div> : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div key={current.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="border-t border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-6 lg:border-l lg:border-t-0">
          <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.18em]">Now replaying</div>
          <div className="rh-display rh-ink mt-4 text-[34px] font-semibold leading-none">{clockTime(current.at)}</div>
          <div className="rh-ink mt-4 line-clamp-3 text-[20px] font-semibold leading-tight">{current.title}</div>
          {current.detail ? <div className="rh-muted mt-2 line-clamp-4 text-[14px]">{current.detail}</div> : null}
          <div className="rh-muted mt-6 text-[13px]">Step {index + 1} of {events.length}</div>
        </motion.div>
      </div>
    </section>
  );
}
