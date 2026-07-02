"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { RabbitHole } from "@/lib/types";
import { BunnyO } from "@/components/Logo";
import { validateCurrentProvider } from "@/lib/ai-provider";
import { AI_PROVIDER_OPTIONS, DEFAULT_AI_PROVIDER, clearExtensionLocalData, providerOption, providerReady, publicAiProviderConfig, readAiProviderConfig, readExtensionConfig, writeAiProviderConfig, writeExtensionConfig, type AiProviderConfig, type AiProviderType } from "@/lib/ai-provider-config";

type Row = { id: string; name: string; body: string; default: boolean; tone?: string };

const CAPTURE: Row[] = [
  { id: "auto_cluster", name: "Auto-cluster sessions", body: "Group tabs into rabbit holes automatically as you browse.", default: true },
  { id: "ignore_glances", name: "Ignore quick glances", body: "Only keep pages you spend time reading.", default: true },
  { id: "pause_idle", name: "Always-on capture", body: "Keep a private trail in the background while privacy filters stay on.", default: true },
  { id: "capture_private", name: "Capture private windows", body: "Off by default. Incognito stays incognito unless you opt in.", default: false },
];

const PRIVACY: Row[] = [
  { id: "local_first", name: "Keep browsing private", body: "Captured page metadata stays in your browser unless you choose to export it.", default: true, tone: "green" },
  { id: "strip_ids", name: "Strip identifiers", body: "Remove tokens and tracking params from captured URLs.", default: true },
  { id: "cloud_sync", name: "Hosted inference", body: "Off by default. Rabbit Holes uses the provider you configure instead.", default: false },
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
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<Record<string, boolean>>(defaults);
  const [provider, setProvider] = useState<AiProviderConfig>(DEFAULT_AI_PROVIDER);
  const [savedAt, setSavedAt] = useState<string>("");
  const [dataMsg, setDataMsg] = useState<string>("");
  const [providerStatus, setProviderStatus] = useState<"idle" | "saving" | "validating" | "valid" | "invalid">("idle");
  const selectedProvider = useMemo(() => providerOption(provider.type), [provider.type]);
  const ready = providerReady(provider);
  const bannerCopy =
    providerStatus === "invalid"
      ? {
          title: "Provider needs attention",
          body: "Your settings were saved, but the test request failed. Check the key, model, and provider.",
          pill: "Check key",
          tone: "error",
        }
      : providerStatus === "valid"
        ? {
            title: "Rabbit Holes is ready",
            body: "Your provider passed a live test. You can build rabbit holes with this model.",
            pill: "Ready",
            tone: "ready",
          }
        : providerStatus === "saving" || providerStatus === "validating"
          ? {
              title: "Checking provider",
              body: "Saving your settings and running a lightweight test request.",
              pill: "Checking",
              tone: "pending",
            }
          : ready
            ? {
                title: "Provider saved",
                body: "Run a quick test before building rabbit holes with this model.",
                pill: "Test needed",
                tone: "pending",
              }
            : {
                title: "Choose an AI provider",
                body: "Add a provider and API key before building rabbit holes.",
                pill: "Setup",
                tone: "setup",
              };
  const bannerClass =
    bannerCopy.tone === "error"
      ? "border-[#c45f3d55] bg-[#3a1f181f] text-[#d08a6f]"
      : bannerCopy.tone === "pending"
        ? "border-[#b08a5a55] bg-[#31271955] text-[#d7bd91]"
        : "border-[#5f8a5c55] bg-[#27301f] text-[#9bc391]";
  const savedAtClass =
    providerStatus === "invalid"
      ? "text-[#d08a6f]"
      : providerStatus === "valid"
        ? "text-[#9bc391]"
        : "rh-muted";

  useEffect(() => {
    const localSettings = readLocalSettings();
    const localProvider = readAiProviderConfig();
    const publicLocalProvider = publicAiProviderConfig(localProvider);
    setSettings(localSettings);
    setProvider(publicLocalProvider);
    readExtensionConfig().then(async (extensionConfig) => {
      if (extensionConfig?.settings) {
        const merged = { ...defaults(), ...extensionConfig.settings };
        setSettings(merged);
        window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
      } else {
        void writeExtensionConfig({ settings: localSettings });
      }

      if (extensionConfig?.aiProvider) {
        const publicProvider = publicAiProviderConfig(extensionConfig.aiProvider);
        setProvider(publicProvider);
        writeAiProviderConfig(publicProvider);
      } else {
        const saved = await writeExtensionConfig({ aiProvider: localProvider });
        if (saved) writeAiProviderConfig(publicLocalProvider);
      }
    });
  }, []);

  function persistSettings(next: Record<string, boolean>) {
    setSettings(next);
    window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));
    void writeExtensionConfig({ settings: next });
    setSavedAt("Settings saved");
  }

  function toggle(id: string) {
    persistSettings({ ...settings, [id]: !settings[id] });
  }

  function updateProvider(next: Partial<AiProviderConfig>) {
    const merged = { ...provider, ...next };
    setProvider(merged);
    writeAiProviderConfig(publicAiProviderConfig(merged));
    setProviderStatus("idle");
    setSavedAt(merged.apiKey?.trim() ? "Saving API key to extension..." : "Provider saved");
    void writeExtensionConfig({ aiProvider: merged }).then((saved) => {
      if (!saved && merged.apiKey?.trim()) {
        setProviderStatus("invalid");
        setSavedAt("Install or reload the extension to save the API key");
        return;
      }
      const publicConfig = publicAiProviderConfig(merged);
      setProvider(publicConfig);
      writeAiProviderConfig(publicConfig);
      setSavedAt(merged.apiKey?.trim() ? "API key saved in extension" : "Provider saved");
    });
  }

  async function saveAndValidateProvider(next: AiProviderConfig) {
    const merged = { ...provider, ...next };
    if (!providerReady(merged)) {
      const publicConfig = publicAiProviderConfig(merged);
      setProvider(publicConfig);
      writeAiProviderConfig(publicConfig);
      void writeExtensionConfig({ aiProvider: merged });
      setProviderStatus("idle");
      setSavedAt("Add the required provider fields before testing");
      return;
    }

    setProviderStatus("saving");
    const saved = await writeExtensionConfig({ aiProvider: merged });
    const publicConfig = publicAiProviderConfig(merged);
    setProvider(publicConfig);
    writeAiProviderConfig(publicConfig);
    if (!saved) {
      setProviderStatus("invalid");
      setSavedAt("Extension storage unavailable");
      return;
    }

    setProviderStatus("validating");
    const valid = await validateCurrentProvider();
    setProviderStatus(valid ? "valid" : "invalid");
    setSavedAt(valid ? "Provider validated" : "Provider saved, validation failed");
  }

  function changeProvider(type: AiProviderType) {
    const option = providerOption(type);
    updateProvider({ type, model: option.defaultModel, baseUrl: option.baseUrl, apiKey: "", hasApiKey: false });
  }

  function changeModel(value: string) {
    const model = value === "__custom" ? "" : value;
    updateProvider({ ...provider, model });
  }

  function changeBaseUrl(value: string) {
    const baseUrl = value === "__custom" ? "" : value;
    updateProvider({ ...provider, baseUrl });
  }

  function exportData() {
    const holes = readHoles();
    const payload = { exportedAt: new Date().toISOString(), settings, aiProvider: { ...publicAiProviderConfig(provider), hasApiKey: false }, holes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rabbit-holes-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDataMsg(`Exported ${holes.length} rabbit hole${holes.length === 1 ? "" : "s"}.`);
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
    if (!window.confirm("Erase Rabbit Holes data from this browser? This cannot be undone.")) return;
    window.localStorage.removeItem(LIVE_HOLES_KEY);
    window.localStorage.removeItem(LOCAL_SETTINGS_KEY);
    window.localStorage.removeItem("rabbit-hole-ai-provider");
    setSettings(defaults());
    setProvider(DEFAULT_AI_PROVIDER);
    void clearExtensionLocalData();
    void writeExtensionConfig({ settings: defaults() });
    setDataMsg("Rabbit Holes browser data cleared.");
  }

  async function importData(file: File | null) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text()) as { settings?: Record<string, boolean>; aiProvider?: AiProviderConfig; holes?: RabbitHole[] };
      if (payload.settings) {
        const next = { ...defaults(), ...payload.settings };
        setSettings(next);
        window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));
        await writeExtensionConfig({ settings: next });
      }
      if (payload.aiProvider) {
        const hasRealKey = Boolean(payload.aiProvider.apiKey && payload.aiProvider.apiKey !== "[redacted]");
        const nextProvider = hasRealKey ? payload.aiProvider : { ...publicAiProviderConfig(payload.aiProvider), hasApiKey: false };
        const publicProvider = publicAiProviderConfig(nextProvider);
        setProvider(publicProvider);
        writeAiProviderConfig(publicProvider);
        await writeExtensionConfig({ aiProvider: nextProvider });
      }
      if (Array.isArray(payload.holes)) window.localStorage.setItem(LIVE_HOLES_KEY, JSON.stringify(payload.holes));
      setDataMsg(`Imported ${Array.isArray(payload.holes) ? payload.holes.length : 0} rabbit hole${payload.holes?.length === 1 ? "" : "s"}.`);
    } catch {
      setDataMsg("Import failed. Choose a Rabbit Holes JSON export.");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  return (
    <div className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <main className="mx-auto w-full max-w-[980px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="rh-faint mb-7 text-[12px] font-bold uppercase tracking-[0.24em]">Extension settings</div>
            <h1 className="rh-display rh-ink text-[44px] font-semibold leading-none tracking-[-0.03em]">Settings</h1>
          </div>
          {savedAt && <span className={`${savedAtClass} text-[13px] italic`}>{savedAt}</span>}
        </div>

        <section className={`mb-8 flex items-center justify-between rounded-[20px] border px-6 py-5 shadow-[0_8px_30px_rgba(70,45,20,.04)] ${bannerClass}`}>
          <div className="flex items-center gap-4">
            <div className="relative grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--rh-surface-3)] text-[30px] leading-none shadow-[0_1px_4px_rgba(70,45,20,.12)]">
              <BunnyO />
              <span className="absolute right-[-3px] top-[-3px] h-4 w-4 rounded-full border-2 border-[var(--rh-surface)] bg-current" />
            </div>
            <div>
              <h2 className="rh-display text-[22px] font-semibold leading-none">{bannerCopy.title}</h2>
              <p className="mt-1 text-[14px] opacity-90">{bannerCopy.body}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[var(--rh-surface)] px-4 py-2 text-[13px] font-semibold sm:flex">
            <span className="h-2 w-2 rounded-full bg-current" /> {bannerCopy.pill}
          </div>
        </section>

        <section className="mt-8">
          <SectionLabel>AI Provider</SectionLabel>
          <div className="rh-surface rounded-[18px] border p-6 shadow-[0_8px_24px_rgba(70,45,20,.04)]">
            <div className="grid gap-5 md:grid-cols-[240px_1fr]">
              <div>
                <label className="rh-faint text-[11px] font-bold uppercase tracking-[0.2em]">Provider</label>
                <div className="relative mt-2 w-full">
                  <select
                    value={provider.type}
                    onChange={(e) => changeProvider(e.target.value as AiProviderType)}
                    className="h-[50px] w-full appearance-none rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-4 pr-12 text-[15px] font-semibold text-[var(--rh-ink)] outline-none transition hover:border-[var(--rh-line-strong)] focus:border-[var(--rh-line-strong)]"
                  >
                  {AI_PROVIDER_OPTIONS.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 h-2 w-2 -translate-y-[65%] rotate-45 border-b-2 border-r-2 border-[var(--rh-muted)]" />
                </div>
              </div>
              <div className="rh-muted self-end text-[15px] leading-7">{selectedProvider.description}</div>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <PresetSelect
                label="Model"
                value={provider.model}
                options={selectedProvider.models}
                customLabel="Custom model"
                onChange={changeModel}
                onBlur={() => void saveAndValidateProvider(provider)}
              />
              <SecretField
                label="API key"
                value={provider.apiKey ?? ""}
                saved={Boolean(provider.hasApiKey && !provider.apiKey)}
                onChange={(apiKey) => {
                  setProvider({ ...provider, apiKey, hasApiKey: Boolean(apiKey.trim()) || provider.hasApiKey });
                  setProviderStatus("idle");
                }}
                onBlur={(apiKey) => void saveAndValidateProvider({ ...provider, apiKey, hasApiKey: Boolean(apiKey.trim()) || provider.hasApiKey })}
                placeholder={provider.hasApiKey ? "Saved in extension" : selectedProvider.needsKey ? "Paste your key" : "Optional"}
              />
              <EndpointSelect
                label="Base URL"
                value={provider.baseUrl ?? ""}
                endpoints={selectedProvider.baseUrls}
                onChange={changeBaseUrl}
                onBlur={() => void saveAndValidateProvider(provider)}
              />
            </div>
            <div className={`mt-5 rounded-[14px] border px-4 py-3 text-[14px] ${
              providerStatus === "invalid"
                ? "border-[#c45f3d66] bg-[#3a1f181f] text-[#d08a6f]"
                : providerStatus === "valid"
                  ? "border-[#5f8a5c42] bg-[#22301f55] text-[#9bc391]"
                  : ready
                    ? "border-[var(--rh-line)] text-[var(--rh-muted)]"
                    : "border-[#c45f3d55] text-[#b8795f]"
            }`}>
              {providerStatus === "validating"
                ? "Checking the provider with a lightweight request..."
                : providerStatus === "valid"
                  ? "Provider validated. Your key stays in the extension."
                : providerStatus === "invalid"
                  ? "Saved, but the test request failed. Check the key, model, and provider."
                  : ready
                    ? "Provider saved. Test it once before building rabbit holes."
                    : selectedProvider.needsKey && !provider.hasApiKey && !provider.apiKey?.trim()
                      ? "Add an API key before building rabbit holes. The key is saved in the extension."
                      : "Add the required model or base URL to finish setup."}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={providerStatus === "saving" || providerStatus === "validating"}
                onClick={() => void saveAndValidateProvider(provider)}
                className="rounded-full border border-[var(--rh-line)] px-5 py-2 text-[14px] font-semibold text-[var(--rh-ink)] transition hover:border-[var(--rh-line-strong)] hover:bg-[var(--rh-surface-3)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {providerStatus === "saving" || providerStatus === "validating" ? "Testing..." : "Test provider"}
              </button>
            </div>
          </div>
        </section>

        <SettingsGroup title="Capture" rows={CAPTURE} settings={settings} onToggle={toggle} />
        <SettingsGroup title="Privacy" rows={PRIVACY} settings={settings} onToggle={toggle} />
        <SettingsGroup title="Data sources" rows={SOURCES} settings={settings} onToggle={toggle} />

        <section className="mt-8">
          <SectionLabel>Your data</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-4">
            <ActionCard title="Export everything" body="Download settings and investigations as JSON." onClick={exportData} />
            <ActionCard title="Import JSON" body="Restore a Rabbit Holes export in this browser." onClick={() => importInputRef.current?.click()} />
            <ActionCard title="Clear dormant holes" body="Tidy away investigations gone quiet for 30+ days." onClick={clearDormant} />
            <button onClick={resetFresh} className="rounded-[16px] border border-[#e5b8ad] bg-[var(--rh-surface)] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(70,45,20,.08)]">
              <h3 className="text-[16px] font-bold text-[#b54831]">Reset browser data</h3>
              <p className="mt-1 text-[14px] leading-snug text-[#b05b49]">Erase rabbit holes and settings in this browser.</p>
            </button>
          </div>
          <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importData(event.target.files?.[0] ?? null)} />
          {dataMsg && <p className="rh-muted mt-4 text-[14px]">{dataMsg}</p>}
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, placeholder, type = "text", onChange, onBlur }: { label: string; value: string; placeholder: string; type?: string; onChange: (value: string) => void; onBlur?: () => void }) {
  return (
    <label>
      <span className="rh-faint text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
      <input value={value} type={type} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} className="mt-2 w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 py-3 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]" />
    </label>
  );
}

