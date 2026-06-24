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

  if (
    !hole ||
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/holes/") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/extension-auth") ||
    pathname.startsWith("/rabbit-auth") ||
    pathname.startsWith("/share")
  ) return null;

  const accent = ACCENTS[hole.accent];
  const depth = Math.max(hole.graph.edges.length, hole.pages.length - 1);

  return (
    <Link
      href={`/holes/${hole.id}`}
      title={`Open ${hole.title}`}
      className="rh-surface group fixed bottom-4 right-4 z-20 hidden max-w-[calc(100vw-400px)] rounded-full border bg-[var(--rh-surface)]/90 px-3 py-2 text-left no-underline shadow-[0_10px_30px_rgba(70,45,20,.10)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(70,45,20,.16)] lg:flex"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accent.hex, boxShadow: `0 0 12px ${accent.ring}` }} />
        <div className="min-w-0">
          <div className="rh-faint text-[9.5px] font-semibold uppercase tracking-[0.16em]">You are here</div>
          <div className="max-w-[170px] truncate text-[13.5px] font-semibold leading-tight text-[var(--rh-ink)]">{hole.title}</div>
        </div>
        <div className="hidden items-center gap-1 border-l border-[var(--rh-line)] pl-2 xl:flex">
          <Mini label="depth" value={depth} />
          <Mini label="pages" value={hole.pages.length} />
          <Mini label="started" value={relativeTime(hole.createdAt)} />
        </div>
      </div>
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full bg-[var(--rh-surface-2)] px-2.5 py-1 text-center">
      <div className="text-[11.5px] font-semibold tabular-nums leading-none text-[var(--rh-ink)]">{value}</div>
      <div className="mt-0.5 text-[7px] uppercase tracking-[0.1em] text-[var(--rh-muted)]">{label}</div>
    </div>
  );
}
