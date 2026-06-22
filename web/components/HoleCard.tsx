"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { RabbitHole } from "@/lib/types";
import { ACCENTS, KIND_META, faviconFor } from "@/lib/ui";
import { relativeTime } from "@/lib/format";
import { StatusBadge } from "./atoms";

export function HoleCard({
  hole,
  index,
  onFavorite,
  onArchive,
  onDelete,
  selected,
  onSelect,
}: {
  hole: RabbitHole;
  index: number;
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/holes/${hole.id}`} className="group block">
        <div className={`relative min-h-[292px] overflow-hidden rounded-[20px] border bg-[#fbf6ec] p-6 text-left shadow-[0_2px_18px_rgba(70,45,20,.06)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_36px_rgba(70,45,20,.14)] ${selected ? "border-[#5f8a5c] ring-2 ring-[#5f8a5c33]" : "border-[#785a3224]"}`}>
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
                    className={`grid h-7 w-7 place-items-center rounded-full border text-[13px] transition ${selected ? "border-[#5f8a5c66] bg-[#e5efe0] text-[#37502f]" : "border-[#785a3224] bg-[#f6efe1] text-[#8a7860]"}`}
                  >
                    {selected ? "✓" : ""}
                  </button>
                )}
                <span className="text-[13px] text-[#a8967d]">{relativeTime(hole.lastActive)}</span>
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
                        className="grid h-7 w-7 place-items-center rounded-full border border-[#785a3224] bg-[#f6efe1] text-[13px] text-[#8a7860] transition hover:text-[#c2703f]"
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
                        className="grid h-7 w-7 place-items-center rounded-full border border-[#785a3224] bg-[#f6efe1] text-[13px] text-[#8a7860] transition hover:text-[#2a2018]"
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
                        className="grid h-7 w-7 place-items-center rounded-full border border-[#b8795f33] bg-[#fff6f1] text-[13px] text-[#a8472a] transition hover:bg-[#fde8dc]"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <h3 className="rh-display text-[23px] font-semibold leading-[1.12] tracking-normal text-[#2a2018]">
              {hole.title}
            </h3>
            <p className="mt-2 min-h-[46px] text-[15.5px] leading-[1.5] text-[#6a5a48]">
              {hole.description}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#785a321f]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round(hole.confidence * 100)}%`, background: `linear-gradient(90deg,${accent.hex},${accent.soft})` }}
                />
              </div>
              <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: accent.hex }}>
                {Math.round(hole.confidence * 100)}<span className="font-normal text-[#a8967d]"> match</span>
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-[#785a321f] pt-4">
              {counts.map((k) => (
                <div key={k.label} className="inline-flex items-baseline gap-1 rounded-[9px] bg-[#f2e9d6] px-2.5 py-1.5">
                  <span className="text-[15px] font-semibold tabular-nums text-[#2a2018]">{k.n}</span>
                  <span className="text-[12.5px] text-[#8a7860]">{k.label}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1">
                {hole.pages.slice(0, 4).map((p) => {
                  const meta = KIND_META[p.kind];
                  return (
                    <span
                      key={p.id}
                      title={p.domain}
                      className="grid h-6 w-6 place-items-center overflow-hidden rounded-[7px] border border-[#785a3229] bg-white text-[11px] font-semibold"
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
                  <img key={d} src={faviconFor(d)} alt={d} className="h-7 w-7 rounded-full border border-[#fbf6ec] bg-white" />
                ))}
              </div>
              <span className="text-[13px] text-[#6a5a48] opacity-0 transition group-hover:opacity-100">
                Open →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
