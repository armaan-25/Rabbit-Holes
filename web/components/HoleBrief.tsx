"use client";

import { useState } from "react";
import type { RabbitHole } from "@/lib/types";
import { synthesizeHole, type Brief } from "@/lib/api";

export function HoleBrief({ hole }: { hole: RabbitHole }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      setBrief(await synthesizeHole(hole));
    } catch {
      setError("Couldn't reach the backend. Start the FastAPI server to synthesize a brief from these sources.");
    } finally {
      setLoading(false);
    }
  }

  function toMarkdown(b: Brief): string {
    const lines = [`# ${hole.title}`, "", b.summary, ""];
    if (b.comparison.length) {
      lines.push("## Comparison", "");
      for (const c of b.comparison) {
        lines.push(`### ${c.title}`);
        c.points.forEach((p) => lines.push(`- ${p}`));
        lines.push("");
      }
    }
    const section = (title: string, items: string[]) => {
      if (!items.length) return;
      lines.push(`## ${title}`, "");
      items.forEach((i) => lines.push(`- ${i}`));
      lines.push("");
    };
    section("Contradictions & open tensions", b.contradictions);
    section("Open questions", b.open_questions);
    section("Next steps", b.next_steps);
    return lines.join("\n").trim();
  }

  async function copy() {
    if (!brief) return;
    await navigator.clipboard.writeText(toMarkdown(brief));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#785a3224] bg-[#fbf6ec] shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#785a3221] px-5 py-4">
        <div>
          <h2 className="rh-display text-[21px] font-semibold text-[#2a2018]">The brief</h2>
          <p className="mt-0.5 text-[13.5px] text-[#8a7860]">The synthesis you never got around to writing.</p>
        </div>
        {brief ? (
          <button onClick={copy} className="shrink-0 rounded-[11px] border border-[#785a3224] bg-[#f2e9d6] px-3.5 py-2 text-[13.5px] font-semibold text-[#5a4a38] transition hover:bg-[#efe4d0]">
            {copied ? "Copied ✓" : "Copy as Markdown"}
          </button>
        ) : (
          <button
            onClick={generate}
            disabled={loading}
            className="shrink-0 rounded-[12px] bg-[#2a2018] px-4 py-2.5 text-[14.5px] font-semibold text-[#f3e8d4] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? "Synthesizing…" : "Generate brief"}
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {!brief && !loading && !error && (
          <p className="text-[14.5px] leading-6 text-[#8a7860]">
            Turn this hole&rsquo;s {hole.pages.length} pages into a one-page brief — summary, a comparison of what you weighed, contradictions across sources, open questions, and next steps.
          </p>
        )}
        {loading && <p className="text-[14.5px] italic text-[#9c8b75]">Reading {hole.pages.length} sources and writing it up…</p>}
        {error && <div className="rounded-[12px] border border-[#b8795f3d] bg-[#b8795f14] px-4 py-3 text-[13.5px] leading-snug text-[#8a4f34]">{error}</div>}

        {brief && (
          <div className="space-y-6">
            <p className="text-[16px] leading-[1.6] text-[#3a2f25]">{brief.summary}</p>

            {brief.comparison.length > 0 && (
              <BriefSection title="Comparison">
                <div className="grid gap-3 sm:grid-cols-2">
                  {brief.comparison.map((c) => (
                    <div key={c.title} className="rounded-[14px] border border-[#785a3221] bg-[#f6efe1] p-4">
                      <div className="mb-2 text-[15px] font-semibold text-[#2a2018]">{c.title}</div>
                      <ul className="space-y-1.5">
                        {c.points.map((p, i) => (
                          <li key={i} className="flex gap-2 text-[14px] leading-snug text-[#5a4a38]"><span className="text-[#b6a488]">·</span>{p}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </BriefSection>
            )}

            {brief.contradictions.length > 0 && (
              <BriefSection title="Contradictions & open tensions">
                <BulletList items={brief.contradictions} marker="⚠" markerColor="#b8795f" />
              </BriefSection>
            )}
            {brief.open_questions.length > 0 && (
              <BriefSection title="Open questions">
                <BulletList items={brief.open_questions} marker="↳" markerColor="#c2703f" />
              </BriefSection>
            )}
            {brief.next_steps.length > 0 && (
              <BriefSection title="Next steps">
                <BulletList items={brief.next_steps} marker="→" markerColor="#5f8a5c" />
              </BriefSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BriefSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a8967d]">{title}</div>
      {children}
    </div>
  );
}

function BulletList({ items, marker, markerColor }: { items: string[]; marker: string; markerColor: string }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-[1.5] text-[#3a2f25]">
          <span className="mt-0.5 shrink-0" style={{ color: markerColor }}>{marker}</span>
          {it}
        </li>
      ))}
    </ul>
  );
}
