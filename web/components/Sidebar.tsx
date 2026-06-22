"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ACCENTS, STATUS_META } from "@/lib/ui";
import { useApp } from "@/lib/store";
import { useHoles } from "@/hooks/useHoles";
import { formatElapsed, useSessionStats } from "@/hooks/useSessionStats";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Logo";
import { supabase } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", glyph: "⊞" },
  { href: "/map", label: "Map", glyph: "⌗" },
  { href: "/timeline", label: "Timeline", glyph: "≣" },
  { href: "/heatmap", label: "Heatmap", glyph: "▦" },
  { href: "/settings", label: "Settings", glyph: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();
  const togglePalette = useApp((s) => s.togglePalette);
  const holes = useHoles();
  const stats = useSessionStats();
  const statusLabel = stats.captureState === "recording" ? "Capturing" : stats.captureState === "paused" ? "Paused" : "Stopped";

  // The landing is a full-bleed minimalist canvas — no chrome.
  if (pathname === "/") return null;

  return (
    <aside className="rh-sidebar sticky top-0 z-20 hidden h-screen w-[352px] shrink-0 flex-col border-r px-7 py-8 md:flex">
      <Link href="/" className="mb-8 block px-2 no-underline">
        <Wordmark className="text-[22px]" />
        <div className="rh-muted mt-1.5 text-[13px] italic">Smart history for your research.</div>
      </Link>

      <button
        onClick={togglePalette}
        className="rh-surface mb-7 flex items-center justify-between rounded-[13px] border px-5 py-4 text-[15px] transition"
      >
        <span className="flex items-center gap-2">
          <span className="text-[16px]">⌕</span> Quick jump
        </span>
        <kbd className="rh-surface-2 rounded border px-2 py-1 font-mono text-[11px] rh-muted">
          ⌘K
        </kbd>
      </button>

      <nav className="space-y-1">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3.5 rounded-[12px] px-5 py-3.5 text-[16px] transition ${
                active
                  ? "rh-surface shadow-[0_1px_3px_rgba(70,45,20,.08)]"
                  : "rh-muted hover:bg-[var(--rh-surface)] hover:text-[var(--rh-ink)]"
              }`}
            >
              <span className="rh-faint w-5 text-center text-[17px]">{n.glyph}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="rh-faint mb-3 mt-8 px-3 text-[12px] font-semibold uppercase tracking-[0.16em]">
        Rabbit Holes
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {holes.map((h) => {
          const active = pathname === `/holes/${h.id}`;
          const accent = ACCENTS[h.accent];
          return (
            <Link
              key={h.id}
              href={`/holes/${h.id}`}
              className={`group flex items-center gap-3 rounded-[12px] px-5 py-3 text-[15px] transition ${
                active ? "rh-surface" : "rh-muted hover:bg-[var(--rh-surface)]"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: accent.hex, boxShadow: `0 0 8px ${accent.ring}` }}
              />
              <span className="truncate">{h.title}</span>
              <span className="rh-faint ml-auto text-[13px] tabular-nums">
                {h.pages.length}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 rounded-[13px] border px-4 py-3" style={{ borderColor: "color-mix(in srgb, var(--rh-green) 34%, transparent)", background: "color-mix(in srgb, var(--rh-green) 12%, var(--rh-surface))" }}>
        <div className="flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: stats.captureState === "recording" ? STATUS_META.active.dot : "#c7ae84" }}
        />
          <span className="text-[14px] font-semibold" style={{ color: "var(--rh-green)" }}>
            {statusLabel}{typeof stats.elapsedMs === "number" ? ` · ${formatElapsed(stats.elapsedMs)}` : ""}
          </span>
        </div>
        <div className="rh-surface mt-3 grid grid-cols-3 divide-x divide-[var(--rh-line)] rounded-[10px] border-0 py-2">
          <MiniStat n={stats.pages} label="pages" />
          <MiniStat n={stats.searches} label="searches" />
          <MiniStat n={stats.tabs} label="tabs" />
        </div>
      </div>
      <ThemeToggle />
      <SidebarAccount />
    </aside>
  );
}

function MiniStat({ n, label }: { readonly n: number; readonly label: string }) {
  return (
    <div className="px-2 text-center">
      <div className="rh-ink text-[17px] font-semibold tabular-nums">{n}</div>
      <div className="rh-muted mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]">{label}</div>
    </div>
  );
}

function SidebarAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (!ready) {
    return (
      <div className="mt-4 rounded-[16px] border border-[#785a3224] bg-[#fbf6ec] p-3 shadow-[0_2px_12px_rgba(70,45,20,.05)]">
        <div className="h-10 rounded-[12px] bg-[#f2e9d6]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-4 rounded-[16px] border border-[#785a3224] bg-[#fbf6ec] p-3 shadow-[0_2px_12px_rgba(70,45,20,.05)]">
        <div className="mb-3 text-[12px] leading-5 text-[#8a7860]">Sign in to save sessions across devices.</div>
        <Link href="/login?next=/dashboard" className="block rounded-[12px] bg-[#2a2018] px-4 py-2.5 text-center text-[14px] font-semibold text-[#f3e8d4]">
          Sign in
        </Link>
        <Link href="/signup?next=/dashboard" className="mt-2 block rounded-[12px] border border-[#785a3224] bg-[#f2e9d6] px-4 py-2.5 text-center text-[14px] font-semibold text-[#5a4a38]">
          Create account
        </Link>
      </div>
    );
  }

  const email = user.email ?? "Account";
  const initial = email[0]?.toUpperCase() ?? "R";

  return (
    <div className="mt-4 rounded-[16px] border border-[#785a3224] bg-[#fbf6ec] p-3 shadow-[0_2px_12px_rgba(70,45,20,.05)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2a2018] text-[14px] font-semibold text-[#f3e8d4]">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-[#2a2018]">{email}</div>
          <div className="text-[12px] text-[#8a7860]">Signed in</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/settings" className="rounded-[11px] border border-[#785a3224] bg-[#f2e9d6] px-3 py-2 text-center text-[13px] font-semibold text-[#5a4a38]">
          Settings
        </Link>
        <button onClick={signOut} className="rounded-[11px] border border-[#785a3224] bg-[#fbf6ec] px-3 py-2 text-[13px] font-semibold text-[#a8472a]">
          Log out
        </button>
      </div>
    </div>
  );
}
