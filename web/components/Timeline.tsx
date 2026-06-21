"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { TimelineEvent } from "@/lib/types";
import { KIND_META } from "@/lib/ui";
import { clockTime } from "@/lib/format";

export function Timeline({
  events,
  accentHex,
  scrub = true,
}: {
  events: TimelineEvent[];
  accentHex: string;
  scrub?: boolean;
}) {
  const [head, setHead] = useState(events.length - 1);
  const sorted = [...events].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  return (
    <div>
      {scrub && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border hairline card-surface px-4 py-3">
          <span className="text-[11.5px] uppercase tracking-wide text-haze-400">Replay</span>
          <input
            type="range"
            min={0}
            max={sorted.length - 1}
            value={head}
            onChange={(e) => setHead(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-ink-600 accent-rabbit"
            style={{ accentColor: accentHex }}
          />
          <span className="w-16 text-right font-mono text-[12px] tabular-nums text-haze-200">
            {clockTime(sorted[head].at)}
          </span>
        </div>
      )}

      <div className="relative pl-7">
        <div
          className="absolute bottom-1 left-[10px] top-1 w-px"
          style={{ background: "linear-gradient(to bottom, #26262d, transparent)" }}
        />
        <div className="space-y-1">
          {sorted.map((ev, i) => {
            const m = KIND_META[ev.kind];
            const dim = scrub && i > head;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: dim ? 0.32 : 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="relative flex items-start gap-4 py-2"
              >
                <span
                  className="absolute -left-7 mt-0.5 grid h-5 w-5 place-items-center rounded-full border text-[10px]"
                  style={{
                    background: "#0c0c0e",
                    borderColor: `${m.color}55`,
                    color: m.color,
                    boxShadow: i === head && scrub ? `0 0 0 4px ${m.color}22` : undefined,
                  }}
                >
                  {m.glyph}
                </span>
                <span className="w-12 shrink-0 pt-0.5 font-mono text-[11.5px] tabular-nums text-haze-400">
                  {clockTime(ev.at)}
                </span>
                <div className="min-w-0">
                  <div className="text-[13.5px] text-haze-100">{ev.title}</div>
                  {ev.detail && (
                    <div className="text-[11.5px] text-haze-400">{ev.detail}</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
