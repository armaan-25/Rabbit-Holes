"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ACCENTS, STATUS_META } from "@/lib/ui";
import { useApp } from "@/lib/store";
import { useHoles } from "@/hooks/useHoles";
import { formatElapsed, removeCapturedTab, setExtensionCapture, useSessionStats, type CaptureState, type SessionStats } from "@/hooks/useSessionStats";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Logo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { clearRabbitSession, readRabbitSession } from "@/lib/local-auth";

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

const CHROMELESS_PATHS = ["/", "/docs", "/install", "/privacy", "/terms", "/login"];

function isChromelessPath(pathname: string) {
  return CHROMELESS_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function Sidebar() {
  const pathname = usePathname();
  const togglePalette = useApp((s) => s.togglePalette);
  const holes = useHoles();
  const stats = useSessionStats();

  if (isChromelessPath(pathname)) return null;

  return (
    <aside className="rh-sidebar sticky top-0 z-20 hidden h-screen w-[352px] shrink-0 flex-col border-r px-7 py-8 md:flex">
      <Link href="/" className="mb-8 block min-w-0 px-2 no-underline">
        <Wordmark className="max-w-full text-[22px]" />
        <div className="rh-muted mt-1.5 text-[13px] italic">Follow ideas, not tabs.</div>
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
  if (isChromelessPath(pathname)) return null;

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
  const [confirmAction, setConfirmAction] = useState<CaptureState | null>(null);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const effectiveState = localState ?? stats.captureState;
  const recording = effectiveState === "recording";
  const statusLabel = recording ? "Capturing" : effectiveState === "paused" ? "Paused" : "Stopped";
  const controllable = stats.source === "extension";
  const hasTimer = typeof stats.elapsedMs === "number";
  const canResume = effectiveState === "paused" || effectiveState === "stopped";
  const restartLabel = effectiveState === "stopped" ? "Start" : "Resume";

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

  async function removeTab(url: string) {
    if (removingUrl) return;
    setRemovingUrl(url);
    await removeCapturedTab(url);
    setRemovingUrl(null);
  }

  return (
    <div className="rh-surface mt-5 rounded-[13px] border p-4">
      <ConfirmDialog
        open={confirmAction !== null}
        eyebrow={confirmAction === "stopped" ? "End session" : confirmAction === "paused" ? "Pause capture" : effectiveState === "stopped" ? "Start capture" : "Resume capture"}
        title={confirmAction === "stopped" ? "End this capture session?" : confirmAction === "paused" ? "Pause capture?" : effectiveState === "stopped" ? "Start a new capture session?" : "Resume capture?"}
        body={
          confirmAction === "stopped"
            ? "Ending clears the current captured session. Build any rabbit holes you want to keep before ending it."
            : confirmAction === "paused"
              ? "Rabbit Holes will stop recording new pages and searches until you resume."
              : effectiveState === "stopped"
                ? "Rabbit Holes will start a fresh trail and begin recording pages, searches, and tab activity."
                : "Rabbit Holes will start recording new pages, searches, and tab activity again."
        }
        confirmLabel={confirmAction === "stopped" ? "End session" : confirmAction === "paused" ? "Pause" : restartLabel}
        danger={confirmAction === "stopped"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          const next = confirmAction;
          setConfirmAction(null);
          if (next) void send(next);
        }}
      />
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: recording ? STATUS_META.active.dot : effectiveState === "paused" ? "#c7ae84" : "#b8795f" }} />
        <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--rh-ink)]">{statusLabel}</span>
        {hasTimer && <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[var(--rh-muted)]">{formatElapsed(elapsed)}</span>}
      </div>
      {controllable && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <CaptureButton
            onClick={() => setConfirmAction(recording ? "paused" : "recording")}
            disabled={pending}
            title={recording ? "Pause capture" : effectiveState === "stopped" ? "Start capture" : "Resume capture"}
            label={pending ? "Working..." : recording ? "Pause" : restartLabel}
            tone={canResume ? "primary" : "default"}
          />
          <CaptureButton
            onClick={() => setConfirmAction("stopped")}
            disabled={pending || effectiveState === "stopped"}
            title="Stop capture"
            label={effectiveState === "stopped" ? "Ended" : "End"}
            tone="danger"
          />
        </div>
      )}
      <div className="mt-3 grid grid-cols-3 divide-x divide-[var(--rh-line)] border-t border-[var(--rh-line)] pt-3">
        <MiniStat n={stats.pages} label="pages" />
        <MiniStat n={stats.searches} label="searches" />
        <MiniStat n={stats.tabs} label="tabs" />
      </div>
      {stats.capturedTabs && (
        <details className="mt-3 overflow-hidden rounded-[10px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[12px] font-semibold text-[var(--rh-muted)] [&::-webkit-details-marker]:hidden">
            <span>Captured tabs</span>
            <span className="rounded-full border border-[var(--rh-line)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--rh-faint)]">{stats.capturedTabs.length}</span>
          </summary>
          <div className="max-h-[190px] overflow-y-auto border-t border-[var(--rh-line)]">
            {stats.capturedTabs.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-[var(--rh-faint)]">No tabs captured yet.</div>
            ) : (
              stats.capturedTabs.map((tab) => (
                <div
                  key={`${tab.url}-${tab.at ?? ""}`}
                  className="flex items-center gap-2 border-t border-[var(--rh-line)] px-3 py-2 first:border-t-0 hover:bg-[var(--rh-surface-3)]"
                  title={tab.title}
                >
                  <a href={tab.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-[var(--rh-ink)]">{tab.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-[var(--rh-faint)]">{tab.domain}</div>
                  </a>
                  <button
                    type="button"
                    onClick={() => void removeTab(tab.url)}
                    disabled={removingUrl === tab.url}
                    title="Remove from capture"
                    aria-label={`Remove ${tab.title} from capture`}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-[#b8795f33] bg-[#b8795f10] text-[14px] leading-none text-[#c88f78] transition hover:bg-[#b8795f1f] hover:text-[#dfaa93] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {removingUrl === tab.url ? "…" : "×"}
                  </button>
                </div>
              ))
            )}
          </div>
        </details>
      )}
    </div>
  );
}

