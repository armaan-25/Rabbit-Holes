"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { RabbitHole } from "@/lib/types";
import { BunnyO } from "@/components/Logo";
import { apiErrorMessage, clearBackendData, exportBackendData } from "@/lib/api";

type Row = { id: string; name: string; body: string; default: boolean; tone?: string };

const CAPTURE: Row[] = [
  { id: "auto_cluster", name: "Auto-cluster sessions", body: "Group tabs into rabbit holes automatically as you browse.", default: true },
  { id: "ignore_glances", name: "Ignore quick glances", body: "Only capture pages you actually spend time reading.", default: true },
  { id: "pause_idle", name: "Always-on capture", body: "Rabbit Holes keeps monitoring like Honey while privacy filters stay on.", default: true },
  { id: "capture_private", name: "Capture private windows", body: "Off by default — incognito stays incognito.", default: false },
];

const PRIVACY: Row[] = [
  { id: "local_first", name: "Process on this device", body: "Clustering runs locally when possible. Nothing leaves your machine unless needed.", default: true, tone: "green" },
  { id: "strip_ids", name: "Strip identifiers", body: "Remove tokens and query params from captured URLs.", default: true },
  { id: "anon_insights", name: "Share anonymous insights", body: "Help improve clustering with fully anonymized signals.", default: false },
];

const SOURCES: Row[] = [
  { id: "src_papers", name: "Papers & arXiv", body: "Capture research papers and preprints.", default: true },
  { id: "src_github", name: "GitHub & code", body: "Track repos, issues, and files you open.", default: true },
  { id: "src_video", name: "Video & talks", body: "Save timestamps from videos you watch.", default: true },
  { id: "src_social", name: "Social & forums", body: "Include Reddit, X, and discussion threads.", default: false },
];

const ALL_ROWS = [...CAPTURE, ...PRIVACY, ...SOURCES];
const LIVE_HOLES_KEY = "rabbit-hole-live-holes";

function defaults(): Record<string, boolean> {
  return Object.fromEntries(ALL_ROWS.map((r) => [r.id, r.default]));
}

function readHoles(): RabbitHole[] {
  try {
    const raw = window.localStorage.getItem(LIVE_HOLES_KEY);
    return raw ? (JSON.parse(raw) as RabbitHole[]) : [];
  } catch {
    return [];
  }
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Record<string, boolean>>(defaults);
  const [savedAt, setSavedAt] = useState<string>("");
  const [dataMsg, setDataMsg] = useState<string>("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setUser(u);
      const stored = (u?.user_metadata?.settings ?? {}) as Record<string, boolean>;
      setSettings({ ...defaults(), ...stored });
    });
  }, []);

  async function toggle(id: string) {
    const next = { ...settings, [id]: !settings[id] };
    setSettings(next);
    setSavedAt("Saving…");
    const { error } = await supabase.auth.updateUser({ data: { settings: next } });
    setSavedAt(error ? `Couldn't save: ${error.message}` : "Saved");
  }

  async function exportData() {
    const holes = readHoles();
    setDataMsg("Preparing export...");
    let backend: unknown | null = null;
    let backendError = "";
    try {
      backend = await exportBackendData();
    } catch (err) {
      backendError = apiErrorMessage(err, "export backend capture data");
    }
    const payload = { exportedAt: new Date().toISOString(), email: user?.email ?? null, settings, holes, backend };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rabbit-holes-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDataMsg(backendError || `Exported ${holes.length} local hole${holes.length === 1 ? "" : "s"}${backend ? " plus backend capture data" : ""}.`);
  }

  function clearDormant() {
    const holes = readHoles();
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const kept = holes.filter((h) => new Date(h.lastActive || h.createdAt || 0).getTime() >= cutoff);
    const removed = holes.length - kept.length;
    window.localStorage.setItem(LIVE_HOLES_KEY, JSON.stringify(kept));
    setDataMsg(removed ? `Cleared ${removed} dormant hole${removed === 1 ? "" : "s"}.` : "No holes dormant for 30+ days.");
  }

  async function resetFresh() {
    if (!window.confirm("Erase all rabbit holes and sign out? This cannot be undone.")) return;
    setDataMsg("Clearing backend data...");
    try {
      await clearBackendData();
    } catch (err) {
      setDataMsg(apiErrorMessage(err, "clear backend data"));
      return;
    }
    window.localStorage.removeItem(LIVE_HOLES_KEY);
    await supabase.auth.signOut();
    window.location.replace("/login?next=/dashboard");
  }

  return (
    <div className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <main className="mx-auto w-full max-w-[980px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="rh-faint mb-7 text-[12px] font-bold uppercase tracking-[0.24em]">Extension & Privacy</div>
            <h1 className="rh-display rh-ink text-[44px] font-semibold leading-none tracking-[-0.03em]">Settings</h1>
          </div>
          {savedAt && <span className="rh-muted text-[13px] italic">{savedAt}</span>}
        </div>

        <section className="mb-8 flex items-center justify-between rounded-[20px] border border-[#5f8a5c42] bg-[color-mix(in_srgb,var(--rh-green)_13%,var(--rh-surface))] px-6 py-5 shadow-[0_8px_30px_rgba(70,45,20,.04)]">
          <div className="flex items-center gap-4">
            <div className="relative grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--rh-surface-3)] text-[30px] leading-none text-[#37502f] shadow-[0_1px_4px_rgba(70,45,20,.12)]">
              <BunnyO />
              <span className="absolute right-[-3px] top-[-3px] h-4 w-4 rounded-full border-2 border-[var(--rh-surface)] bg-[#6a9a66]" />
            </div>
            <div>
              <h2 className="rh-display text-[22px] font-semibold leading-none text-[#37502f]">Extension plugged in</h2>
              <p className="mt-1 text-[14px] text-[#4d7049]">Chrome · capturing this session</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[var(--rh-surface)] px-4 py-2 text-[13px] font-semibold text-[#4d7049] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#7dae79]" /> Live
          </div>
        </section>

        <SettingsGroup title="Capture" rows={CAPTURE} settings={settings} onToggle={toggle} />
        <SettingsGroup title="Privacy" rows={PRIVACY} settings={settings} onToggle={toggle} />
        <SettingsGroup title="Data sources" rows={SOURCES} settings={settings} onToggle={toggle} />

        <section className="mt-8">
          <SectionLabel>Your data</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-3">
            <ActionCard title="Export everything" body="Download your warren as JSON — yours to keep." onClick={exportData} />
            <ActionCard title="Clear dormant holes" body="Tidy away investigations gone quiet for 30+ days." onClick={clearDormant} />
            <button onClick={resetFresh} className="rounded-[16px] border border-[#e5b8ad] bg-[var(--rh-surface)] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(70,45,20,.08)]">
              <h3 className="text-[16px] font-bold text-[#b54831]">Reset & start fresh</h3>
              <p className="mt-1 text-[14px] leading-snug text-[#b05b49]">Erase all rabbit holes. This cannot be undone.</p>
            </button>
          </div>
          {dataMsg && <p className="rh-muted mt-4 text-[14px]">{dataMsg}</p>}
        </section>

        <div className="rh-muted mt-10 text-[13px]">
          Signed in as <span className="font-semibold text-[var(--rh-ink-soft)]">{user?.email ?? "guest"}</span>
        </div>
      </main>
    </div>
  );
}

