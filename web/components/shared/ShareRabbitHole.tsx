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
    <section className="rounded-[20px] border border-[#785a3224] bg-[#fbf6ec] p-5 shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">Shareable rabbit hole</div>
          <h2 className="rh-display mt-1 text-[24px] font-semibold text-[#2a2018]">How I explored {hole.title}</h2>
          <p className="mt-1 text-[14px] text-[#6a5a48]">Public view includes the map, replay, discoveries, and summary.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copy} className="rounded-full bg-[#2a2018] px-5 py-2.5 text-[14px] font-semibold text-[#f3e8d4] transition hover:-translate-y-0.5">
            {copied ? "Copied" : "Copy link"}
          </button>
          <Link href={href} className="rounded-full border border-[#785a3224] bg-[#f2e9d6] px-5 py-2.5 text-[14px] font-semibold text-[#5a4a38] no-underline">Preview</Link>
        </div>
      </div>
    </section>
  );
}
