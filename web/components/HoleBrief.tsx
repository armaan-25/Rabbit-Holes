"use client";

import { useEffect, useRef, useState } from "react";
import type { RabbitHole } from "@/lib/types";
import { apiErrorMessage, synthesizeHole, type Brief } from "@/lib/api";

export function HoleBrief({ hole }: { hole: RabbitHole }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const generatedRef = useRef(false);
  const cacheKey = `rabbit-hole-brief:${hole.id}`;

  async function generate({ force = false } = {}) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      if (!force) {
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          setBrief(JSON.parse(cached) as Brief);
          return;
        }
      }
      const next = await synthesizeHole(hole);
      setBrief(next);
      window.localStorage.setItem(cacheKey, JSON.stringify(next));
    } catch (err) {
      setError(apiErrorMessage(err, "generate a brief"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generatedRef.current = false;
    setBrief(null);
    setError(null);
    setCopied(false);
  }, [hole.id]);

  useEffect(() => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    void generate();
    // generate is intentionally not a dependency; it changes with loading/cache state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hole.id]);

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
    <div className="rh-surface overflow-hidden rounded-[18px] border shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--rh-line)] px-5 py-4">
        <div>
          <h2 className="rh-display rh-ink text-[21px] font-semibold">The brief</h2>
          <p className="rh-muted mt-0.5 text-[13.5px]">The synthesis you never got around to writing.</p>
        </div>
        {brief ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button onClick={copy} className="rh-surface-2 rounded-[11px] border px-3.5 py-2 text-[13.5px] font-semibold transition">
              {copied ? "Copied ✓" : "Copy as Markdown"}
            </button>
            <button onClick={() => void generate({ force: true })} disabled={loading} className="rh-surface-2 rounded-[11px] border px-3.5 py-2 text-[13.5px] font-semibold transition disabled:opacity-50">
              {loading ? "Refreshing…" : "Regenerate"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => void generate({ force: true })}
            disabled={loading}
            className="rh-primary shrink-0 rounded-[12px] px-4 py-2.5 text-[14.5px] font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? "Synthesizing…" : error ? "Try again" : "Generate brief"}
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {!brief && !loading && !error && (
          <p className="rh-muted text-[14.5px] leading-6">
            Turn this hole&rsquo;s {hole.pages.length} pages into a one-page brief — summary, a comparison of what you weighed, contradictions across sources, open questions, and next steps.
          </p>
        )}
        {loading && <p className="rh-muted text-[14.5px] italic">Reading {hole.pages.length} sources and writing it up…</p>}
        {error && <div className="rounded-[12px] border border-[#b8795f3d] bg-[#b8795f14] px-4 py-3 text-[13.5px] leading-snug text-[#8a4f34]">{error}</div>}

        {brief && (
          <div className="space-y-6">
            <p className="text-[16px] leading-[1.6] text-[var(--rh-ink-soft)]">{brief.summary}</p>

            {brief.comparison.length > 0 && (
              <BriefSection title="Comparison">
                <div className="grid gap-3 sm:grid-cols-2">
                  {brief.comparison.map((c) => (
                    <div key={c.title} className="rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-4">
                      <div className="rh-ink mb-2 text-[15px] font-semibold">{c.title}</div>
                      <ul className="space-y-1.5">
                        {c.points.map((p, i) => (
                          <li key={i} className="rh-muted flex gap-2 text-[14px] leading-snug"><span className="text-[var(--rh-faint)]">·</span>{p}</li>
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
      <div className="rh-faint mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em]">{title}</div>
      {children}
    </div>
  );
}

function BulletList({ items, marker, markerColor }: { items: string[]; marker: string; markerColor: string }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-[1.5] text-[var(--rh-ink-soft)]">
          <span className="mt-0.5 shrink-0" style={{ color: markerColor }}>{marker}</span>
          {it}
        </li>
      ))}
    </ul>
  );
}
