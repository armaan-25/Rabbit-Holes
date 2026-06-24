"use client";

import { useState } from "react";
import Link from "next/link";
import type { RabbitHole } from "@/lib/types";

export function ShareRabbitHole({ hole }: { hole: RabbitHole }) {
  const [copied, setCopied] = useState(false);
  const href = `/share/${hole.id}`;

  async function copy() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await navigator.clipboard.writeText(`${origin}${href}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rh-surface rounded-[20px] border p-5 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.18em]">Shareable rabbit hole</div>
          <h2 className="rh-display rh-ink mt-1 line-clamp-2 text-[24px] font-semibold">How I explored {hole.title}</h2>
          <p className="rh-muted mt-1 text-[14px]">Public view includes the map, replay, discoveries, and summary.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copy} className="rh-primary rounded-full px-5 py-2.5 text-[14px] font-semibold transition hover:-translate-y-0.5">
            {copied ? "Copied" : "Copy link"}
          </button>
          <Link href={href} className="rh-surface-2 rounded-full border px-5 py-2.5 text-[14px] font-semibold no-underline">Preview</Link>
        </div>
      </div>
    </section>
  );
}
