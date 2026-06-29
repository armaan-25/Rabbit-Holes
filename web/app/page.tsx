"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Wordmark } from "@/components/Logo";
import { LandingDemo } from "@/components/LandingDemo";
import { authCallbackUrl } from "@/lib/auth-urls";

async function signInWithGoogle() {
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authCallbackUrl("/dashboard") },
    });
    if (error) throw error;
  } catch {
    window.location.replace("/login");
  }
}

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-90px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const exampleStats = [
  ["Started", "June 26"],
  ["Visited", "24 pages"],
  ["Current question", "How does vLLM schedule requests?"],
  ["Last stop", "DistServe section 4"],
  ["Next", "Sarathi"],
];

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("rabbit-hole-theme");
    document.documentElement.classList.toggle("rabbit-dark", saved !== "light");
  }, []);

  async function startGoogleSignIn() {
    if (authPending) return;
    setAuthPending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 140));
    await signInWithGoogle();
  }

  return (
    <div className="rh-paper min-h-screen overflow-x-hidden text-[var(--rh-ink)]">
      <AnimatePresence>
        {authOpen && <AuthModal pending={authPending} onClose={() => setAuthOpen(false)} onGoogle={startGoogleSignIn} />}
        {authPending && <AuthTransition />}
        {installOpen && <InstallInstructionsPopup onClose={() => setInstallOpen(false)} />}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-[var(--rh-line)] bg-[color-mix(in_srgb,var(--rh-bg)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="no-underline">
            <Wordmark className="text-[24px]" />
          </Link>
          <nav className="flex items-center gap-3 text-[14px] font-semibold">
            <a href="#about" className="hidden rounded-full px-4 py-2 text-[var(--rh-muted)] transition hover:text-[var(--rh-ink)] sm:inline-flex">About</a>
            <Link href="/login" className="rounded-full px-4 py-2 text-[var(--rh-muted)] no-underline transition hover:text-[var(--rh-ink)]">Sign in</Link>
            <button onClick={() => setAuthOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-5 py-2.5 text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1180px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.96fr_1.04fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="rh-display max-w-[9.5ch] text-[clamp(64px,9vw,118px)] font-semibold leading-[0.92] tracking-[-0.035em] text-[var(--rh-ink)]">
              Follow ideas, not tabs.
            </h1>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button onClick={() => setAuthOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-7 py-4 text-[17px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
                Get Started
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
            <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">One saved thread</div>
            <h2 className="rh-display text-[clamp(42px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--rh-ink)]">
              Rabbit Hole remembers what you were trying to understand.
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}>
            <LandingDemo />
          </motion.div>
        </section>

        <section id="about" className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 py-20 sm:px-8 lg:grid-cols-3">
          {[
            ["The trail", "Searches, pages, and jumps stay connected in the order they happened."],
            ["The map", "A visual route back into the question, not a pile of browser history."],
            ["The brief", "A clean summary is ready when you return, with the next thread waiting."],
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
            <div className="grid gap-10 lg:grid-cols-[1fr_0.75fr] lg:items-end">
              <div>
                <div className="rh-faint mb-4 text-[12px] font-semibold uppercase tracking-[0.24em]">Install</div>
                <h2 className="rh-display max-w-[11ch] text-[clamp(44px,6vw,78px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--rh-ink)]">
                  Add it. Browse normally.
                </h2>
              </div>
              <div className="lg:justify-self-end">
                <p className="rh-muted max-w-[34ch] text-[19px] leading-[1.55]">
                  Chrome, Arc, Brave, Edge, and Opera can load the extension manually while the store listing is in review.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => setInstallOpen(true)} className="rounded-full bg-[var(--rh-primary)] px-7 py-4 text-[16px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5">
                    Download Extension
                  </button>
                  <button onClick={() => setAuthOpen(true)} className="rounded-full border border-[var(--rh-line-strong)] px-7 py-4 text-[16px] font-semibold text-[var(--rh-ink)] transition hover:-translate-y-0.5 hover:border-[var(--rh-ink)]">
                    Sign In
                  </button>
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
            <Link href="/privacy" className="no-underline hover:text-[var(--rh-ink)]">Privacy</Link>
            <Link href="/terms" className="no-underline hover:text-[var(--rh-ink)]">Terms</Link>
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

function AuthModal({ pending, onClose, onGoogle }: { pending: boolean; onClose: () => void; onGoogle: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-[#120e0a]/58 px-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="w-full max-w-[430px] rounded-[30px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-7 shadow-[0_28px_90px_rgba(18,11,5,.25)]" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.22em]">Continue</div>
            <h2 className="rh-display mt-2 text-[38px] font-semibold leading-tight text-[var(--rh-ink)]">Start with your trail.</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--rh-line)] text-[var(--rh-muted)]">×</button>
        </div>
        <button onClick={onGoogle} disabled={pending} className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[var(--rh-primary)] px-6 py-4 text-[16px] font-semibold text-[var(--rh-primary-text)] transition hover:-translate-y-0.5 disabled:opacity-60">
          <GoogleMark /> {pending ? "Opening..." : "Continue with Google"}
        </button>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/login" className="rounded-full border border-[var(--rh-line)] px-5 py-3 text-center text-[14px] font-semibold no-underline">Sign in</Link>
          <Link href="/signup" className="rounded-full border border-[var(--rh-line)] px-5 py-3 text-center text-[14px] font-semibold no-underline">Create account</Link>
        </div>
      </motion.div>
    </motion.div>
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
        </ol>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/downloads/rabbit-holes-extension.zip" download className="rounded-full bg-[var(--rh-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--rh-primary-text)] no-underline">Download zip</a>
          <Link href="/install" className="rounded-full border border-[var(--rh-line)] px-6 py-3 text-[15px] font-semibold no-underline">Full steps</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AuthTransition() {
  return (
    <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-[#15110d] px-6 text-center text-[#f3e8d4]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
      <div>
        <Wordmark className="text-[34px] text-[#f3e8d4]" />
        <div className="mt-4 text-[15px] text-[#cdbd9f]">Opening secure sign in...</div>
      </div>
    </motion.div>
  );
}

function GoogleMark() {
  return (
    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-white">
      <svg viewBox="0 0 48 48" className="h-[15px] w-[15px]" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    </span>
  );
}
