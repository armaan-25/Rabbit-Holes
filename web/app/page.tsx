"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Logo";
import { LandingDemo } from "@/components/LandingDemo";
import { authCallbackUrl } from "@/lib/auth-urls";

/** Compact theme toggle for the marketing header (mirrors the sidebar toggle). */
function HeaderThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("rabbit-hole-theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("rabbit-dark", isDark);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    window.localStorage.setItem("rabbit-hole-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("rabbit-dark", next);
  }
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid h-10 w-10 place-items-center rounded-full border border-[#785a3224] bg-[#fbf6ec] text-[15px] text-[#6a5a48] transition hover:text-[#2a2018]"
    >
      {dark ? "☾" : "☀"}
    </button>
  );
}

async function signInWithGoogle() {
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authCallbackUrl("/dashboard") },
    });
    if (error) throw error;
  } catch {
    // Supabase not configured locally — fall back to the full login screen.
    window.location.replace("/login");
  }
}

const FEATURES = [
  {
    tag: "Capture",
    title: "It watches the questions, not the tabs",
    body: "The extension quietly records your searches, visits, and the click-chains between them — then clusters the noise into the investigations you were actually chasing.",
  },
  {
    tag: "Map",
    title: "A map of your curiosity",
    body: "Every investigation becomes a node you can open into its own graph of pages and searches, wired by how you actually got there. Pan, zoom, follow the thread.",
  },
  {
    tag: "Ask",
    title: "Ask your own history",
    body: "“What did those papers conclude?” “Where did the sources disagree?” Answers grounded only in the pages you actually read — every claim cited back to the source.",
  },
  {
    tag: "Synthesize",
    title: "The brief you never wrote",
    body: "Turn a hole into the deliverable: a summary, a comparison of what you weighed, the contradictions across sources, open questions, and next steps. Copy it as Markdown.",
  },
  {
    tag: "Replay",
    title: "Replay any investigation",
    body: "A timeline of how it actually unfolded, in the order it happened — so you can pick a weeks-old rabbit hole back up exactly where you left off.",
  },
  {
    tag: "Private",
    title: "Yours, and only yours",
    body: "Captured to your own account. Sensitive domains are skipped, and the extension keeps monitoring quietly in the background like Honey.",
  },
];

const STEPS = [
  { n: "01", title: "Sign in", body: "Continue with Google — your rabbit holes save to your account." },
  { n: "02", title: "Just browse", body: "Load the extension and go down your usual rabbit holes. Nothing to tag or organize." },
  { n: "03", title: "Get your holes", body: "AI clusters the session into named investigations with a map, timeline, and brief." },
];

