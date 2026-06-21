"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const CAPTURE = [
  ["Auto-cluster sessions", "Group tabs into rabbit holes automatically as you browse.", true],
  ["Ignore quick glances", "Only capture pages you actually spend time reading.", true],
  ["Pause when idle", "Stop capturing after a few minutes of inactivity.", true],
  ["Capture private windows", "Off by default — incognito stays incognito.", false],
] as const;

const PRIVACY = [
  ["Process on this device", "Clustering runs locally when possible. Nothing leaves your machine unless needed.", true, "green"],
  ["Strip identifiers", "Remove tokens and query params from captured URLs.", true],
  ["Share anonymous insights", "Help improve clustering with fully anonymized signals.", false],
] as const;

const SOURCES = [
  ["Papers & arXiv", "Capture research papers and preprints.", true],
  ["GitHub & code", "Track repos, issues, and files you open.", true],
  ["Video & talks", "Save timestamps from videos you watch.", true],
  ["Social & forums", "Include Reddit, X, and discussion threads.", false],
] as const;

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function resetFresh() {
    window.localStorage.removeItem("rabbit-hole-live-holes");
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="rh-paper min-h-screen px-6 py-12 text-[#2a2018]">
      <main className="mx-auto w-full max-w-[980px]">
        <div className="mb-8">
          <div className="mb-7 text-[12px] font-bold uppercase tracking-[0.24em] text-[#a8967d]">Extension & Privacy</div>
          <h1 className="rh-display text-[44px] font-semibold leading-none tracking-[-0.03em] text-[#2a2018]">Settings</h1>
        </div>

        <section className="mb-8 flex items-center justify-between rounded-[20px] border border-[#5f8a5c42] bg-[#eef5ea] px-6 py-5 shadow-[0_8px_30px_rgba(70,45,20,.04)]">
          <div className="flex items-center gap-4">
            <div className="relative grid h-12 w-12 place-items-center rounded-[12px] bg-white shadow-[0_1px_4px_rgba(70,45,20,.12)]">
              <span className="text-[22px] text-[#2a2018]">△</span>
              <span className="absolute right-[-3px] top-[-3px] h-4 w-4 rounded-full border-2 border-[#eef5ea] bg-[#6a9a66]" />
            </div>
            <div>
              <h2 className="rh-display text-[22px] font-semibold leading-none text-[#37502f]">Extension plugged in</h2>
              <p className="mt-1 text-[14px] text-[#4d7049]">Chrome · v2.4.1 · capturing this session</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#eef5ea] px-4 py-2 text-[13px] font-semibold text-[#4d7049] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#7dae79]" /> Live
          </div>
        </section>

        <SettingsGroup title="Capture" rows={CAPTURE} />
        <SettingsGroup title="Privacy" rows={PRIVACY} />
        <SettingsGroup title="Data sources" rows={SOURCES} />

        <section className="mt-8">
          <SectionLabel>Your data</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-3">
            <ActionCard title="Export everything" body="Download your warren as JSON — yours to keep." />
            <ActionCard title="Clear dormant holes" body="Tidy away investigations gone quiet for 30+ days." />
            <button onClick={resetFresh} className="rounded-[16px] border border-[#e5b8ad] bg-[#fbf6ec] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(70,45,20,.08)]">
              <h3 className="text-[16px] font-bold text-[#b54831]">Reset & start fresh</h3>
              <p className="mt-1 text-[14px] leading-snug text-[#b05b49]">Erase all rabbit holes. This cannot be undone.</p>
            </button>
          </div>
        </section>

        <div className="mt-10 text-[13px] text-[#8a7860]">
          Signed in as <span className="font-semibold text-[#5a4a38]">{user?.email ?? "guest"}</span>
        </div>
      </main>
    </div>
  );
}

function SettingsGroup({ title, rows }: { title: string; rows: readonly (readonly [string, string, boolean, string?])[] }) {
  return (
    <section className="mt-8">
      <SectionLabel>{title}</SectionLabel>
      <div className="overflow-hidden rounded-[18px] border border-[#785a3224] bg-[#fbf6ec] shadow-[0_8px_24px_rgba(70,45,20,.04)]">
        {rows.map(([name, body, enabled, tone], i) => (
          <div key={name} className={`flex items-center justify-between gap-5 px-6 py-4 ${i ? "border-t border-[#785a3224]" : ""}`}>
            <div>
              <h3 className="text-[16px] font-bold leading-tight text-[#2a2018]">{name}</h3>
              <p className="mt-1 text-[14px] leading-snug text-[#6a5a48]">{body}</p>
            </div>
            <Toggle enabled={enabled} tone={tone} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.24em] text-[#a8967d]">{children}</div>;
}

function Toggle({ enabled, tone }: { enabled: boolean; tone?: string }) {
  const on = tone === "green" ? "bg-[#5f8a5c]" : "bg-[#c45f3d]";
  return (
    <span className={`relative h-[27px] w-[48px] shrink-0 rounded-full ${enabled ? on : "bg-[#d8cfbf]"}`}>
      <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow ${enabled ? "right-[3px]" : "left-[3px]"}`} />
    </span>
  );
}

function ActionCard({ title, body }: { title: string; body: string }) {
  return (
    <button className="rounded-[16px] border border-[#785a3224] bg-[#fbf6ec] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(70,45,20,.08)]">
      <h3 className="text-[16px] font-bold text-[#2a2018]">{title}</h3>
      <p className="mt-1 text-[14px] leading-snug text-[#6a5a48]">{body}</p>
    </button>
  );
}
