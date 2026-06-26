"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { PageVisit, RabbitHole } from "@/lib/types";
import { KIND_META, faviconFor } from "@/lib/ui";
import { getNavigationPath, getSourceSearch } from "@/utils/holeAnalytics";

export function DiscoveryPathPanel({ hole }: { hole: RabbitHole }) {
  const [selectedId, setSelectedId] = useState(hole.pages[0]?.id ?? "");
  const selected = hole.pages.find((page) => page.id === selectedId) ?? hole.pages[0];
  const path = useMemo(() => (selected ? getNavigationPath(hole, selected.id) : []), [hole, selected]);
  const source = selected ? getSourceSearch(hole, selected) : undefined;

  if (!selected) return null;

  return (
    <section className="rh-surface rounded-[20px] border p-5 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.18em]">How did I get here?</div>
          <h2 className="rh-display rh-ink mt-1 text-[25px] font-semibold">Discovery chain</h2>
        </div>
        <select
          value={selected.id}
          onChange={(event) => setSelectedId(event.target.value)}
          className="max-w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] px-3 py-2 text-[14px] text-[var(--rh-ink)] outline-none"
        >
          {hole.pages.map((page) => (
            <option key={page.id} value={page.id}>{page.title}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-[18px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-4">
          <div className="space-y-3">
            {path.map((step, index) => {
              const meta = KIND_META[step.kind];
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex items-start gap-3"
                >
                  {index < path.length - 1 ? <span className="absolute left-4 top-9 h-[calc(100%+4px)] w-px bg-[var(--rh-line-strong)]" /> : null}
                  <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-[var(--rh-surface)] text-[13px]" style={{ borderColor: `${meta.color}66`, color: meta.color }}>
                    {meta.glyph}
                  </span>
                  <div className="min-w-0 rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface)] px-4 py-3 shadow-[0_1px_8px_rgba(70,45,20,.04)]">
                    <div className="truncate text-[15px] font-semibold text-[var(--rh-ink)]">{step.label.replace(/^Search: /, "")}</div>
                    <div className="mt-1 truncate text-[12.5px] text-[var(--rh-muted)]">{meta.label}{step.detail ? ` · ${step.detail}` : ""}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[18px] bg-[#2a2018] p-5 text-[#f3e8d4]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cdbb9e]">Source</div>
          <div className="mt-3 text-[19px] font-semibold leading-tight">{source?.query ?? "Direct visit"}</div>
          <div className="mt-4 flex items-center gap-2 text-[13px] text-[#dcccb3]">
            <img src={faviconFor(selected.domain)} alt="" className="h-4 w-4 rounded" />
            {selected.domain} · {Math.round(selected.dwellSeconds / 60)}m active
          </div>
          <a
            href={selected.url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-w-[128px] items-center justify-center rounded-[12px] border border-[#dcccb3]/35 bg-transparent px-4 py-2.5 text-center text-[13px] font-semibold leading-none text-[#f3e8d4] no-underline transition hover:border-[#f3e8d4]/70 hover:bg-[#f3e8d4]/10"
            aria-label={`Open ${selected.title}`}
          >
            Open page ↗
          </a>
        </div>
      </div>
    </section>
  );
}
