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
  ["Question", "How does vLLM schedule requests?"],
  ["Visited", "24 pages"],
  ["Current position", "DistServe section 4"],
  ["Open questions", "Compare against Sarathi · Investigate prefix locality"],
  ["Next", "Continue investigation"],
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
            <Link href="/install" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] no-underline transition hover:text-[var(--rh-ink)] sm:inline-flex">Docs</Link>
            <a href="https://github.com/armaan-25/Rabbit-Holes" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] no-underline transition hover:text-[var(--rh-ink)] sm:inline-flex">GitHub</a>
            <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-5 py-2.5 text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1180px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.96fr_1.04fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="rh-display max-w-[9ch] text-[clamp(68px,9vw,122px)] font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--rh-ink)]">
              Follow ideas, not tabs.
            </h1>
            <p className="rh-muted mt-7 max-w-[31ch] text-[23px] leading-[1.4]">
              Rabbit Hole remembers what you were trying to understand.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-7 py-4 text-[17px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
                Install Extension
              </button>
              <a href="#example" className="rounded-full border border-[var(--rh-line-strong)] px-7 py-4 text-[17px] font-semibold text-[var(--rh-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--rh-ink)]">
                See Example Investigation
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <ExampleArtifact />
          </motion.div>
        </section>

        <section id="example" className="mx-auto w-full max-w-[1180px] scroll-mt-28 px-5 py-24 sm:px-8">
          <motion.div {...reveal} className="mb-10 max-w-[780px]">
            <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">Finished investigation</div>
            <h2 className="rh-display text-[clamp(42px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--rh-ink)]">
              Pick up exactly where you left off.
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}>
            <FinishedInvestigation />
          </motion.div>
        </section>

        <section className="mx-auto grid w-full max-w-[1180px] gap-8 px-5 py-24 sm:px-8 lg:grid-cols-[0.72fr_1fr] lg:items-center">
          <motion.div {...reveal}>
            <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">Replay</div>
            <h2 className="rh-display text-[clamp(42px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--rh-ink)]">
              Friday closes. Monday continues.
            </h2>
            <p className="rh-muted mt-5 max-w-[32ch] text-[20px] leading-[1.5]">
              Rewind the path, see the last useful stop, and keep reading without rebuilding the thread.
            </p>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}>
            <ReplayArtifact />
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-5 py-24 sm:px-8">
          <motion.div {...reveal} className="mb-10 max-w-[780px]">
            <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">Map</div>
            <h2 className="rh-display text-[clamp(42px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--rh-ink)]">
              See the route you actually took.
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}><LandingDemo /></motion.div>
        </section>

        <section id="install" className="mx-auto w-full max-w-[980px] px-5 py-24 text-center sm:px-8">
          <motion.div {...reveal} className="rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-10 sm:p-16">
            <div className="rh-faint mb-5 text-[12px] font-semibold uppercase tracking-[0.24em]">Install</div>
            <h2 className="rh-display text-[clamp(44px,6vw,82px)] font-semibold leading-[0.96] tracking-[-0.03em] text-[var(--rh-ink)]">
              Add it to your browser.
            </h2>
            <p className="rh-muted mx-auto mt-5 max-w-[30ch] text-[20px] leading-[1.5]">
              No account required. Your investigations and settings stay in browser storage by default.
            </p>
            <div className="mt-9 flex justify-center">
              <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-8 py-4 text-[17px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
                Install Extension
              </button>
            </div>
          </motion.div>
        </section>

        <section id="about" className="mx-auto w-full max-w-[1180px] px-5 py-20 sm:px-8">
          <motion.div {...reveal} className="mb-10 max-w-[720px]">
            <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">FAQ</div>
            <h2 className="rh-display text-[clamp(42px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--rh-ink)]">
              Everything you need to know about Rabbit Holes.
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className="divide-y divide-[var(--rh-line)] rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)]">
            {[
              [
                "Do I need an account?",
                "No. Install the extension and use it locally. Accounts are not part of the staging pivot.",
              ],
              [
                "Where does my work get saved?",
                "On your device by default. Rabbit Holes keeps the trail of pages, searches, summaries, and settings locally.",
              ],
              [
                "What does it remember?",
                "The question you were circling, the pages that mattered, the route between them, and the point where you stopped.",
              ],
              [
                "What does it build?",
                "A finished investigation: summary, route, replay, open questions, and a place to continue.",
              ],
              [
                "Which browsers work best?",
                "Chrome, Edge, Brave, Arc, and other Chromium browsers work best today. Safari support is not the first target because the extension APIs are different.",
              ],
              [
                "Can I use my own model?",
                "Yes. OpenAI, Anthropic, OpenRouter, Gemini, Ollama, LM Studio, and compatible endpoints are supported in settings.",
              ],
              [
                "Are there usage limits?",
                "No product-side model limits. Your limits come from your browser, your machine, and the provider you choose.",
              ],
            ].map(([question, answer]) => (
              <div key={question} className="grid gap-4 p-7 sm:p-9 lg:grid-cols-[0.42fr_0.58fr]">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.18em] text-[var(--rh-ink)]">{question}</h3>
                <p className="rh-muted text-[18px] leading-[1.58]">{answer}</p>
              </div>
            ))}
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

