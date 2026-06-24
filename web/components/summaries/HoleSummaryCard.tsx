"use client";

import type { RabbitHole } from "@/lib/types";
import { ACCENTS } from "@/lib/ui";
import { minutesSpent } from "@/utils/holeAnalytics";

export function HoleSummaryCard({ hole, publicMode = false }: { hole: RabbitHole; publicMode?: boolean }) {
  const accent = ACCENTS[hole.accent];
  const minutes = minutesSpent(hole);
  const hours = Math.max(minutes / 60, 0.1).toFixed(1);
  const question = hole.summary.questions[0] ?? hole.description;

  return (
    <section className="overflow-hidden rounded-[24px] border border-[var(--rh-line)] bg-[var(--rh-surface)] shadow-[0_18px_50px_rgba(70,45,20,.10)]">
      <div className="relative p-7 sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl" style={{ background: `${accent.hex}24` }} />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface-2)] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--rh-faint)]">
            <span className="h-2 w-2 rounded-full" style={{ background: accent.hex }} />
            {publicMode ? "Shared rabbit hole" : "End-of-hole summary"}
          </div>
          <h2 className="rh-display max-w-[12ch] text-[44px] font-semibold leading-none text-[var(--rh-ink)]">{hole.title}</h2>
          <p className="mt-4 max-w-2xl text-[18px] italic leading-7 text-[var(--rh-muted)]">{question}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <Metric label="Visited" value={`${hole.pages.length}`} sub="pages" />
            <Metric label="Searched" value={`${hole.searches.length}`} sub="queries" />
            <Metric label="Time spent" value={hours} sub="hours" />
            <Metric label="Confidence" value={`${Math.round(hole.confidence * 100)}%`} sub="match" />
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Block title="Key concepts" items={hole.summary.topics} />
            <Block title="Key repos" items={hole.summary.repos.length ? hole.summary.repos : hole.summary.companies} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rh-faint)]">{label}</div>
      <div className="mt-2 rh-display text-[34px] font-semibold leading-none text-[var(--rh-ink)]">{value}</div>
      <div className="mt-1 text-[13px] text-[var(--rh-muted)]">{sub}</div>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[18px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-5">
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--rh-faint)]">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 6).map((item) => (
          <span key={item} className="rounded-full bg-[var(--rh-primary)] px-3 py-1.5 text-[13.5px] font-semibold text-[var(--rh-primary-text)]">{item}</span>
        ))}
      </div>
    </div>
  );
}
