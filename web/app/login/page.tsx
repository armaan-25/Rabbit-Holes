"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Logo";
import { authCallbackUrl, isExtensionAuthNext } from "@/lib/auth-urls";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell><p className="rh-muted text-center text-[14px]">Loading sign in...</p></LoginShell>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTransitioning(true);
    setStatus("Signing in...");
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setTransitioning(false);
      setStatus(result.error.message);
      return;
    }

    // First-time accounts go through onboarding before their destination.
    const isExtensionFlow = isExtensionAuthNext(next);
    const onboarded = result.data.user?.user_metadata?.onboarded;
    window.location.replace(onboarded || isExtensionFlow ? next : `/onboarding?next=${encodeURIComponent(next)}`);
  }

  async function google() {
    if (transitioning) return;
    setTransitioning(true);
    setStatus("Opening Google...");
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authCallbackUrl(next) },
    });
    if (error) {
      setTransitioning(false);
      setStatus(error.message);
    }
  }

  return (
    <LoginShell>
      {transitioning && <AuthTransition />}
      <button onClick={google} disabled={transitioning} className="rh-primary w-full rounded-[15px] px-5 py-3.5 text-[15px] font-semibold shadow-[0_10px_28px_rgba(42,32,24,.18)] disabled:opacity-70">
        {transitioning ? "Opening..." : "Continue with Google"}
      </button>

      <div className="rh-faint my-5 flex items-center gap-3 text-[12px] uppercase tracking-[0.16em]"><span className="h-px flex-1 bg-[var(--rh-line)]" />or<span className="h-px flex-1 bg-[var(--rh-line)]" /></div>

      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-4 py-3 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password" className="w-full rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-4 py-3 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]" />
        <button type="submit" disabled={transitioning} className="rh-surface-2 w-full rounded-[15px] border px-5 py-3.5 text-[15px] font-semibold disabled:opacity-70">
          {transitioning ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <Link href={`/signup?next=${encodeURIComponent(next)}`} className="rh-muted mt-4 block text-center text-[14px] underline-offset-4 hover:underline">
        Need an account? Create one
      </Link>
      {status && <p className="rh-surface-2 mt-4 rounded-[13px] px-4 py-3 text-[14px]">{status}</p>}
    </LoginShell>
  );
}

function AuthTransition() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#15110d] px-6 text-center text-[#f3e8d4]">
      <div>
        <Wordmark className="text-[34px] text-[#f3e8d4]" />
        <div className="mt-4 text-[15px] text-[#cdbd9f]">Opening secure sign in...</div>
      </div>
    </div>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 py-10">
      <div className="rh-surface w-full max-w-[440px] rounded-[28px] border p-8 shadow-[0_18px_60px_rgba(70,45,20,.13)]">
        <div className="mb-7 text-center">
          <Wordmark className="text-[40px]" />
          <p className="rh-muted mt-3 text-[16px] italic">Smart history for your research.</p>
        </div>
        {children}
      </div>
    </main>
  );
}
