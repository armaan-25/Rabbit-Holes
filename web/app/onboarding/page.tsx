"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Logo";

const USE_CASES = [
  ["research", "Research", "Papers, sources, and deep dives"],
  ["studying", "Studying", "Courses, topics, and learning"],
  ["work", "Work", "Projects, docs, and competitive research"],
  ["investing", "Investing", "Markets, companies, and due diligence"],
  ["job_hunt", "Job hunting", "Companies, roles, and prep"],
  ["curiosity", "Just curious", "Wherever the rabbit hole leads"],
] as const;

const SOURCES = [
  ["papers", "Papers & arXiv"],
  ["github", "GitHub & code"],
  ["news", "News & articles"],
  ["video", "Video & talks"],
  ["forums", "Forums & social"],
  ["docs", "Docs & wikis"],
] as const;

const DEPTH = [
  ["light", "Light", "Only cluster sessions I spend real time on"],
  ["balanced", "Balanced", "A sensible default for most browsing"],
  ["thorough", "Thorough", "Capture more — I'd rather not miss a thread"],
] as const;

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Shell><p className="rh-muted text-center text-[15px]">Loading...</p></Shell>}>
      <OnboardingFlow />
    </Suspense>
  );
}

function OnboardingFlow() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const isExtensionFlow = next.startsWith("/extension-auth") || next.startsWith("/rabbit-auth");

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  const [depth, setDepth] = useState<string>("balanced");

  // Require a session; skip onboarding entirely if already done.
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) {
        window.location.replace(`/login?next=${encodeURIComponent(`/onboarding?next=${next}`)}`);
        return;
      }
      if (user.user_metadata?.onboarded || isExtensionFlow) {
        window.location.replace(next);
        return;
      }
      const meta = user.user_metadata ?? {};
      setName(meta.full_name || meta.name || "");
      setReady(true);
    });
  }, [isExtensionFlow, next]);

  function toggleSource(id: string) {
    setSources((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function finish() {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        onboarded: true,
        full_name: name.trim(),
        use_case: useCase,
        sources,
        capture_depth: depth,
      },
    });
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    window.location.replace(next);
  }

  if (!ready) {
    return <Shell><p className="rh-muted text-center text-[15px]">Loading...</p></Shell>;
  }

  const steps = [
    {
      title: "Welcome to Rabbit Holes",
      subtitle: "Let's set things up. First — what should we call you?",
      canAdvance: name.trim().length > 0,
      body: (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          className="w-full rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-4 py-3.5 text-[16px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]"
        />
      ),
    },
    {
      title: "What will you use it for?",
      subtitle: "We'll tune how sessions get clustered around this.",
      canAdvance: useCase.length > 0,
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          {USE_CASES.map(([id, label, desc]) => (
            <Choice key={id} selected={useCase === id} onClick={() => setUseCase(id)} title={label} desc={desc} />
          ))}
        </div>
      ),
    },
    {
      title: "Which sources matter most?",
      subtitle: "Pick any that fit — you can change these later in Settings.",
      canAdvance: sources.length > 0,
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SOURCES.map(([id, label]) => (
            <Choice key={id} selected={sources.includes(id)} onClick={() => toggleSource(id)} title={label} />
          ))}
        </div>
      ),
    },
    {
      title: "How much should we capture?",
      subtitle: "Sets the default sensitivity — tweak it anytime.",
      canAdvance: depth.length > 0,
      body: (
        <div className="grid gap-3">
          {DEPTH.map(([id, label, desc]) => (
            <Choice key={id} selected={depth === id} onClick={() => setDepth(id)} title={label} desc={desc} />
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Shell>
      <div className="mb-6 flex items-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[var(--rh-primary)]" : "bg-[var(--rh-line-strong)]"}`}
          />
        ))}
      </div>

      <h1 className="rh-display rh-ink text-[30px] font-semibold leading-tight">{current.title}</h1>
      <p className="rh-muted mt-2 text-[15.5px] leading-[1.5]">{current.subtitle}</p>

      <div className="mt-6">{current.body}</div>

      {error && <p className="mt-4 rounded-[13px] bg-[#fbeae6] px-4 py-3 text-[14px] text-[#b54831]">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rh-muted text-[14px] font-semibold disabled:opacity-0"
        >
          ← Back
        </button>
        <button
          onClick={() => (isLast ? void finish() : setStep((s) => s + 1))}
          disabled={!current.canAdvance || saving}
          className="rh-primary rounded-[14px] px-7 py-3 text-[15px] font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {saving ? "Saving..." : isLast ? "Finish" : "Continue"}
        </button>
      </div>
    </Shell>
  );
}

function Choice({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[15px] border px-4 py-3.5 text-left transition ${
        selected
          ? "border-[var(--rh-primary)] bg-[var(--rh-surface-2)] shadow-[0_2px_12px_rgba(70,45,20,.08)]"
          : "border-[var(--rh-line)] bg-[var(--rh-surface-3)] hover:border-[var(--rh-line-strong)]"
      }`}
    >
      <div className="text-[15px] font-semibold text-[var(--rh-ink)]">{title}</div>
      {desc && <div className="rh-muted mt-0.5 text-[13px] leading-snug">{desc}</div>}
    </button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 py-10">
      <div className="rh-surface w-full max-w-[520px] rounded-[28px] border p-8 shadow-[0_18px_60px_rgba(70,45,20,.13)]">
        <div className="mb-7 text-center">
          <Wordmark className="text-[32px]" />
        </div>
        {children}
      </div>
    </main>
  );
}
