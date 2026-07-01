"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/Logo";
import { getSupabaseClient, isSupabaseConfigured, safeNextPath, writeSupabaseUserSession } from "@/lib/supabase-auth";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthShell><p className="rh-muted text-center text-[14px]">Loading...</p></AuthShell>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function google() {
    if (busy) return;
    if (!isSupabaseConfigured()) {
      setStatus("Google sign in is not configured yet.");
      return;
    }

    setBusy(true);
    setStatus("Signing in with Google...");
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await getSupabaseClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setBusy(false);
      setStatus(error.message);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setStatus("Sign up is not configured yet.");
      return;
    }

    setBusy(true);
    setStatus("Creating account...");
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setBusy(false);
      setStatus(error.message);
      return;
    }

    if (data.user && data.session) {
      writeSupabaseUserSession(data.user);
      router.replace(next);
      return;
    }

    setBusy(false);
    setStatus("Check your email to finish creating your account.");
  }

  return (
    <AuthShell>
      <button onClick={google} disabled={busy} className="rh-primary mb-5 flex w-full items-center justify-center gap-3 rounded-[15px] px-5 py-3.5 text-[15px] font-semibold shadow-[0_10px_28px_rgba(42,32,24,.18)] disabled:opacity-60">
        <GoogleMark />
        Continue with Google
      </button>
      <div className="rh-faint my-5 flex items-center gap-3 text-[12px] uppercase tracking-[0.16em]"><span className="h-px flex-1 bg-[var(--rh-line)]" />or<span className="h-px flex-1 bg-[var(--rh-line)]" /></div>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-4 py-3 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password" className="w-full rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-4 py-3 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]" />
        <button disabled={busy} type="submit" className="rh-primary w-full rounded-[15px] px-5 py-3.5 text-[15px] font-semibold shadow-[0_10px_28px_rgba(42,32,24,.18)] disabled:opacity-60">
          Create account
        </button>
      </form>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="rh-muted mt-4 block text-center text-[14px] underline-offset-4 hover:underline">
        Already have an account? Sign in
      </Link>
      {status && <p className="rh-surface-2 mt-4 rounded-[13px] px-4 py-3 text-[14px]">{status}</p>}
    </AuthShell>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84C3.96 20.53 7.67 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.15C1.41 8.53 1 10.22 1 12s.41 3.47 1.15 4.94l3.69-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.67 1 3.96 3.47 2.15 7.06l3.69 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 py-10">
      <div className="rh-surface w-full max-w-[440px] rounded-[28px] border p-8 shadow-[0_18px_60px_rgba(70,45,20,.13)]">
        <div className="mb-7 text-center">
          <Wordmark className="text-[40px]" />
          <p className="rh-muted mt-3 text-[16px] italic">Create your account.</p>
        </div>
        {children}
      </div>
    </main>
  );
}
