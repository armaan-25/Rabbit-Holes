"use client";

import Link from "next/link";
import type { RabbitHole } from "@/lib/types";
import { ACCENTS, KIND_META, faviconFor } from "@/lib/ui";
import { relativeTime } from "@/lib/format";
import { StatusBadge } from "./atoms";

export function HoleCard({
  hole,
  onFavorite,
  onArchive,
  onDelete,
  selected,
  onSelect,
}: {
  hole: RabbitHole;
  onFavorite?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}) {
  const accent = ACCENTS[hole.accent];
  const repos = hole.entities.filter((e) => e.kind === "repo").length || hole.summary.repos.length;
  const papers = hole.pages.filter((p) => p.kind === "paper").length;
  const companies = hole.summary.companies.length;
  const counts = [
    { n: hole.pages.length, label: "pages" },
    { n: hole.searches.length, label: "searches" },
    repos > 0 ? { n: repos, label: repos === 1 ? "repo" : "repos" } : null,
    papers > 0 ? { n: papers, label: papers === 1 ? "paper" : "papers" } : null,
    companies > 0 && repos === 0 ? { n: companies, label: "companies" } : null,
  ].filter(Boolean) as { n: number; label: string }[];

  return (
    <div>
      <Link href={`/holes/${hole.id}`} className="group block">
        <div className={`rh-surface relative min-h-[292px] overflow-hidden rounded-[20px] border p-6 text-left shadow-[0_2px_18px_rgba(70,45,20,.06)] transition duration-200 group-hover:border-[var(--rh-line-strong)] ${selected ? "border-[#5f8a5c] ring-2 ring-[#5f8a5c33]" : ""}`}>
          {hole.status === "active" && (
            <>
              <div className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[0_0_0_1px_rgba(95,138,92,.24),0_12px_34px_rgba(95,138,92,.12)]" />
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-[linear-gradient(#6fa36a,#5f8a5c)]" />
            </>
          )}
          <div className="relative">
            <div className="mb-4 flex items-center justify-between gap-3">
              <StatusBadge status={hole.status} />
              <div className="flex items-center gap-2">
                {onSelect && (
                  <button
                    type="button"
                    title={selected ? "Deselect" : "Select"}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect(hole.id, !selected);
                    }}
                    className={`grid h-7 w-7 place-items-center rounded-full border text-[13px] transition ${selected ? "border-[#5f8a5c66] bg-[#e5efe0] text-[#37502f]" : "rh-surface-2 text-[var(--rh-muted)]"}`}
                  >
                    {selected ? "✓" : ""}
                  </button>
                )}
                <span className="rh-faint text-[13px]">{relativeTime(hole.lastActive)}</span>
                {(onFavorite || onArchive || onDelete) && (
                  <div className="flex items-center gap-1 opacity-80 transition group-hover:opacity-100">
                    {onFavorite && (
                      <button
                        type="button"
                        title={hole.favorite ? "Unfavorite" : "Favorite"}
                        onClick={(e) => {
                          e.preventDefault();
                          onFavorite(hole.id);
                        }}
                        className="rh-surface-2 grid h-7 w-7 place-items-center rounded-full border text-[13px] text-[var(--rh-muted)] transition hover:text-[#c2703f]"
                      >
                        {hole.favorite ? "★" : "☆"}
                      </button>
                    )}
                    {onArchive && (
                      <button
                        type="button"
                        title={hole.archived ? "Restore" : "Archive"}
                        onClick={(e) => {
                          e.preventDefault();
                          onArchive(hole.id);
                        }}
                        className="rh-surface-2 grid h-7 w-7 place-items-center rounded-full border text-[13px] text-[var(--rh-muted)] transition hover:text-[var(--rh-ink)]"
                      >
                        {hole.archived ? "↥" : "⌄"}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        title="Delete"
                        onClick={(e) => {
                          e.preventDefault();
                          if (window.confirm(`Delete "${hole.title}"?`)) onDelete(hole.id);
                        }}
                        className="grid h-7 w-7 place-items-center rounded-full border border-[#b8795f33] bg-[#b8795f14] text-[13px] text-[#a8472a] transition hover:bg-[#b8795f20]"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <h3 className="rh-display rh-ink line-clamp-2 text-[23px] font-semibold leading-[1.12] tracking-normal">
              {hole.title}
            </h3>
            <p className="rh-muted mt-2 line-clamp-3 min-h-[46px] text-[15.5px] leading-[1.5]">
              {hole.description}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--rh-line)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round(hole.confidence * 100)}%`, background: `linear-gradient(90deg,${accent.hex},${accent.soft})` }}
                />
              </div>
              <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: accent.hex }}>
                {Math.round(hole.confidence * 100)}<span className="font-normal text-[var(--rh-faint)]"> match</span>
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--rh-line)] pt-4">
              {counts.map((k) => (
                <div key={k.label} className="inline-flex items-baseline gap-1 rounded-[9px] bg-[var(--rh-surface-2)] px-2.5 py-1.5">
                  <span className="text-[15px] font-semibold tabular-nums text-[var(--rh-ink)]">{k.n}</span>
                  <span className="text-[12.5px] text-[var(--rh-muted)]">{k.label}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1">
                {hole.pages.slice(0, 4).map((p) => {
                  const meta = KIND_META[p.kind];
                  return (
                    <span
                      key={p.id}
                      title={p.domain}
                      className="grid h-6 w-6 place-items-center overflow-hidden rounded-[7px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] text-[11px] font-semibold"
                      style={{ color: meta.color }}
                    >
                      {p.domain && p.domain !== "unknown" ? (
                        <img src={faviconFor(p.domain)} alt="" className="h-4 w-4 rounded-sm" />
                      ) : (
                        meta.glyph
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex -space-x-2">
                {hole.domains.slice(0, 4).map((d) => (
                  <img key={d} src={faviconFor(d)} alt={d} className="h-7 w-7 rounded-full border border-[var(--rh-surface)] bg-[var(--rh-surface-3)]" />
                ))}
              </div>
              <span className="rh-muted text-[13px]">
                Open →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
