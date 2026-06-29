"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Wordmark } from "@/components/Logo";
import { LandingDemo } from "@/components/LandingDemo";

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-90px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const exampleStats = [
  ["Storage", "Local by default"],
  ["AI", "Your provider"],
  ["Current question", "How does vLLM schedule requests?"],
  ["Last stop", "DistServe section 4"],
  ["Next", "Sarathi"],
];

export default function Landing() {
  const [installOpen, setInstallOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("rabbit-hole-theme");
    document.documentElement.classList.toggle("rabbit-dark", saved !== "light");
  }, []);

  return (
    <div className="rh-paper min-h-screen overflow-x-hidden text-[var(--rh-ink)]">
      <AnimatePresence>{installOpen && <InstallInstructionsPopup onClose={() => setInstallOpen(false)} />}</AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-[var(--rh-line)] bg-[color-mix(in_srgb,var(--rh-bg)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="no-underline"><Wordmark className="text-[24px]" /></Link>
          <nav className="flex items-center gap-3 text-[14px] font-semibold">
            <a href="#about" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] transition hover:text-[var(--rh-ink)] sm:inline-flex">About</a>
            <Link href="/install" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] no-underline transition hover:text-[var(--rh-ink)] sm:inline-flex">Install</Link>
            <a href="https://github.com/armaan-25/Rabbit-Holes" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] no-underline transition hover:text-[var(--rh-ink)] sm:inline-flex">GitHub</a>
            <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-5 py-2.5 text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
              Download
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1180px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.96fr_1.04fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <div className="rh-faint mb-7 text-[12px] font-semibold uppercase tracking-[0.24em]">Browser extension · Local first · Bring your own AI</div>
            <h1 className="rh-display max-w-[10ch] text-[clamp(64px,9vw,118px)] font-semibold leading-[0.92] tracking-[-0.035em] text-[var(--rh-ink)]">
              Follow ideas, not tabs.
            </h1>
            <p className="rh-muted mt-7 max-w-[34ch] text-[22px] leading-[1.45]">
              Rabbit Holes is a browser companion for learning on the internet. Install it, point it at your model, and keep the trail.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-7 py-4 text-[17px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
                Download Extension
              </button>
              <a href="#example" className="rounded-full border border-[var(--rh-line-strong)] px-7 py-4 text-[17px] font-semibold text-[var(--rh-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--rh-ink)]">
                See Example
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <ExampleArtifact />
          </motion.div>
        </section>

        <section id="example" className="mx-auto w-full max-w-[1180px] scroll-mt-28 px-5 py-24 sm:px-8">
          <motion.div {...reveal} className="mb-10 max-w-[780px]">
            <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">The extension is the product</div>
            <h2 className="rh-display text-[clamp(42px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--rh-ink)]">
              A tool you install, configure, and own.
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}><LandingDemo /></motion.div>
        </section>

        <section id="about" className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 py-20 sm:px-8 lg:grid-cols-3">
          {[
            ["Local first", "Investigations, browsing metadata, summaries, and settings live on your machine by default."],
            ["Bring your own model", "OpenAI, Anthropic, OpenRouter, Gemini, Ollama, LM Studio, or any OpenAI-compatible endpoint."],
            ["Hackable", "The core is provider-agnostic: extension, local storage, AI adapter, optional sync later."],
          ].map(([title, body], i) => (
            <motion.div key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="rounded-[28px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-8">
              <div className="rh-faint mb-12 text-[12px] font-semibold uppercase tracking-[0.22em]">0{i + 1}</div>
              <h3 className="rh-display text-[30px] font-semibold leading-tight text-[var(--rh-ink)]">{title}</h3>
              <p className="rh-muted mt-3 text-[18px] leading-[1.55]">{body}</p>
            </motion.div>
          ))}
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-5 py-24 sm:px-8">
          <motion.div {...reveal} className="rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-8 sm:p-12 lg:p-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-end">
              <div>
                <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">Configuration</div>
                <h2 className="rh-display max-w-[11ch] text-[clamp(44px,6vw,78px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--rh-ink)]">
                  Paste a key. Start browsing.
                </h2>
              </div>
              <div>
                <pre className="overflow-hidden rounded-[22px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] p-5 text-[14px] leading-7 text-[var(--rh-ink-soft)]">{`provider:\n  type: openrouter\napiKey: sk-or-...\nmodel: anthropic/claude-sonnet-4`}</pre>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-7 py-4 text-[16px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">Download Extension</button>
                  <Link href="/settings" className="rounded-full border border-[var(--rh-line-strong)] px-7 py-4 text-[16px] font-semibold text-[var(--rh-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--rh-ink)]">Open Settings</Link>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-[var(--rh-line)]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col justify-between gap-4 px-5 py-8 text-[14px] text-[var(--rh-muted)] sm:flex-row sm:px-8">
          <Wordmark className="text-[18px]" />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/install" className="no-underline hover:text-[var(--rh-ink)]">Install</Link>
            <Link href="/privacy" className="no-underline hover:text-[var(--rh-ink)]">Privacy</Link>
            <Link href="/terms" className="no-underline hover:text-[var(--rh-ink)]">Terms</Link>
            <a href="https://github.com/armaan-25/Rabbit-Holes" className="no-underline hover:text-[var(--rh-ink)]">GitHub</a>
            <a href="mailto:aa5851@columbia.edu" className="no-underline hover:text-[var(--rh-ink)]">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ExampleArtifact() {
  return (
    <div className="rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-7 shadow-[0_18px_50px_rgba(26,16,9,.08)]">
      <div className="mb-10 flex items-center justify-between gap-6">
        <div>
          <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.22em]">Investigation</div>
          <h2 className="rh-display mt-2 text-[44px] font-semibold leading-none tracking-[-0.025em] text-[var(--rh-ink)]">AI Systems</h2>
        </div>
        <div className="h-2.5 w-2.5 rounded-full bg-[var(--rh-green)]" />
      </div>
      <div className="divide-y divide-[var(--rh-line)]">
        {exampleStats.map(([label, value]) => (
          <div key={label} className="grid gap-3 py-5 sm:grid-cols-[150px_1fr]">
            <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.18em]">{label}</div>
            <div className="text-[22px] leading-tight text-[var(--rh-ink-soft)]">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstallInstructionsPopup({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-[#120e0a]/58 px-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="w-full max-w-[520px] rounded-[30px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-7 shadow-[0_28px_90px_rgba(18,11,5,.25)]" initial={{ y: 14, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 8, scale: 0.98, opacity: 0 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.22em]">Manual install</div>
            <h2 className="rh-display mt-2 text-[38px] font-semibold leading-tight text-[var(--rh-ink)]">Install Rabbit Holes</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--rh-line)] text-[var(--rh-muted)]">×</button>
        </div>
        <ol className="mt-7 space-y-3 text-[16px] leading-7 text-[var(--rh-ink-soft)]">
          <li>1. Download and unzip the extension.</li>
          <li>2. Open <span className="font-semibold">chrome://extensions</span>.</li>
          <li>3. Turn on Developer mode.</li>
          <li>4. Load the unzipped folder.</li>
          <li>5. Open Settings and choose your AI provider.</li>
        </ol>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/downloads/rabbit-holes-extension.zip" download className="rounded-full bg-[var(--rh-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--rh-primary-text)] no-underline">Download zip</a>
          <Link href="/install" className="rounded-full border border-[var(--rh-line)] px-6 py-3 text-[15px] font-semibold no-underline">Full steps</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
