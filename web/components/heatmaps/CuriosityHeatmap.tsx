"use client";

import { useMemo, useState } from "react";
import type { RabbitHole } from "@/lib/types";
import { ACCENTS } from "@/lib/ui";
import { heatmapDays, minutesSpent } from "@/utils/holeAnalytics";

type HeatDay = ReturnType<typeof heatmapDays>[number];

type Cell = {
  date: Date;
  key: string;
  day?: HeatDay;
  inRange: boolean;
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEK_COUNT = 5;
const DAY_MS = 86_400_000;

export function CuriosityHeatmap({ holes }: { holes: RabbitHole[] }) {
  const rawDays = heatmapDays(holes);
  const dayByKey = new Map(rawDays.map((day) => [dateKey(day.date), day]));
  const latest = rawDays.at(-1)?.date ?? new Date();
  const end = endOfWeek(latest);
  const start = new Date(end.getTime() - (WEEK_COUNT * 7 - 1) * DAY_MS);
  const cells: Cell[] = Array.from({ length: WEEK_COUNT * 7 }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY_MS);
    const key = dateKey(date);
    return { date, key, day: dayByKey.get(key), inRange: true };
  });
  const max = Math.max(...rawDays.map((day) => day.minutes), 1);
  const [selectedKey, setSelectedKey] = useState(rawDays.at(-1) ? dateKey(rawDays.at(-1)!.date) : cells.at(-1)?.key ?? "");
  const selected = dayByKey.get(selectedKey) ?? rawDays.at(-1);
  const totals = useMemo(() => summarize(holes, rawDays), [holes, rawDays]);

  return (
    <section className="rh-surface overflow-hidden rounded-[28px] border shadow-[0_2px_18px_rgba(70,45,20,.07)]">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.2em]">Curiosity heatmap</div>
              <h2 className="rh-display rh-ink mt-1 text-[34px] font-semibold leading-none">Your recent rhythm</h2>
              <p className="rh-muted mt-2 max-w-[58ch] text-[15px] leading-6">
                Each square is a day. Darker days mean more active reading time; the color follows the dominant rabbit hole.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[18px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-2">
              <MiniMetric value={`${totals.totalMinutes}m`} label="active" />
              <MiniMetric value={String(rawDays.length)} label="days" />
              <MiniMetric value={String(holes.length)} label="holes" />
            </div>
          </div>

          <div className="mt-8 overflow-x-auto pb-2">
            <div className="min-w-[720px]">
              <div className="rh-faint mb-2 grid grid-cols-[42px_repeat(5,minmax(0,1fr))] gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
                <span />
                {Array.from({ length: WEEK_COUNT }, (_, week) => {
                  const date = new Date(start.getTime() + week * 7 * DAY_MS);
                  return <span key={week}>{date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>;
                })}
              </div>
              <div className="grid grid-cols-[42px_repeat(5,minmax(0,1fr))] gap-2">
                <div className="grid grid-rows-7 gap-2 py-1">
                  {DAY_LABELS.map((label, i) => (
                    <div key={`${label}-${i}`} className="rh-faint grid h-[54px] place-items-center text-[12px] font-semibold">
                      {label}
                    </div>
                  ))}
                </div>
                {Array.from({ length: WEEK_COUNT }, (_, week) => (
                  <div key={week} className="grid grid-rows-7 gap-2">
                    {cells.slice(week * 7, week * 7 + 7).map((cell) => (
                      <HeatCell
                        key={cell.key}
                        cell={cell}
                        max={max}
                        selected={cell.key === selectedKey}
                        holes={holes}
                        onSelect={() => setSelectedKey(cell.key)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--rh-line)] pt-5">
            <div className="rh-muted flex items-center gap-2 text-[12.5px]">
              <span>Less</span>
              {[0.1, 0.28, 0.48, 0.68, 0.9].map((level) => (
                <span key={level} className="h-4 w-4 rounded-[5px] border border-[var(--rh-line)]" style={{ background: `rgba(95, 138, 92, ${level})` }} />
              ))}
              <span>More</span>
            </div>
            <div className="rh-muted text-[13px] italic">Five-week view based on active dwell time.</div>
          </div>
        </div>

        <aside className="border-t border-[#785a3224] bg-[#21170f] p-6 text-[#f3e8d4] xl:border-l xl:border-t-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#bca989]">Selected day</div>
          {selected ? (
            <DayInspector day={selected} holes={holes} />
          ) : (
            <div className="mt-5 rounded-[18px] border border-[#f3e8d41c] bg-[#1a1009] p-5 text-[15px] leading-6 text-[#cdbd9f]">
              No browsing activity has landed in this window yet.
            </div>
          )}

          <div className="mt-7 border-t border-[#f3e8d41a] pt-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#bca989]">Dominant topics</div>
            <div className="mt-4 space-y-3">
              {totals.topics.slice(0, 4).map((topic) => (
                <div key={topic.title}>
                  <div className="mb-1 flex justify-between gap-3 text-[14px]">
                    <span className="truncate font-semibold text-[#f7ead1]">{topic.title}</span>
                    <span className="tabular-nums text-[#cdbd9f]">{topic.minutes}m</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#3a2a18]">
                    <div className="h-full rounded-full" style={{ width: `${topic.pct}%`, background: ACCENTS[topic.accent].hex }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function HeatCell({ cell, max, selected, holes, onSelect }: { readonly cell: Cell; readonly max: number; readonly selected: boolean; readonly holes: RabbitHole[]; readonly onSelect: () => void }) {
  const day = cell.day;
  const hole = day ? holes.find((item) => item.title === day.topic) ?? holes[0] : undefined;
  const accent = hole ? ACCENTS[hole.accent].hex : "#d9ccb6";
  const intensity = day ? Math.max(0.18, day.minutes / max) : 0;
  const background = day
    ? `linear-gradient(145deg, ${hexWithAlpha(accent, 0.28 + intensity * 0.6)}, ${hexWithAlpha(accent, 0.12 + intensity * 0.22)}), var(--rh-surface-2)`
    : "var(--rh-surface-2)";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative h-[54px] rounded-[14px] border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(70,45,20,.12)] ${selected ? "border-[var(--rh-ink)] ring-2 ring-[var(--rh-line-strong)]" : "border-[var(--rh-line)]"}`}
      style={{ background, opacity: day ? 1 : 0.52 }}
      title={`${cell.date.toLocaleDateString()}${day ? ` · ${day.minutes}m` : " · no activity"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] font-semibold tabular-nums text-[#3a2f25]">{cell.date.getDate()}</span>
        {day && <span className="h-2 w-2 rounded-full bg-[#2a2018]/55" />}
      </div>
      {day && <div className="absolute bottom-2 left-2 right-2 truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#4c3928]/75">{day.minutes}m</div>}
    </button>
  );
}

function DayInspector({ day, holes }: { readonly day: HeatDay; readonly holes: RabbitHole[] }) {
  const titles = [...day.holes];
  const primary = holes.find((hole) => hole.title === day.topic) ?? holes[0];
  const accent = primary ? ACCENTS[primary.accent].hex : "#c79a5b";
  return (
    <div className="mt-5">
      <div className="rh-display text-[40px] font-semibold leading-none text-[#f7ead1]">
        {day.date.toLocaleDateString(undefined, { weekday: "long" })}
      </div>
      <div className="mt-1 text-[15px] text-[#bca989]">
        {day.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
      </div>
      <div className="mt-6 rounded-[20px] border border-[#f3e8d41c] bg-[#1a1009] p-5">
        <div className="text-[58px] font-semibold leading-none tabular-nums" style={{ color: accent }}>{day.minutes}</div>
        <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#bca989]">active minutes</div>
        <div className="mt-5 space-y-2">
          {titles.map((title) => (
            <div key={title} className="rounded-[12px] border border-[#f3e8d414] bg-[#21170f] px-3 py-2 text-[14px] font-semibold text-[#f7ead1]">
              {title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <div className="min-w-[76px] rounded-[13px] bg-[var(--rh-surface)] px-3 py-2 text-center">
      <div className="rh-display rh-ink text-[23px] font-semibold leading-none">{value}</div>
      <div className="rh-faint mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</div>
    </div>
  );
}

function summarize(holes: RabbitHole[], days: HeatDay[]) {
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const byTopic = holes
    .map((hole) => ({ title: hole.title, minutes: minutesSpent(hole), accent: hole.accent }))
    .sort((a, b) => b.minutes - a.minutes);
  const topMinutes = Math.max(byTopic[0]?.minutes ?? 1, 1);
  return {
    totalMinutes,
    topics: byTopic.map((topic) => ({ ...topic, pct: Math.max(6, Math.round((topic.minutes / topMinutes) * 100)) })),
  };
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  return new Date(d.getTime() + (6 - day) * DAY_MS);
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, "0");
  return `#${value}${a}`;
}
