"use client";

import Link from "next/link";
import type { RabbitHole } from "@/lib/types";
import { ACCENTS } from "@/lib/ui";
import { dayLabel } from "@/lib/format";
import { heatmapDays } from "@/utils/holeAnalytics";

export function CuriosityHeatmap({ holes }: { holes: RabbitHole[] }) {
  const days = heatmapDays(holes);
  const max = Math.max(...days.map((day) => day.minutes), 1);

  return (
    <section className="rounded-[22px] border border-[#785a3224] bg-[#fbf6ec] p-5 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">Curiosity heatmap</div>
          <h2 className="rh-display mt-1 text-[27px] font-semibold text-[#2a2018]">Exploration habits</h2>
        </div>
        <Link href="/heatmap" className="rounded-full border border-[#785a3224] bg-[#f2e9d6] px-4 py-2 text-[13px] font-semibold text-[#5a4a38] no-underline">Open heatmap</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const hole = holes.find((item) => item.title === day.topic) ?? holes[0];
          const accent = hole ? ACCENTS[hole.accent].hex : "#8d7356";
          const opacity = 0.18 + (day.minutes / max) * 0.72;
          return (
            <div key={day.date.toISOString()} className="min-h-[112px] rounded-[17px] border border-[#785a321f] p-3" style={{ background: `linear-gradient(180deg, ${accent}${Math.round(opacity * 255).toString(16).padStart(2, "0")}, #f6efe1)` }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6a5a48]">{dayLabel(day.date.toISOString())}</div>
              <div className="mt-5 rh-display text-[27px] font-semibold leading-none text-[#2a2018]">{day.minutes}m</div>
              <div className="mt-2 text-[12px] leading-tight text-[#5a4a38]">{[...day.holes].join(" · ")}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