function SettingsGroup({
  title,
  rows,
  settings,
  onToggle,
}: {
  readonly title: string;
  readonly rows: readonly Row[];
  readonly settings: Record<string, boolean>;
  readonly onToggle: (id: string) => void;
}) {
  return (
    <section className="mt-8">
      <SectionLabel>{title}</SectionLabel>
      <div className="rh-surface overflow-hidden rounded-[18px] border shadow-[0_8px_24px_rgba(70,45,20,.04)]">
        {rows.map((row, i) => (
          <div key={row.id} className={`flex items-center justify-between gap-5 px-6 py-4 ${i ? "border-t border-[var(--rh-line)]" : ""}`}>
            <div className="min-w-0">
              <h3 className="rh-ink text-[16px] font-bold leading-tight">{row.name}</h3>
              <p className="rh-muted mt-1 text-[14px] leading-snug">{row.body}</p>
            </div>
            <Toggle enabled={settings[row.id] ?? row.default} tone={row.tone} onClick={() => onToggle(row.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { readonly children: ReactNode }) {
  return <div className="rh-faint mb-3 text-[12px] font-bold uppercase tracking-[0.24em]">{children}</div>;
}

function Toggle({ enabled, tone, onClick }: { readonly enabled: boolean; readonly tone?: string; readonly onClick: () => void }) {
  const on = tone === "green" ? "bg-[#5f8a5c]" : "bg-[#c45f3d]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={enabled}
      className={`relative h-[27px] w-[48px] shrink-0 rounded-full transition-colors ${enabled ? on : "bg-[#d8cfbf]"}`}
    >
      <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${enabled ? "right-[3px]" : "left-[3px]"}`} />
    </button>
  );
}

function ActionCard({ title, body, onClick }: { readonly title: string; readonly body: string; readonly onClick: () => void }) {
  return (
    <button onClick={onClick} className="rh-surface rounded-[16px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(70,45,20,.08)]">
      <h3 className="rh-ink text-[16px] font-bold">{title}</h3>
      <p className="rh-muted mt-1 text-[14px] leading-snug">{body}</p>
    </button>
  );
}
