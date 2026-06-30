"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCENTS } from "@/lib/ui";
import { useHoles } from "@/hooks/useHoles";
import { Wordmark } from "./Logo";
import { clearRabbitSession, readRabbitSession } from "@/lib/local-auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Dashboard", glyph: "⊞" },
  { href: "/map", label: "Map", glyph: "⌗" },
  { href: "/timeline", label: "Timeline", glyph: "≣" },
  { href: "/heatmap", label: "Heatmap", glyph: "▦" },
  { href: "/settings", label: "Settings", glyph: "⚙" },
];

const CHROMELESS_PATHS = ["/", "/docs", "/install", "/privacy", "/terms", "/login"];

function isChromelessPath(pathname: string) {
  return CHROMELESS_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function Sidebar() {
  const pathname = usePathname();
  const holes = useHoles();

  if (isChromelessPath(pathname)) return null;

  return (
    <aside className="rh-sidebar sticky top-0 z-20 hidden h-screen w-[312px] shrink-0 flex-col border-r px-8 py-9 md:flex">
      <Link href="/" className="mb-12 block min-w-0 no-underline">
        <Wordmark className="max-w-full text-[22px]" />
        <div className="rh-muted mt-1.5 text-[13px] italic">Follow ideas, not tabs.</div>
      </Link>

      <nav className="space-y-2">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center rounded-[10px] py-2.5 text-[15px] transition ${
                active
                  ? "text-[var(--rh-ink)]"
                  : "rh-muted hover:text-[var(--rh-ink)]"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="rh-faint mb-4 mt-14 text-[11px] font-semibold uppercase tracking-[0.16em]">
        Investigations
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {holes.map((h) => {
          const active = pathname === `/holes/${h.id}`;
          const accent = ACCENTS[h.accent];
          return (
            <Link
              key={h.id}
              href={`/holes/${h.id}`}
              className={`group flex items-center gap-3 rounded-[10px] py-2.5 text-[14px] transition ${
                active ? "text-[var(--rh-ink)]" : "rh-muted hover:text-[var(--rh-ink)]"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: accent.hex, boxShadow: `0 0 8px ${accent.ring}` }}
              />
              <span className="truncate">{h.title}</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/settings"
        className={`mt-8 py-2.5 text-[14px] no-underline transition ${
          pathname === "/settings" ? "text-[var(--rh-ink)]" : "rh-muted hover:text-[var(--rh-ink)]"
        }`}
      >
        Settings
      </Link>
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

function SidebarAccount() {
  const [email, setEmail] = useState("Signed in");
  const [open, setOpen] = useState(false);

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
    <div className="relative mt-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface-2)] text-[13px] font-semibold text-[var(--rh-green)]">
          {email.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-[var(--rh-ink)]">{email}</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[18px] text-[var(--rh-muted)] transition hover:bg-[var(--rh-surface)] hover:text-[var(--rh-ink)]"
          aria-label="Account menu"
        >
          …
        </button>
      </div>
      {open && (
        <div className="rh-surface absolute bottom-12 right-0 z-30 w-40 rounded-[14px] border p-1.5 shadow-[0_18px_48px_rgba(18,11,5,.18)]">
          <Link href="/settings" className="block rounded-[10px] px-3 py-2 text-[13px] font-semibold no-underline hover:bg-[var(--rh-surface-2)]">
            Settings
          </Link>
          <button onClick={signOut} className="block w-full rounded-[10px] px-3 py-2 text-left text-[13px] font-semibold text-[var(--rh-muted)] hover:bg-[var(--rh-surface-2)] hover:text-[var(--rh-ink)]">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