const BROWSERS = [
  { name: "Chrome", status: "Available now" },
  { name: "Edge", status: "Chromium install" },
  { name: "Brave", status: "Chromium install" },
  { name: "Arc", status: "Chromium install" },
  { name: "Opera", status: "Chromium install" },
  { name: "Firefox", status: "Coming next" },
  { name: "Safari", status: "Coming next" },
];

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Landing() {
  const [authPending, setAuthPending] = useState(false);

  async function startGoogleSignIn() {
    if (authPending) return;
    setAuthPending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    await signInWithGoogle();
  }

  return (
    <div className="rh-paper min-h-screen overflow-x-hidden">
      {authPending && <AuthTransition />}
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#785a321f] bg-[#f5efe4cc] backdrop-blur-md dark:bg-[#15110dcc]">
        <div className="mx-auto flex h-[76px] w-full max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-10">
            <Link href="/" className="no-underline">
              <Wordmark className="text-[28px]" />
            </Link>
            <nav className="hidden items-center gap-7 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#6a5a48] lg:flex">
              <a href="#how" className="transition hover:text-[#2a2018]">How it works</a>
              <a href="#features" className="transition hover:text-[#2a2018]">Features</a>
              <a href="#download" className="transition hover:text-[#2a2018]">Download</a>
              <a href="#demo" className="transition hover:text-[#2a2018]">Demo</a>
            </nav>
          </div>
          <div className="flex items-center gap-2.5">
            <HeaderThemeToggle />
            <a
              href="/downloads/rabbit-holes-extension.zip"
              download
              className="hidden rounded-full border border-[#785a3224] bg-[#fbf6ec] px-5 py-3 text-[14.5px] font-semibold text-[#2a2018] transition hover:-translate-y-0.5 sm:inline-flex"
            >
              Download extension
            </a>
            <button
              onClick={startGoogleSignIn}
              disabled={authPending}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#2a2018] px-5 py-3 text-[14.5px] font-semibold text-[#f3e8d4] shadow-[0_8px_22px_rgba(42,32,24,.18)] transition hover:-translate-y-0.5"
            >
              <GoogleMark /> {authPending ? "Opening..." : "Continue with Google"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero (editorial) ───────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1320px] px-5 pb-12 pt-14 sm:px-8">
        <div className="grid items-start gap-x-14 gap-y-14 lg:grid-cols-[1.5fr_1fr]">
          {/* left */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#785a3224] bg-[#fbf6ec] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6a5a48]">
              <span className="h-2 w-2 rounded-full bg-[#6a8050]" /> Browser extension · Smart history
            </div>
            <h1 className="rh-display text-[clamp(52px,8.2vw,120px)] font-semibold leading-[0.9] tracking-tight text-[#2a2018]">
              Follow ideas,
              <br />
              <span className="italic text-[#c2703f]">not tabs.</span>
            </h1>
            <p className="mt-7 max-w-[38ch] text-[clamp(18px,1.7vw,24px)] leading-[1.5] text-[#5a4a38]">
              Smart browser history that turns your research trails into maps, timelines, and clean summaries.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="/downloads/rabbit-holes-extension.zip"
                download
                className="inline-flex items-center gap-3 rounded-full bg-[#2a2018] px-8 py-4 text-[17px] font-semibold text-[#f3e8d4] shadow-[0_14px_40px_rgba(42,32,24,.24)] transition hover:-translate-y-0.5"
              >
                Download extension ↓
              </a>
              <button
                onClick={startGoogleSignIn}
                disabled={authPending}
                className="inline-flex items-center gap-3 rounded-full border border-[#785a3233] bg-[#fbf6ec] px-8 py-4 text-[17px] font-semibold text-[#2a2018] transition hover:-translate-y-0.5"
              >
                <GoogleMark /> {authPending ? "Opening..." : "Continue with Google"}
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-[#785a3233] bg-[#fbf6ec] px-8 py-4 text-[17px] font-semibold text-[#2a2018] transition hover:-translate-y-0.5"
              >
                Explore the demo →
              </Link>
              <a href="#demo" className="text-[16px] font-medium text-[#6a5a48] underline decoration-[#785a3240] underline-offset-4 transition hover:text-[#2a2018]">
                See it in action
              </a>
            </div>

            <div className="mt-9 h-px w-full max-w-[680px] bg-[#785a3224]" />
            <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#8a7860]">
              <span>◳ Chrome · Edge · Brave · Arc · Opera</span>
              <span>✓ Free · no credit card</span>
              <span>⛉ Always-on browser context</span>
            </div>
          </motion.div>

          {/* right — watercolor hero */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            className="relative min-h-[430px] lg:min-h-[560px]"
          >
            <motion.img
              src="/assets/images/rabbit-hole-hero.png"
              alt=""
              draggable={false}
              className="absolute right-[-22%] top-[18%] h-[360px] w-[560px] max-w-none object-contain drop-shadow-[0_16px_30px_rgba(48,31,14,.16)] sm:right-[-14%] sm:h-[430px] sm:w-[660px] lg:right-[-28%] lg:top-[20%]"
              animate={{ y: [0, -8, 0], scale: [1, 1.015, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Marquee ────────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-[#785a321f] py-5">
        <motion.div
          className="flex w-max items-center whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1].map((rep) => (
            <div key={rep} className="flex items-center">
              {["Searches become topics", "Pages become paths", "Maps, timelines, summaries", "Smart browser history", "Pick it back up later"].map((p, idx) => (
                <span key={p} className="flex items-center">
                  <span
                    className={`rh-display px-7 text-[clamp(26px,3.6vw,48px)] font-semibold ${idx % 2 === 1 ? "" : "text-[#2a2018]"}`}
                    style={idx % 2 === 1 ? { color: "transparent", WebkitTextStroke: "1px rgba(150,120,80,0.5)" } : undefined}
                  >
                    {p}
                  </span>
                  <span className="text-[20px] text-[#c2703f]">✶</span>
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Live demo (auto-plays through every step) ──────────── */}
      <section id="demo" className="mx-auto w-full max-w-[1120px] scroll-mt-28 px-5 pb-16 pt-16 sm:px-8">
        <motion.div {...reveal} className="mb-9 text-center">
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#a8967d]">See it work</div>
          <h2 className="rh-display mx-auto max-w-[15ch] text-[clamp(30px,3.8vw,48px)] font-semibold leading-[1.02] text-[#2a2018]">
            Watch a trail become a rabbit hole.
          </h2>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="relative">
          <LandingDemo />
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="mx-auto w-full max-w-[1200px] px-5 py-24 sm:px-8">
        <motion.div {...reveal} className="mb-16 max-w-[760px]">
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#a8967d]">What it does</div>
          <h2 className="rh-display text-[clamp(36px,5vw,68px)] font-semibold leading-[1.03] text-[#2a2018]">
            Your browsing, understood as investigations.
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...reveal}
              transition={{ ...reveal.transition, delay: (i % 3) * 0.08 }}
              className="rounded-[22px] border border-[#785a3224] bg-[#fbf6ec] p-8 shadow-[0_2px_18px_rgba(70,45,20,.06)]"
            >
              <div className="mb-4 inline-flex rounded-full bg-[#f2e9d6] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a8472a]">
                {f.tag}
              </div>
              <h3 className="rh-display text-[25px] font-semibold leading-tight text-[#2a2018]">{f.title}</h3>
              <p className="mt-3 text-[17px] leading-[1.6] text-[#6a5a48]">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Download / browser support ────────────────────────── */}
      <section id="download" className="mx-auto w-full max-w-[1200px] px-5 py-20 sm:px-8">
        <motion.div {...reveal} className="overflow-hidden rounded-[30px] border border-[#785a3224] bg-[#fbf6ec] p-7 shadow-[0_18px_50px_rgba(70,45,20,.10)] sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#a8967d]">Download</div>
              <h2 className="rh-display text-[clamp(34px,4.6vw,60px)] font-semibold leading-[1.04] text-[#2a2018]">
                Add Rabbit Holes to your browser.
              </h2>
              <p className="mt-4 text-[17px] leading-[1.6] text-[#6a5a48]">
                Install the extension, sign in, and browse normally. Chromium browsers can load the same extension package today.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="/downloads/rabbit-holes-extension.zip"
                  download
                  className="inline-flex rounded-full bg-[#2a2018] px-7 py-4 text-[16px] font-semibold text-[#f3e8d4] shadow-[0_12px_34px_rgba(42,32,24,.20)] transition hover:-translate-y-0.5"
                >
                  Download extension ↓
                </a>
                <Link href="/install" className="inline-flex rounded-full border border-[#785a3233] bg-[#f6efe1] px-7 py-4 text-[16px] font-semibold text-[#2a2018] transition hover:-translate-y-0.5">
                  Install steps
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {BROWSERS.map((browser) => {
                const live = browser.status !== "Coming next";
                return (
                  <div key={browser.name} className="flex items-center justify-between gap-4 rounded-[16px] border border-[#785a3221] bg-[#f6efe1] px-4 py-3">
                    <span className="rh-display text-[21px] font-semibold text-[#2a2018]">{browser.name}</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${live ? "bg-[#e9f1e4] text-[#4d7049]" : "bg-[#f2e9d6] text-[#8a7860]"}`}>
                      {browser.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="how" className="mx-auto w-full max-w-[1200px] px-5 py-20 sm:px-8">
        <motion.div {...reveal} className="mb-14 text-center">
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#a8967d]">How it works</div>
          <h2 className="rh-display text-[clamp(34px,4.6vw,60px)] font-semibold leading-[1.04] text-[#2a2018]">Three steps. Then nothing.</h2>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="rounded-[22px] border border-[#785a3224] bg-[#fbf6ec] p-8 text-center">
              <div className="rh-display text-[46px] font-semibold leading-none text-[#c2703f]">{s.n}</div>
              <h3 className="rh-display mt-4 text-[25px] font-semibold text-[#2a2018]">{s.title}</h3>
              <p className="mt-2 text-[16.5px] leading-[1.55] text-[#6a5a48]">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-5 pb-24 sm:px-8">
        <motion.div {...reveal} className="overflow-hidden rounded-[32px] bg-[#2a2018] px-8 py-20 text-center shadow-[0_24px_70px_rgba(42,32,24,.28)]">
          <h2 className="rh-display mx-auto max-w-[18ch] text-[clamp(38px,5vw,68px)] font-semibold leading-[1.03] text-[#f6ecd9]">
            Browse normally. Keep the trail.
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[clamp(17px,1.6vw,21px)] leading-[1.5] text-[#cdbd9f]">
            Download the extension and let Rabbit Holes organize what you were researching without extra work.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/downloads/rabbit-holes-extension.zip"
              download
              className="inline-flex items-center gap-2.5 rounded-full bg-[#f3e8d4] px-7 py-4 text-[16px] font-semibold text-[#1a1009] transition hover:-translate-y-0.5"
            >
              Download extension ↓
            </a>
            <button
              onClick={startGoogleSignIn}
              disabled={authPending}
              className="inline-flex items-center gap-2.5 rounded-full border border-[#f3e8d433] px-7 py-4 text-[16px] font-semibold text-[#f3e8d4] transition hover:-translate-y-0.5"
            >
              <GoogleMark /> {authPending ? "Opening..." : "Continue with Google"}
            </button>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-[#f3e8d433] px-7 py-4 text-[16px] font-semibold text-[#f3e8d4] transition hover:-translate-y-0.5">
              See the demo →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#785a321f]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-8 text-[14px] text-[#8a7860] sm:flex-row sm:px-8">
          <Wordmark className="text-[17px]" />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span>Smart history for the things you were actually researching.</span>
            <Link href="/install" className="text-[#6a5a48] underline decoration-[#785a3240] underline-offset-4">Install</Link>
            <Link href="/privacy" className="text-[#6a5a48] underline decoration-[#785a3240] underline-offset-4">Privacy</Link>
            <Link href="/terms" className="text-[#6a5a48] underline decoration-[#785a3240] underline-offset-4">Terms</Link>
            <a href="mailto:aa5851@columbia.edu" className="text-[#6a5a48] underline decoration-[#785a3240] underline-offset-4">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AuthTransition() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#15110d] px-6 text-center text-[#f3e8d4]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div>
        <Wordmark className="text-[34px] text-[#f3e8d4]" />
        <div className="mt-4 text-[15px] text-[#cdbd9f]">Opening secure sign in...</div>
      </div>
    </motion.div>
  );
}

function GoogleMark() {
  // Official multicolour Google "G" on a white chip so it reads on any button.
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
