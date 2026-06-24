"use client";

import type { RabbitHole } from "@/lib/types";
import { ACCENTS } from "@/lib/ui";
import { activityBreakdown, sourceBreakdown, topicBreakdown } from "@/utils/holeAnalytics";

export function SessionDNA({ hole }: { hole: RabbitHole }) {
  const accent = ACCENTS[hole.accent];
  return (
    <section className="rounded-[20px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-5 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="mb-5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--rh-faint)]">Session DNA</div>
        <h2 className="rh-display mt-1 text-[25px] font-semibold text-[var(--rh-ink)]">What this hole was made of</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="Topics" items={topicBreakdown(hole)} color={accent.hex} />
        <Breakdown title="Sources" items={sourceBreakdown(hole)} color="#8d7356" />
        <Breakdown title="Activity" items={activityBreakdown(hole)} color="#5f8a5c" />
      </div>
    </section>
  );
}

function Breakdown({ title, items, color }: { title: string; items: { label: string; pct: number }[]; color: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-4">
      <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--rh-faint)]">{title}</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[14px]">
              <span className="truncate font-semibold text-[var(--rh-ink)] capitalize">{item.label}</span>
              <span className="font-mono text-[12px] text-[var(--rh-muted)]">{item.pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--rh-surface-3)]">
              <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: `linear-gradient(90deg,${color},#d7b079)` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
