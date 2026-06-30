"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Wordmark } from "@/components/Logo";
import { LandingDemo } from "@/components/LandingDemo";

export default function Landing() {
  const [installOpen, setInstallOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("rabbit-hole-theme");
    document.documentElement.classList.toggle("rabbit-dark", saved !== "light");
  }, []);

  return (
    <div className="rh-paper min-h-screen text-[var(--rh-ink)]">
      <AnimatePresence>{installOpen && <InstallInstructionsPopup onClose={() => setInstallOpen(false)} />}</AnimatePresence>

      <header className="mx-auto flex h-[76px] w-full max-w-[1160px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0 no-underline"><Wordmark className="text-[23px]" /></Link>
          <nav className="hidden items-center gap-5 text-[14px] font-semibold md:flex">
            <Link href="/dashboard" className="text-[var(--rh-ink-soft)] no-underline transition hover:text-[var(--rh-ink)]">Dashboard</Link>
            <Link href="/docs" className="text-[var(--rh-ink-soft)] no-underline transition hover:text-[var(--rh-ink)]">Docs</Link>
            <button onClick={() => setInstallOpen(true)} className="text-[var(--rh-ink-soft)] transition hover:text-[var(--rh-ink)]">Download</button>
            <a href="https://github.com/armaan-25/Rabbit-Holes" className="text-[var(--rh-ink-soft)] no-underline transition hover:text-[var(--rh-ink)]">GitHub</a>
          </nav>
        </div>
        <Link href="/login" className="shrink-0 rounded-full bg-[var(--rh-primary)] px-5 py-2.5 text-[14px] font-semibold text-[var(--rh-primary-text)] no-underline transition hover:-translate-y-0.5">
          Sign in
        </Link>
      </header>

      <main>
        <section className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-[1160px] flex-col items-center justify-center px-5 pb-16 pt-8 text-center sm:px-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.26em]">Follow ideas, not tabs.</div>
            <h1 className="rh-display mx-auto max-w-[11ch] text-[clamp(58px,8vw,108px)] font-semibold leading-[0.92] tracking-[-0.045em] text-[var(--rh-ink)]">
              Never lose your train of thought.
            </h1>
            <p className="rh-muted mx-auto mt-6 max-w-[33ch] text-[21px] leading-[1.45]">
              Rabbit Holes remembers what you were trying to understand.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-7 py-4 text-[17px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
                Install Extension
              </button>
            </div>
          </motion.div>
        </section>

        <section id="demo" className="mx-auto w-full max-w-[1120px] scroll-mt-28 px-5 pb-16 pt-16 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-9 text-center">
            <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#a8967d]">See it work</div>
            <h2 className="rh-display mx-auto max-w-[15ch] text-[clamp(30px,3.8vw,48px)] font-semibold leading-[1.02] text-[var(--rh-ink)]">
              Watch a trail become a rabbit hole.
            </h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="relative">
            <LandingDemo />
          </motion.div>
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

function MockDemoFlow({ onInstall }: { onInstall: () => void }) {
  const tabs = ["Google", "Apple", "Google", "Meta"];
  const events = [
    ["search", "apple software engineering internship"],
    ["page", "Apple University Recruiting"],
    ["search", "google swe intern summer"],
    ["page", "Meta university careers"],
  ];

  return (
    <section className="rounded-[34px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-5 sm:p-7">
      <style>{`
        @keyframes rh-demo-row {
          0%, 14% { transform: translateY(10px); opacity: 0; }
          28%, 100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes rh-demo-arrow {
          0%, 28% { transform: scaleX(.05); opacity: 0; }
          45%, 100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes rh-demo-card {
          0%, 42% { transform: translateY(12px) scale(.985); opacity: 0; }
          58%, 100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes rh-demo-dot {
          0%, 100% { opacity: .45; transform: scale(.85); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.22em]">Friday to Monday</div>
          <div className="mt-1 text-[18px] font-semibold text-[var(--rh-ink-soft)]">Tabs, searches, and pages become one thread.</div>
        </div>
        <div className="hidden rounded-full border border-[var(--rh-line)] px-4 py-2 text-[13px] font-semibold text-[var(--rh-muted)] sm:block">
          Capturing in Chrome
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_56px_0.88fr] lg:items-center">
        <div className="overflow-hidden rounded-[26px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)]">
          <div className="flex items-center gap-2 border-b border-[var(--rh-line)] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#df8c58]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d6bf82]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#7d9d69]" />
            <div className="ml-4 flex min-w-0 flex-1 gap-2">
              {tabs.map((tab) => (
                <div key={tab} className="min-w-0 rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--rh-muted)]">
                  <span className="block max-w-[120px] truncate">{tab}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 p-5">
            {events.map(([kind, label]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--rh-line)] bg-[var(--rh-surface)] px-4 py-3 opacity-0 [animation:rh-demo-row_4.8s_cubic-bezier(.22,1,.36,1)_infinite]" style={{ animationDelay: `${events.findIndex((event) => event[1] === label) * 0.34}s` }}>
                <div>
                  <div className="rh-faint text-[10px] font-bold uppercase tracking-[0.18em]">{kind}</div>
                  <div className="mt-1 text-[17px] font-semibold text-[var(--rh-ink)]">{label}</div>
                </div>
                <div className="h-2 w-2 rounded-full bg-[var(--rh-green)] [animation:rh-demo-dot_1.6s_ease-in-out_infinite]" />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden justify-center lg:flex">
          <div className="flex h-[2px] w-full origin-left items-center bg-[var(--rh-line-strong)] opacity-70 [animation:rh-demo-arrow_4.8s_cubic-bezier(.22,1,.36,1)_infinite]">
            <span className="ml-auto h-3 w-3 rotate-45 border-r-2 border-t-2 border-[var(--rh-line-strong)]" />
          </div>
        </div>

        <div className="rounded-[26px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] p-5 text-left opacity-0 [animation:rh-demo-card_4.8s_cubic-bezier(.22,1,.36,1)_infinite] sm:p-6">
          <div className="rh-faint text-[11px] font-semibold uppercase tracking-[0.22em]">Clustered from this session</div>
          <h3 className="rh-display mt-3 text-[38px] font-semibold leading-none tracking-[-0.03em] text-[var(--rh-ink)]">Big Tech SWE</h3>
          <div className="mt-6 divide-y divide-[var(--rh-line)] rounded-[18px] border border-[var(--rh-line)] bg-[var(--rh-surface)]">
            {[
              ["Captured", "Career searches, job pages, and open tabs from your browser."],
              ["Built", "One rabbit hole with a map, timeline, and discovery chain."],
              ["Saved", "A brief and replay so you can return without rebuilding context."],
            ].map(([label, value]) => (
              <div key={label} className="p-3.5">
                <div className="rh-faint text-[10px] font-bold uppercase tracking-[0.18em]">{label}</div>
                <div className="mt-1 text-[17px] font-semibold leading-snug text-[var(--rh-ink-soft)]">{value}</div>
              </div>
            ))}
          </div>
          <button onClick={onInstall} className="mt-5 rounded-full bg-[var(--rh-primary)] px-5 py-3 text-[15px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
            Open rabbit hole →
          </button>
        </div>
      </div>
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