function PresetSelect({ label, value, options, customLabel, onChange, onBlur }: { label: string; value: string; options: string[]; customLabel: string; onChange: (value: string) => void; onBlur?: () => void }) {
  const usesCustom = !value || !options.includes(value);
  return (
    <label>
      <span className="rh-faint text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
      <select
        value={usesCustom ? "__custom" : value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="mt-2 h-[50px] w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 text-[15px] font-semibold text-[var(--rh-ink)] outline-none"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
        <option value="__custom">{customLabel}</option>
      </select>
      {(usesCustom || value === "") && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Enter model id"
          className="mt-3 w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 py-3 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]"
        />
      )}
    </label>
  );
}

function EndpointSelect({ label, value, endpoints, onChange, onBlur }: { label: string; value: string; endpoints: Array<{ label: string; value: string; locked?: boolean }>; onChange: (value: string) => void; onBlur?: () => void }) {
  const knownValues = endpoints.map((endpoint) => endpoint.value);
  const usesCustom = Boolean(value && !knownValues.includes(value));
  const selected = endpoints.find((endpoint) => endpoint.value === value) ?? endpoints[0];
  const locked = Boolean(selected?.locked);
  return (
    <label>
      <span className="rh-faint text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
      <select
        value={usesCustom ? "__custom" : value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="mt-2 h-[50px] w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 text-[15px] font-semibold text-[var(--rh-ink)] outline-none disabled:cursor-not-allowed disabled:opacity-75"
      >
        {endpoints.map((endpoint) => <option key={`${endpoint.label}-${endpoint.value}`} value={endpoint.value}>{endpoint.label}</option>)}
        {!locked && <option value="__custom">Custom endpoint</option>}
      </select>
      {locked ? (
        <p className="rh-muted mt-2 text-[13px]">Rabbit Holes uses this provider's native API. No base URL is needed.</p>
      ) : (usesCustom || value === "") && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="https://your-endpoint.example/v1"
          className="mt-3 w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 py-3 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]"
        />
      )}
    </label>
  );
}

function SecretField({ label, value, saved, placeholder, onChange, onBlur }: { label: string; value: string; saved: boolean; placeholder: string; onChange: (value: string) => void; onBlur: (value: string) => void }) {
  return (
    <label>
      <span className="rh-faint text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
      <div className="relative mt-2">
        <input
          value={value}
          name="rabbit-holes-provider-key"
          type="password"
          autoComplete="new-password"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(event) => onBlur(event.currentTarget.value)}
          placeholder={placeholder}
          className="w-full rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3 py-3 pr-24 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--rh-line)] px-2 py-1 text-[11px] font-semibold text-[var(--rh-muted)]">
          {saved ? "saved" : value ? "hidden" : "empty"}
        </span>
      </div>
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
