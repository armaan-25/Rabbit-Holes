"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Wordmark } from "@/components/Logo";

const exampleStats = [
  ["Question", "How does vLLM schedule requests?"],
  ["Visited", "24 pages"],
  ["Last stop", "DistServe section 4"],
  ["Next", "Compare against Sarathi"],
];

export default function Landing() {
  const [installOpen, setInstallOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("rabbit-hole-theme");
    document.documentElement.classList.toggle("rabbit-dark", saved !== "light");
  }, []);

  return (
    <div className="rh-paper min-h-screen text-[var(--rh-ink)]">
      <AnimatePresence>{installOpen && <InstallInstructionsPopup onClose={() => setInstallOpen(false)} />}</AnimatePresence>

      <header className="mx-auto flex h-[76px] w-full max-w-[1160px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="no-underline"><Wordmark className="text-[23px]" /></Link>
        <nav className="flex items-center gap-2 text-[14px] font-semibold">
          <Link href="/docs" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] no-underline transition hover:text-[var(--rh-ink)] sm:inline-flex">Docs</Link>
          <a href="https://github.com/armaan-25/Rabbit-Holes" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] no-underline transition hover:text-[var(--rh-ink)] sm:inline-flex">GitHub</a>
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] no-underline transition hover:text-[var(--rh-ink)] sm:inline-flex">Sign In</Link>
          <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-5 py-2.5 text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
            Install
          </button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-76px)] w-full max-w-[1160px] items-center gap-16 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="rh-display max-w-[8.6ch] text-[clamp(74px,10vw,132px)] font-semibold leading-[0.88] tracking-[-0.045em] text-[var(--rh-ink)]">
              Follow ideas, not tabs.
            </h1>
            <p className="rh-muted mt-7 max-w-[30ch] text-[22px] leading-[1.45]">
              Rabbit Holes remembers what you were trying to understand.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-7 py-4 text-[17px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
                Install Extension
              </button>
              <Link href="/docs" className="rounded-full border border-[var(--rh-line-strong)] px-7 py-4 text-[17px] font-semibold text-[var(--rh-ink)] no-underline transition hover:-translate-y-0.5">
                Read Docs
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <ExampleArtifact />
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1160px] px-5 py-20 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            <ValueCard title="Local first" body="Your trail, settings, and investigations live in browser storage by default." />
            <ValueCard title="Bring your own AI" body="Use OpenAI, Anthropic, OpenRouter, Gemini, Ollama, LM Studio, or a compatible endpoint." />
            <ValueCard title="Install and browse" body="The extension quietly keeps context while you research normally." />
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-[1160px] flex-col justify-between gap-4 px-5 py-10 text-[14px] text-[var(--rh-muted)] sm:flex-row sm:px-8">
        <Wordmark className="text-[18px]" />
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/docs" className="no-underline hover:text-[var(--rh-ink)]">Docs</Link>
          <Link href="/privacy" className="no-underline hover:text-[var(--rh-ink)]">Privacy</Link>
          <Link href="/terms" className="no-underline hover:text-[var(--rh-ink)]">Terms</Link>
          <a href="mailto:aa5851@columbia.edu" className="no-underline hover:text-[var(--rh-ink)]">Support</a>
        </div>
      </footer>
    </div>
  );
}

function ExampleArtifact() {
  return (
    <div className="rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-7 shadow-[0_18px_50px_rgba(26,16,9,.08)] sm:p-9">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.22em]">Investigation</div>
          <h2 className="rh-display mt-3 text-[48px] font-semibold leading-none tracking-[-0.03em] text-[var(--rh-ink)]">AI Systems</h2>
        </div>
        <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--rh-green)]" />
      </div>
      <div className="divide-y divide-[var(--rh-line)]">
        {exampleStats.map(([label, value]) => (
          <div key={label} className="grid gap-3 py-5 sm:grid-cols-[142px_1fr]">
            <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.18em]">{label}</div>
            <div className="text-[22px] leading-tight text-[var(--rh-ink-soft)]">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-[24px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-5">
        <div className="rh-faint text-[11px] font-semibold uppercase tracking-[0.2em]">Open question</div>
        <p className="mt-3 text-[20px] leading-snug text-[var(--rh-ink)]">What changes when requests have long shared prefixes?</p>
      </div>
    </div>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[26px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-7">
      <h2 className="rh-display text-[30px] font-semibold tracking-[-0.02em] text-[var(--rh-ink)]">{title}</h2>
      <p className="rh-muted mt-3 text-[17px] leading-7">{body}</p>
    </section>
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
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--rh-line)] text-[var(--rh-muted)]">x</button>
        </div>
        <ol className="mt-7 space-y-3 text-[16px] leading-7 text-[var(--rh-ink-soft)]">
          <li>1. Download and unzip the extension.</li>
          <li>2. Open <span className="font-semibold">chrome://extensions</span>.</li>
          <li>3. Turn on Developer mode.</li>
          <li>4. Load the unzipped folder.</li>
          <li>5. Open Settings and choose your model provider.</li>
        </ol>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/downloads/rabbit-holes-extension.zip" download className="rounded-full bg-[var(--rh-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--rh-primary-text)] no-underline">Download zip</a>
          <Link href="/docs" className="rounded-full border border-[var(--rh-line)] px-6 py-3 text-[15px] font-semibold no-underline">Full steps</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
