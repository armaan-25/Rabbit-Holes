"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ACCENTS, KIND_META } from "@/lib/ui";
import { clockTime, dayLabel } from "@/lib/format";
import { useHoles } from "@/hooks/useHoles";
import { EmptyHolesPage } from "@/components/EmptyHoles";
import { CuriosityHeatmap } from "@/components/heatmaps/CuriosityHeatmap";

interface Row {
  id: string;
  at: string;
  title: string;
  detail?: string;
  kind: keyof typeof KIND_META;
  holeId: string;
  holeTitle: string;
  accent: keyof typeof ACCENTS;
}

export default function TimelinePage() {
  const [filter, setFilter] = useState<string | null>(null);
  const holes = useHoles();

  const groups = useMemo(() => {
    const rows: Row[] = holes.flatMap((h) =>
      h.timeline.map((ev) => ({
        ...ev,
        kind: ev.kind as keyof typeof KIND_META,
        holeId: h.id,
        holeTitle: h.title,
        accent: h.accent,
      }))
    )
      .filter((r) => !filter || r.holeId === filter)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));

    const byDay = new Map<string, Row[]>();
    for (const r of rows) {
      const key = dayLabel(r.at);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(r);
    }
    return [...byDay.entries()];
  }, [filter, holes]);

  if (holes.length === 0) {
    return <EmptyHolesPage eyebrow="Timeline" title="No timeline yet" hint="Browse with the extension on and your searches and pages will replay here in the order they happened." />;
  }

  return (
    <div className="rh-paper min-h-screen px-5 py-8 sm:px-8 xl:px-12">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="rh-faint mb-2 text-[12px] font-semibold uppercase tracking-[0.22em]">Timeline</div>
            <h1 className="rh-display rh-ink text-[42px] font-semibold leading-none">Replay your curiosity</h1>
            <p className="rh-muted mt-3 max-w-2xl text-[16px] leading-relaxed">Every investigation, in the order it actually happened.</p>
          </div>
          <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-1">
            <Chip on={!filter} onClick={() => setFilter(null)} label="All" />
            {holes.map((h) => (
              <Chip key={h.id} on={filter === h.id} onClick={() => setFilter(h.id)} label={h.title} color={ACCENTS[h.accent].hex} />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <CuriosityHeatmap holes={holes} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="rh-surface sticky top-8 rounded-[18px] border p-5 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
              <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.16em]">Captured</div>
              <div className="mt-4 space-y-4">
                <SideStat n={groups.reduce((a, [, rows]) => a + rows.length, 0)} label="events" />
                <SideStat n={holes.length} label="holes" />
                <SideStat n={holes.reduce((a, h) => a + h.pages.length, 0)} label="pages" />
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            {groups.map(([day, rows]) => (
              <section key={day}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="rh-faint text-[12px] font-semibold uppercase tracking-[0.16em]">{day}</span>
                  <span className="h-px flex-1 bg-[var(--rh-line)]" />
                  <span className="rh-faint text-[12px]">{rows.length} events</span>
                </div>
                <div className="rh-surface relative rounded-[18px] border px-5 py-4 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
                  <div className="absolute bottom-6 left-[31px] top-6 w-px bg-[var(--rh-line)]" />
                  {rows.map((r, i) => {
                    const m = KIND_META[r.kind];
                    const accent = ACCENTS[r.accent];
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="relative grid grid-cols-[28px_56px_minmax(0,1fr)] items-start gap-3 py-3 sm:grid-cols-[36px_64px_minmax(0,1fr)_minmax(0,180px)]">
                        <span className="relative z-10 grid h-5 w-5 place-items-center rounded-full border bg-[var(--rh-surface)] text-[10px]" style={{ borderColor: `${m.color}66`, color: m.color }}>{m.glyph}</span>
                        <span className="pt-0.5 font-mono text-[12px] tabular-nums text-[var(--rh-faint)]">{clockTime(r.at)}</span>
                        <div className="min-w-0">
                          <div className="truncate text-[15.5px] leading-tight text-[var(--rh-ink)]">{r.title}</div>
                          {r.detail && <div className="mt-1 line-clamp-2 text-[13px] text-[var(--rh-muted)]">{r.detail}</div>}
                        </div>
                        <Link href={`/holes/${r.holeId}`} className="hidden min-w-0 items-center gap-1.5 rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 py-1 text-[12px] text-[var(--rh-muted)] transition hover:text-[var(--rh-ink)] sm:flex">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent.hex }} />
                          <span className="truncate">{r.holeTitle}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ on, onClick, label, color }: { on: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button onClick={onClick} className={`max-w-[220px] truncate whitespace-nowrap rounded-[9px] px-4 py-2 text-[14px] transition ${on ? "bg-[var(--rh-surface)] font-semibold text-[var(--rh-ink)] shadow-[0_1px_3px_rgba(70,45,20,.1)]" : "text-[var(--rh-muted)] hover:bg-[var(--rh-surface)]/55"}`}>
      {color && <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: color }} />}
      {label}
    </button>
  );
}

function SideStat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="rh-display rh-ink text-[34px] font-semibold leading-none">{n}</div>
      <div className="rh-faint mt-1 text-[12px] uppercase tracking-[0.14em]">{label}</div>
    </div>
  );
}
