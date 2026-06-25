"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ACCENTS, STATUS_META } from "@/lib/ui";
import { useApp } from "@/lib/store";
import { useHoles } from "@/hooks/useHoles";
import { formatElapsed, setExtensionCapture, useSessionStats, type CaptureState, type SessionStats } from "@/hooks/useSessionStats";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Logo";
import { supabase } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", glyph: "⊞" },
  { href: "/map", label: "Map", glyph: "⌗" },
  { href: "/timeline", label: "Timeline", glyph: "≣" },
  { href: "/heatmap", label: "Heatmap", glyph: "▦" },
];

const MOBILE_NAV = [
  ...NAV,
  { href: "/settings", label: "Settings", glyph: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();
  const togglePalette = useApp((s) => s.togglePalette);
  const holes = useHoles();
  const stats = useSessionStats();

  // The landing is a full-bleed minimalist canvas — no chrome.
  if (pathname === "/") return null;

  return (
    <aside className="rh-sidebar sticky top-0 z-20 hidden h-screen w-[352px] shrink-0 flex-col border-r px-7 py-8 md:flex">
      <Link href="/" className="mb-8 block min-w-0 px-2 no-underline">
        <Wordmark className="max-w-full text-[22px]" />
        <div className="rh-muted mt-1.5 text-[13px] italic">Smart history for your research.</div>
      </Link>

      <button
        onClick={togglePalette}
        className="rh-surface mb-6 flex items-center justify-between rounded-[11px] border px-4 py-3 text-[14px] transition"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-[16px]">⌕</span> Quick jump
        </span>
        <kbd className="rh-surface-2 rounded border px-2 py-0.5 font-mono text-[10px] rh-muted">
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

      <div className="rh-faint mb-3 mt-7 px-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
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

      <CaptureCard stats={stats} />

      <div className="mt-3 flex items-center gap-2">
        <Link
          href="/settings"
          className={`rh-surface flex h-10 flex-1 items-center justify-center gap-2 rounded-[11px] border text-[13.5px] font-medium transition ${
            pathname === "/settings" ? "text-[var(--rh-ink)]" : "rh-muted hover:text-[var(--rh-ink)]"
          }`}
        >
          <span className="text-[15px]">⚙</span> Settings
        </Link>
        <ThemeToggle />
      </div>
      <SidebarAccount />
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[20px] border border-[#785a3224] bg-[#1f150f]/92 p-2 shadow-[0_18px_48px_rgba(18,11,5,.32)] backdrop-blur md:hidden">
      {MOBILE_NAV.map((n) => {
        const active = pathname === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center justify-center rounded-[14px] px-2 py-2 text-[11px] font-semibold transition ${
              active ? "bg-[#f3e8d4] text-[#20140d]" : "text-[#d8c6a8] hover:bg-[#f3e8d414]"
            }`}
          >
            <span className="text-[16px] leading-none">{n.glyph}</span>
            <span className="mt-1 truncate">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function CaptureCard({ stats }: { readonly stats: SessionStats }) {
  const [localState, setLocalState] = useState<CaptureState | null>(null);
  const [pending, setPending] = useState(false);
  const effectiveState = localState ?? stats.captureState;
  const recording = effectiveState === "recording";
  const statusLabel = recording ? "Capturing" : effectiveState === "paused" ? "Paused" : "Stopped";
  const controllable = stats.source === "extension";
  const hasTimer = typeof stats.elapsedMs === "number";

  useEffect(() => {
    if (localState && stats.captureState === localState) setLocalState(null);
  }, [localState, stats.captureState]);

  // The polled stats only refresh every ~2s; tick the clock locally each second
  // so the timer counts smoothly instead of jumping.
  const base = useRef({ ms: stats.elapsedMs ?? 0, at: Date.now() });
  const [elapsed, setElapsed] = useState(stats.elapsedMs ?? 0);
  useEffect(() => {
    base.current = { ms: stats.elapsedMs ?? 0, at: Date.now() };
    setElapsed(stats.elapsedMs ?? 0);
    if (!recording) return;
    const id = window.setInterval(() => {
      setElapsed(base.current.ms + (Date.now() - base.current.at));
    }, 1000);
    return () => window.clearInterval(id);
  }, [stats.elapsedMs, recording]);

  async function send(next: CaptureState) {
    if (pending) return;
    setPending(true);
    setLocalState(next);
    const ok = await setExtensionCapture(next);
    if (!ok) setLocalState(null);
    setPending(false);
  }

  return (
    <div className="rh-surface mt-5 rounded-[13px] border p-4">
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: recording ? STATUS_META.active.dot : effectiveState === "paused" ? "#c7ae84" : "#b8795f" }} />
        <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--rh-ink)]">{statusLabel}</span>
        {hasTimer && <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[var(--rh-muted)]">{formatElapsed(elapsed)}</span>}
      </div>
      {controllable && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <CaptureButton
            onClick={() => send(recording ? "paused" : "recording")}
            disabled={pending}
            title={recording ? "Pause capture" : "Resume capture"}
            label={recording ? "Pause" : "Resume"}
            active={recording}
          />
          <CaptureButton
            onClick={() => send("stopped")}
            disabled={pending || effectiveState === "stopped"}
            title="Stop capture"
            label="Stop"
            active={effectiveState === "stopped"}
          />
        </div>
      )}
      <div className="mt-3 grid grid-cols-3 divide-x divide-[var(--rh-line)] border-t border-[var(--rh-line)] pt-3">
        <MiniStat n={stats.pages} label="pages" />
        <MiniStat n={stats.searches} label="searches" />
        <MiniStat n={stats.tabs} label="tabs" />
      </div>
    </div>
  );
}

function CaptureButton({ onClick, disabled, title, label, active }: { readonly onClick: () => void; readonly disabled: boolean; readonly title: string; readonly label: string; readonly active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`grid h-9 place-items-center rounded-[9px] border px-3 text-[12px] font-semibold transition disabled:opacity-40 ${
        active
          ? "bg-[var(--rh-primary)] text-[var(--rh-primary-text)]"
          : "rh-surface text-[var(--rh-muted)] hover:text-[var(--rh-ink)]"
      }`}
    >
      {label}
    </button>
  );
}

function MiniStat({ n, label }: { readonly n: number; readonly label: string }) {
  return (
    <div className="px-2 text-center">
      <div className="rh-ink text-[15px] font-semibold tabular-nums">{n}</div>
      <div className="rh-muted mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.12em]">{label}</div>
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
        <div className="rh-surface mt-4 rounded-[16px] border p-3 shadow-[0_2px_12px_rgba(70,45,20,.05)]">
        <div className="h-10 rounded-[12px] bg-[var(--rh-surface-2)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rh-surface mt-4 rounded-[16px] border p-3 shadow-[0_2px_12px_rgba(70,45,20,.05)]">
        <div className="rh-muted mb-3 text-[12px] leading-5">Sign in to save sessions across devices.</div>
        <Link href="/login?next=/dashboard" className="rh-primary block rounded-[12px] px-4 py-2.5 text-center text-[14px] font-semibold">
          Sign in
        </Link>
        <Link href="/signup?next=/dashboard" className="rh-surface-2 mt-2 block rounded-[12px] border px-4 py-2.5 text-center text-[14px] font-semibold">
          Create account
        </Link>
      </div>
    );
  }

  const email = user.email ?? "Account";
  const initial = email[0]?.toUpperCase() ?? "R";

  return (
    <div className="rh-surface mt-4 rounded-[16px] border p-3 shadow-[0_2px_12px_rgba(70,45,20,.05)]">
      <div className="flex items-center gap-3">
        <span className="rh-primary grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-semibold">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-[var(--rh-ink)]">{email}</div>
          <div className="rh-muted text-[12px]">Signed in</div>
        </div>
      </div>
      <button onClick={signOut} className="rh-surface-2 mt-3 w-full rounded-[11px] border px-3 py-2 text-[13px] font-semibold text-[#a8472a]">
        Log out
      </button>
    </div>
  );
}