function FinishedInvestigation() {
  return (
    <div className="rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-8 sm:p-10">
      <div className="grid gap-10 lg:grid-cols-[0.78fr_1fr] lg:items-end">
        <div>
          <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">AI Systems</div>
          <h3 className="rh-display max-w-[10ch] text-[clamp(48px,7vw,92px)] font-semibold leading-[0.93] tracking-[-0.035em] text-[var(--rh-ink)]">
            How does vLLM schedule requests?
          </h3>
        </div>
        <div className="divide-y divide-[var(--rh-line)] rounded-[28px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)]">
          {[
            ["Started", "Friday afternoon"],
            ["Visited", "24 pages"],
            ["Current position", "DistServe section 4"],
            ["Last useful stop", "PagedAttention notes"],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-3 p-5 sm:grid-cols-[160px_1fr]">
              <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.18em]">{label}</div>
              <div className="text-[21px] leading-tight text-[var(--rh-ink)]">{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {["Compare against Sarathi", "Investigate prefix locality"].map((question) => (
          <div key={question} className="rounded-[22px] border border-[var(--rh-line)] bg-[var(--rh-surface)] px-5 py-4 text-[17px] font-semibold text-[var(--rh-ink-soft)]">
            {question}
          </div>
        ))}
      </div>
      <div className="mt-8">
        <a href="#install" className="inline-flex rounded-full bg-[var(--rh-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--rh-primary-text)] no-underline">
          Continue Investigation →
        </a>
      </div>
    </div>
  );
}

function ReplayArtifact() {
  const rows = [
    ["Friday 4:18 PM", "Searched vLLM scheduling"],
    ["Friday 4:31 PM", "Opened PagedAttention"],
    ["Friday 5:04 PM", "Read DistServe section 4"],
    ["Monday 9:12 AM", "Continue from DistServe"],
  ];

  return (
    <div className="rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-7 sm:p-9">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.22em]">Investigation replay</div>
          <h3 className="rh-display mt-2 text-[38px] font-semibold leading-none text-[var(--rh-ink)]">AI Systems</h3>
        </div>
        <button className="rounded-full border border-[var(--rh-line-strong)] px-5 py-2.5 text-[14px] font-semibold text-[var(--rh-ink)]">
          Play
        </button>
      </div>
      <div className="space-y-3">
        {rows.map(([time, event], index) => (
          <div key={event} className="grid gap-4 rounded-[22px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-5 sm:grid-cols-[150px_1fr]">
            <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.16em]">{time}</div>
            <div className={index === rows.length - 1 ? "text-[20px] font-semibold text-[var(--rh-ink)]" : "text-[20px] text-[var(--rh-ink-soft)]"}>{event}</div>
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
          <li>5. Open Settings and choose your model provider.</li>
        </ol>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/downloads/rabbit-holes-extension.zip" download className="rounded-full bg-[var(--rh-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--rh-primary-text)] no-underline">Download zip</a>
          <Link href="/install" className="rounded-full border border-[var(--rh-line)] px-6 py-3 text-[15px] font-semibold no-underline">Full steps</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
