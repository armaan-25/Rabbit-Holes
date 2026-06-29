"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { RabbitHole } from "@/lib/types";
import { BunnyO } from "@/components/Logo";
import { AI_PROVIDER_OPTIONS, DEFAULT_AI_PROVIDER, providerOption, providerReady, readAiProviderConfig, writeAiProviderConfig, type AiProviderConfig, type AiProviderType } from "@/lib/ai-provider-config";

type Row = { id: string; name: string; body: string; default: boolean; tone?: string };

const CAPTURE: Row[] = [
  { id: "auto_cluster", name: "Auto-cluster sessions", body: "Group tabs into rabbit holes automatically as you browse.", default: true },
  { id: "ignore_glances", name: "Ignore quick glances", body: "Only keep pages you spend time reading.", default: true },
  { id: "pause_idle", name: "Always-on capture", body: "Keep a local trail in the background while privacy filters stay on.", default: true },
  { id: "capture_private", name: "Capture private windows", body: "Off by default. Incognito stays incognito unless you opt in.", default: false },
];

const PRIVACY: Row[] = [
  { id: "local_first", name: "Store locally by default", body: "Investigations, summaries, and settings stay on this machine unless you export or sync later.", default: true, tone: "green" },
  { id: "strip_ids", name: "Strip identifiers", body: "Remove tokens and tracking params from captured URLs.", default: true },
  { id: "cloud_sync", name: "Optional cloud sync", body: "Reserved for a later self-hosted or opt-in sync layer. Off by default.", default: false },
];

const SOURCES: Row[] = [
  { id: "src_papers", name: "Papers & arXiv", body: "Capture research papers and preprints.", default: true },
  { id: "src_github", name: "GitHub & code", body: "Track repos, issues, and files you open.", default: true },
  { id: "src_video", name: "Video & talks", body: "Save useful video pages and timestamps.", default: true },
  { id: "src_social", name: "Social & forums", body: "Include Reddit, X, and discussion threads.", default: false },
];

const ALL_ROWS = [...CAPTURE, ...PRIVACY, ...SOURCES];
const LIVE_HOLES_KEY = "rabbit-hole-live-holes";
const LOCAL_SETTINGS_KEY = "rabbit-hole-local-settings";

function defaults(): Record<string, boolean> {
  return Object.fromEntries(ALL_ROWS.map((r) => [r.id, r.default]));
}

