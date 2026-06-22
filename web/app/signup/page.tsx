"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Logo";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthShell><p className="text-center text-[14px] text-[#8a7860]">Loading...</p></AuthShell>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("Creating account...");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    if (!data.session) {
      setStatus("Check your email to confirm your account.");
      return;
    }
    window.location.replace(`/onboarding?next=${encodeURIComponent(next)}`);
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full rounded-[14px] border border-[#785a3224] bg-[#fffaf1] px-4 py-3 text-[15px] text-[#2a2018] outline-none placeholder:text-[#a8967d]" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password" className="w-full rounded-[14px] border border-[#785a3224] bg-[#fffaf1] px-4 py-3 text-[15px] text-[#2a2018] outline-none placeholder:text-[#a8967d]" />
        <button disabled={busy} type="submit" className="w-full rounded-[15px] bg-[#2a2018] px-5 py-3.5 text-[15px] font-semibold text-[#f3e8d4] shadow-[0_10px_28px_rgba(42,32,24,.18)] disabled:opacity-60">
          Create account
        </button>
      </form>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-4 block text-center text-[14px] text-[#6a5a48] underline-offset-4 hover:underline">
        Already have an account? Sign in
      </Link>
      {status && <p className="mt-4 rounded-[13px] bg-[#f2e9d6] px-4 py-3 text-[14px] text-[#6a5a48]">{status}</p>}
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[440px] rounded-[28px] border border-[#785a3224] bg-[#fbf6ec] p-8 shadow-[0_18px_60px_rgba(70,45,20,.13)]">
        <div className="mb-7 text-center">
          <Wordmark className="text-[40px]" />
          <p className="mt-3 text-[16px] italic text-[#8a7860]">Create your account.</p>
        </div>
        {children}
      </div>
    </main>
  );
}