function CaptureButton({ onClick, disabled, title, label, tone = "default" }: { readonly onClick: () => void; readonly disabled: boolean; readonly title: string; readonly label: string; readonly tone?: "default" | "primary" | "danger" }) {
  const toneClass =
    tone === "primary"
      ? "bg-[var(--rh-primary)] text-[var(--rh-primary-text)] border-transparent"
      : tone === "danger"
        ? "border-[#b8795f33] bg-[#b8795f12] text-[#c88f78] hover:bg-[#b8795f20] hover:text-[#dfaa93]"
        : "rh-surface text-[var(--rh-muted)] hover:text-[var(--rh-ink)]";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`grid h-9 place-items-center rounded-[9px] border px-3 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${toneClass}`}
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
  const [email, setEmail] = useState("Signed in");

  useEffect(() => {
    function sync() {
      setEmail(readRabbitSession()?.email || "Signed in");
    }
    sync();
    window.addEventListener("rabbit-hole-session-changed", sync);
    return () => window.removeEventListener("rabbit-hole-session-changed", sync);
  }, []);

  function signOut() {
    clearRabbitSession();
    window.location.href = "/login";
  }

  return (
    <div className="rh-surface mt-4 rounded-[16px] border p-3 shadow-[0_2px_12px_rgba(70,45,20,.05)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface-2)] text-[13px] font-semibold text-[var(--rh-green)]">
          {email.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-[var(--rh-ink)]">{email}</div>
          <div className="rh-muted text-[12px]">Local workspace</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/settings" className="rh-surface-2 rounded-[11px] border px-3 py-2 text-center text-[13px] font-semibold">
          Settings
        </Link>
        <button onClick={signOut} className="rh-surface-2 rounded-[11px] border px-3 py-2 text-center text-[13px] font-semibold text-[var(--rh-muted)]">
          Sign out
        </button>
      </div>
    </div>
  );
}
