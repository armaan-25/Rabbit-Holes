"use client";

import { useState } from "react";
import Link from "next/link";
import type { RabbitHole, PageVisit } from "@/lib/types";
import { ACCENTS, KIND_META, STATUS_META, faviconFor } from "@/lib/ui";
import { clockTime, relativeTime } from "@/lib/format";
import { EntityChip } from "./atoms";
import { RestoreModal } from "./RestoreModal";
import { AskHole } from "./AskHole";
import { HoleBrief } from "./HoleBrief";
import { HoleMapView } from "./HoleMapView";
import { DiscoveryPathPanel } from "./discovery/DiscoveryPathPanel";
import { InvestigationReplay } from "./replay/InvestigationReplay";
import { HoleSummaryCard } from "./summaries/HoleSummaryCard";
import { SessionDNA } from "./summaries/SessionDNA";
import { ShareRabbitHole } from "./shared/ShareRabbitHole";

export function HoleDetail({ hole }: { hole: RabbitHole }) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const accent = ACCENTS[hole.accent];
  const status = STATUS_META[hole.status];
  const resources = [...hole.pages].sort((a, b) => b.dwellSeconds - a.dwellSeconds).slice(0, 6);
  const activity = [...hole.timeline].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 6);
  const counts = [
    { label: "pages", n: hole.pages.length },
    { label: "searches", n: hole.searches.length },
    { label: "entities", n: hole.entities.length },
    { label: "domains", n: hole.domains.length },
  ];

  return (
    <div className="rh-paper min-h-screen px-5 py-8 sm:px-8 xl:px-12">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="mb-6 flex items-center gap-2 text-[14px] text-[#a8967d]">
          <Link href="/dashboard" className="text-[#6a5a48] transition hover:text-[#a8472a]">← Rabbit holes</Link>
          <span>/</span>
          <span className="text-[#6a5a48]">{hole.title}</span>
        </div>

        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-[760px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: `${status.dot}1f` }}>
              <span className="h-2 w-2 rounded-full" style={{ background: status.dot }} />
              <span className="text-[12.5px] font-semibold text-[#4d7049]">{status.label} · {relativeTime(hole.lastActive)}</span>
            </div>
            <h1 className="rh-display max-w-[14ch] text-[46px] font-semibold leading-[1.02] text-[#2a2018]">{hole.title}</h1>
            <p className="mt-4 max-w-[62ch] text-[18px] leading-[1.55] text-[#5a4a38]">{hole.description}</p>
          </div>
          <button onClick={() => setRestoreOpen(true)} className="rounded-[12px] bg-[#2a2018] px-5 py-3 text-[15px] font-medium text-[#f3e8d4] shadow-[0_8px_24px_rgba(42,32,24,.18)] transition hover:-translate-y-0.5">
            ↻ Resume rabbit hole
          </button>
        </header>

        <div className="mt-9 grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <main className="space-y-8">
            <HoleSummaryCard hole={hole} />
            <HoleBrief hole={hole} />
            <AskHole hole={hole} />

            <section>
              <SectionHeader title="Rabbit hole map" note={`${hole.graph.nodes.length} nodes`} />
              <div className="h-[620px] overflow-hidden rounded-[22px] border border-[#4a3928] bg-[#1b130d] shadow-[0_18px_50px_rgba(70,45,20,.12)]">
                <HoleMapView id={hole.id} embedded />
              </div>
            </section>

            <DiscoveryPathPanel hole={hole} />
            <InvestigationReplay hole={hole} />
            <SessionDNA hole={hole} />
            <ShareRabbitHole hole={hole} />

            <section>
              <SectionHeader title="Key resources" note={`${resources.length} saved`} />
              <div className="space-y-3">
                {resources.map((page) => <ResourceRow key={page.id} page={page} accent={accent.hex} />)}
              </div>
            </section>

            <section>
              <SectionHeader title="Threads you pulled" />
              <div className="flex flex-wrap gap-2.5">
                {hole.searches.map((s) => (
                  <div key={s.id} className="inline-flex items-center gap-2 rounded-full border border-[#785a3221] bg-[#f2e9d6] px-4 py-2 text-[14.5px] text-[#5a4a38]">
                    <span className="text-[13px] text-[#b89b6f]">⌕</span>{s.query}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionHeader title="Recent activity" />
              <div className="relative ml-1 space-y-4 border-l-2 border-[#785a3229] pl-6">
                {activity.map((a) => {
                  const meta = KIND_META[a.kind];
                  return (
                    <div key={a.id} className="relative">
                      <div className="absolute -left-[34px] top-1 h-[13px] w-[13px] rounded-full border-[3px] bg-[#f4ead7]" style={{ borderColor: meta.color }} />
                      <div className="mb-1 text-[13px] text-[#a8967d]">{clockTime(a.at)}</div>
                      <div className="text-[15.5px] leading-[1.4] text-[#3a2f25]">{a.title}</div>
                      {a.detail && <div className="mt-0.5 text-[13px] text-[#9c8b75]">{a.detail}</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          </main>

          <aside className="space-y-5 lg:sticky lg:top-8">
            <div className="overflow-hidden rounded-[18px] border border-[#785a3224] bg-[#fbf6ec] px-6 pb-6 pt-3 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
              <div className="-mx-6 mb-2 flex h-[88px] items-end justify-center bg-[radial-gradient(120%_120%_at_50%_120%,rgba(95,138,92,.18),transparent_70%)]">
                <img src="/assets/images/rabbit-holes-mark.png" alt="" className="h-[82px] w-[82px] object-contain" />
              </div>
              <div className="text-center">
                <div className="rh-display text-[42px] font-semibold leading-none" style={{ color: accent.hex }}>{Math.round(hole.confidence * 100)}%</div>
                <div className="mt-1 text-[12px] uppercase tracking-[0.14em] text-[#a8967d]">match confidence</div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#785a321f]"><div className="h-full rounded-full" style={{ width: `${Math.round(hole.confidence * 100)}%`, background: `linear-gradient(90deg,${accent.hex},#e0865a)` }} /></div>
              <div className="mt-5 divide-y divide-[#785a321a]">
                {counts.map((k) => (
                  <div key={k.label} className="flex items-center justify-between py-2.5">
                    <span className="text-[14.5px] capitalize text-[#6a5a48]">{k.label}</span>
                    <span className="text-[15px] font-semibold tabular-nums text-[#2a2018]">{k.n}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] bg-[#2a2018] px-6 py-5 text-[#f3e8d4] shadow-[0_8px_24px_rgba(42,32,24,.2)]">
              <h3 className="rh-display mb-3 text-[19px] font-semibold text-[#f6ecd9]">Where this leads next</h3>
              <div className="divide-y divide-[#f3e8d41f]">
                {hole.summary.questions.slice(0, 3).map((q) => (
                  <div key={q} className="flex items-start gap-3 py-3 text-[15px] leading-snug text-[#e7d8be]"><span className="text-[#d98a5f]">↳</span>{q}</div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#785a3224] bg-[#fbf6ec] p-5 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#a8967d]">Entities</div>
              <div className="flex flex-wrap gap-2">
                {[...hole.entities].sort((a, b) => b.mentions - a.mentions).slice(0, 10).map((e) => <EntityChip key={e.id} name={e.name} kind={e.kind} />)}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <RestoreModal hole={hole} open={restoreOpen} onClose={() => setRestoreOpen(false)} />
    </div>
  );
}

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="rh-display text-[23px] font-semibold text-[#2a2018]">{title}</h2>
      {note && <span className="text-[13px] text-[#a8967d]">{note}</span>}
    </div>
  );
}

function ResourceRow({ page, accent }: { page: PageVisit; accent: string }) {
  const meta = KIND_META[page.kind];
  return (
    <a href={page.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-[14px] border border-[#785a3224] bg-[#fbf6ec] px-4 py-3.5 shadow-[0_2px_12px_rgba(70,45,20,.05)] transition hover:translate-x-1 hover:shadow-[0_6px_18px_rgba(70,45,20,.1)]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[#785a3229] bg-white text-[15px] font-semibold" style={{ color: meta.color }}>{meta.glyph}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-semibold leading-tight text-[#2a2018]">{page.title}</div>
        <div className="mt-1 flex items-center gap-2 text-[13px] text-[#9c8b75]"><img src={faviconFor(page.domain)} alt="" className="h-3.5 w-3.5 rounded" />{page.domain} · {Math.round(page.dwellSeconds / 60)}m active</div>
      </div>
      <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: accent, background: `${accent}17` }}>{page.kind}</span>
      <span className="shrink-0 text-[18px] text-[#c3b49b]">↗</span>
    </a>
  );
}
