"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHoles } from "@/hooks/useHoles";
import { ACCENTS } from "@/lib/ui";
import { relativeTime } from "@/lib/format";

export function YouAreHere() {
  const pathname = usePathname();
  const holes = useHoles();
  const current = pathname.match(/^\/holes\/([^/]+)/)?.[1] ?? pathname.match(/^\/map\/([^/]+)/)?.[1];
  const hole = holes.find((item) => item.id === current) ?? holes.find((item) => item.status === "active") ?? holes[0];

  if (!hole || pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/extension-auth") || pathname.startsWith("/rabbit-auth") || pathname.startsWith("/share")) return null;

  const accent = ACCENTS[hole.accent];
  const depth = Math.max(hole.graph.edges.length, hole.pages.length - 1);

  return (
    <Link
      href={`/holes/${hole.id}`}
      className="fixed bottom-5 right-5 z-30 hidden w-[286px] rounded-[18px] border border-[#785a3224] bg-[#fbf6ec]/95 p-4 text-left no-underline shadow-[0_18px_50px_rgba(70,45,20,.16)] backdrop-blur md:block"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8967d]">You are here</span>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent.hex, boxShadow: `0 0 12px ${accent.ring}` }} />
      </div>
      <div className="rh-display truncate text-[22px] font-semibold leading-tight text-[#2a2018]">{hole.title}</div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Mini label="depth" value={depth} />
        <Mini label="pages" value={hole.pages.length} />
        <Mini label="started" value={relativeTime(hole.createdAt)} />
      </div>
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] bg-[#f2e9d6] px-2 py-2">
      <div className="text-[14px] font-semibold tabular-nums text-[#2a2018]">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.12em] text-[#8a7860]">{label}</div>
    </div>
  );
}
