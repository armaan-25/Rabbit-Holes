"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { RABBIT_HOLES } from "@/lib/data";
import { ACCENTS, STATUS_META } from "@/lib/ui";
import { useApp } from "@/lib/store";
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
  const liveHoles = useApp((s) => s.liveHoles);
  const holes = liveHoles.length ? liveHoles : RABBIT_HOLES;

  // The landing is a full-bleed minimalist canvas — no chrome.
  if (pathname === "/") return null;

  return (
    <aside className="sticky top-0 z-20 hidden h-screen w-[352px] shrink-0 flex-col border-r border-[#785a3224] bg-[#f6efe1] px-7 py-8 md:flex">
      <Link href="/" className="mb-8 block px-2 no-underline">
        <Wordmark className="text-[22px]" />
        <div className="mt-1.5 text-[13px] italic text-[#8a7860]">Follow ideas, not tabs.</div>
      </Link>

      <button
        onClick={togglePalette}
        className="mb-7 flex items-center justify-between rounded-[13px] border border-[#785a3224] bg-[#fbf6ec] px-5 py-4 text-[15px] text-[#6a5a48] transition hover:text-[#2a2018]"
      >
        <span className="flex items-center gap-2">
          <span className="text-[16px]">⌕</span> Quick jump
        </span>
        <kbd className="rounded border border-[#785a3224] bg-white px-2 py-1 font-mono text-[11px] text-[#8a7860]">
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
                  ? "bg-[#fbf6ec] text-[#2a2018] shadow-[0_1px_3px_rgba(70,45,20,.08)]"
                  : "text-[#6a5a48] hover:bg-[#fbf6ec] hover:text-[#2a2018]"
              }`}
            >
              <span className="w-5 text-center text-[17px] text-[#a8967d]">{n.glyph}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-3 mt-8 px-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#a8967d]">
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
                active ? "bg-[#fbf6ec] text-[#2a2018]" : "text-[#5a4a38] hover:bg-[#fbf6ec]"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: accent.hex, boxShadow: `0 0 8px ${accent.ring}` }}
              />
              <span className="truncate">{h.title}</span>
              <span className="ml-auto text-[13px] tabular-nums text-[#a8967d]">
                {h.pages.length}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-[13px] border border-[#5f8a5c42] bg-[#eef5ea] px-4 py-3">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: STATUS_META.active.dot }}
        />
        <span className="text-[14px] text-[#4d7049]">Capturing · 3 tabs</span>
      </div>
      <ThemeToggle />
      <SidebarAccount />
    </aside>
  );
}

function SidebarAccount() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  if (!user) {
    return (
      <div className="mt-4 rounded-[16px] border border-[#785a3224] bg-[#fbf6ec] p-3 shadow-[0_2px_12px_rgba(70,45,20,.05)]">
        <div className="mb-3 text-[12px] leading-5 text-[#8a7860]">Sign in to save sessions across devices.</div>
        <Link href="/login?next=/dashboard" className="block rounded-[12px] bg-[#2a2018] px-4 py-2.5 text-center text-[14px] font-semibold text-[#f3e8d4]">
          Sign in
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