function readLocalSettings(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
    return raw ? { ...defaults(), ...(JSON.parse(raw) as Record<string, boolean>) } : defaults();
  } catch {
    return defaults();
  }
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
  const [settings, setSettings] = useState<Record<string, boolean>>(defaults);
  const [provider, setProvider] = useState<AiProviderConfig>(DEFAULT_AI_PROVIDER);
  const [savedAt, setSavedAt] = useState<string>("");
  const [dataMsg, setDataMsg] = useState<string>("");
  const selectedProvider = useMemo(() => providerOption(provider.type), [provider.type]);
  const ready = providerReady(provider);

  useEffect(() => {
    setSettings(readLocalSettings());
    setProvider(readAiProviderConfig());
  }, []);

  function persistSettings(next: Record<string, boolean>) {
    setSettings(next);
    window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));
    setSavedAt("Saved locally");
  }

  function toggle(id: string) {
    persistSettings({ ...settings, [id]: !settings[id] });
  }

  function updateProvider(next: AiProviderConfig) {
    setProvider(next);
    writeAiProviderConfig(next);
    setSavedAt("Provider saved locally");
  }

  function changeProvider(type: AiProviderType) {
    const option = providerOption(type);
    updateProvider({ type, model: option.defaultModel, baseUrl: option.baseUrl, apiKey: "" });
  }

  function exportData() {
    const holes = readHoles();
    const payload = { exportedAt: new Date().toISOString(), settings, aiProvider: { ...provider, apiKey: provider.apiKey ? "[redacted]" : "" }, holes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rabbit-holes-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDataMsg(`Exported ${holes.length} local hole${holes.length === 1 ? "" : "s"}.`);
  }

  function clearDormant() {
    const holes = readHoles();
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const kept = holes.filter((h) => new Date(h.lastActive || h.createdAt || 0).getTime() >= cutoff);
    const removed = holes.length - kept.length;
    window.localStorage.setItem(LIVE_HOLES_KEY, JSON.stringify(kept));
    setDataMsg(removed ? `Cleared ${removed} dormant hole${removed === 1 ? "" : "s"}.` : "No holes dormant for 30+ days.");
  }

  function resetFresh() {
    if (!window.confirm("Erase local Rabbit Holes data on this device? This cannot be undone.")) return;
    window.localStorage.removeItem(LIVE_HOLES_KEY);
    window.localStorage.removeItem(LOCAL_SETTINGS_KEY);
    setSettings(defaults());
    setDataMsg("Local Rabbit Holes data cleared.");
  }

  return (
    <div className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <main className="mx-auto w-full max-w-[980px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="rh-faint mb-7 text-[12px] font-bold uppercase tracking-[0.24em]">Extension & Local Configuration</div>
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
              <h2 className="rh-display text-[22px] font-semibold leading-none text-[#37502f]">Extension-first mode</h2>
              <p className="mt-1 text-[14px] text-[#4d7049]">Local storage · bring your own AI · optional sync later</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[var(--rh-surface)] px-4 py-2 text-[13px] font-semibold text-[#4d7049] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#7dae79]" /> Local
          </div>
        </section>

        <section className="mt-8">
          <SectionLabel>AI Provider</SectionLabel>
          <div className="rh-surface rounded-[18px] border p-6 shadow-[0_8px_24px_rgba(70,45,20,.04)]">
            <div className="grid gap-5 md:grid-cols-[240px_1fr]">
              <div>
                <label className="rh-faint text-[11px] font-bold uppercase tracking-[0.2em]">Provider</label>
                <select value={provider.type} onChange={(e) => changeProvider(e.target.value as AiProviderType)} className="mt-2 w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 py-3 text-[15px] text-[var(--rh-ink)] outline-none">
                  {AI_PROVIDER_OPTIONS.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}
                </select>
              </div>
              <div className="rh-muted self-end text-[15px] leading-7">{selectedProvider.description}</div>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Model" value={provider.model} onChange={(model) => updateProvider({ ...provider, model })} placeholder={selectedProvider.defaultModel} />
              <Field label="API key" value={provider.apiKey ?? ""} onChange={(apiKey) => updateProvider({ ...provider, apiKey })} placeholder={selectedProvider.needsKey ? "Paste your key" : "Optional"} type="password" />
              <Field label="Base URL" value={provider.baseUrl ?? ""} onChange={(baseUrl) => updateProvider({ ...provider, baseUrl })} placeholder={selectedProvider.baseUrl ?? "https://api.example.com/v1"} />
            </div>
            <div className={`mt-5 rounded-[14px] border px-4 py-3 text-[14px] ${ready ? "border-[#5f8a5c42] text-[#5f8a5c]" : "border-[#c45f3d55] text-[#b8795f]"}`}>
              {ready ? "Provider configured locally. Rabbit Holes will use your model for clustering and synthesis." : "Add the required model, key, or base URL to finish setup."}
            </div>
          </div>
        </section>

        <SettingsGroup title="Capture" rows={CAPTURE} settings={settings} onToggle={toggle} />
        <SettingsGroup title="Privacy" rows={PRIVACY} settings={settings} onToggle={toggle} />
        <SettingsGroup title="Data sources" rows={SOURCES} settings={settings} onToggle={toggle} />

        <section className="mt-8">
          <SectionLabel>Your data</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-3">
            <ActionCard title="Export everything" body="Download local settings and investigations as JSON." onClick={exportData} />
            <ActionCard title="Clear dormant holes" body="Tidy away investigations gone quiet for 30+ days." onClick={clearDormant} />
            <button onClick={resetFresh} className="rounded-[16px] border border-[#e5b8ad] bg-[var(--rh-surface)] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(70,45,20,.08)]">
              <h3 className="text-[16px] font-bold text-[#b54831]">Reset local data</h3>
              <p className="mt-1 text-[14px] leading-snug text-[#b05b49]">Erase local rabbit holes on this device.</p>
            </button>
          </div>
          {dataMsg && <p className="rh-muted mt-4 text-[14px]">{dataMsg}</p>}
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, placeholder, type = "text", onChange }: { label: string; value: string; placeholder: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="rh-faint text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
      <input value={value} type={type} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 py-3 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]" />
    </label>
  );
}

function SettingsGroup({ title, rows, settings, onToggle }: { title: string; rows: readonly Row[]; settings: Record<string, boolean>; onToggle: (id: string) => void }) {
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

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="rh-faint mb-3 text-[12px] font-bold uppercase tracking-[0.24em]">{children}</div>;
}

function Toggle({ enabled, tone, onClick }: { enabled: boolean; tone?: string; onClick: () => void }) {
  const on = tone === "green" ? "bg-[#5f8a5c]" : "bg-[#c45f3d]";
  return (
    <button type="button" onClick={onClick} aria-pressed={enabled} className={`relative h-[27px] w-[48px] shrink-0 rounded-full transition-colors ${enabled ? on : "bg-[#d8cfbf]"}`}>
      <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${enabled ? "right-[3px]" : "left-[3px]"}`} />
    </button>
  );
}

function ActionCard({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rh-surface rounded-[16px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(70,45,20,.08)]">
      <h3 className="rh-ink text-[16px] font-bold">{title}</h3>
      <p className="rh-muted mt-1 text-[14px] leading-snug">{body}</p>
    </button>
  );
}
