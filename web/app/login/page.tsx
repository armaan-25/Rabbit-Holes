"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Logo";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell><p className="text-center text-[14px] text-[#8a7860]">Loading sign in...</p></LoginShell>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus(mode === "signin" ? "Signing in..." : "Creating account...");
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });

    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setStatus("Check your email to confirm your account.");
      return;
    }

    window.location.href = next;
  }

  async function google() {
    setStatus("Opening Google...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setStatus(error.message);
  }

  return (
    <LoginShell>
      <button onClick={google} className="w-full rounded-[15px] bg-[#2a2018] px-5 py-3.5 text-[15px] font-semibold text-[#f3e8d4] shadow-[0_10px_28px_rgba(42,32,24,.18)]">
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] text-[#a8967d]"><span className="h-px flex-1 bg-[#785a3224]" />or<span className="h-px flex-1 bg-[#785a3224]" /></div>

      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full rounded-[14px] border border-[#785a3224] bg-[#fffaf1] px-4 py-3 text-[15px] text-[#2a2018] outline-none placeholder:text-[#a8967d]" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password" className="w-full rounded-[14px] border border-[#785a3224] bg-[#fffaf1] px-4 py-3 text-[15px] text-[#2a2018] outline-none placeholder:text-[#a8967d]" />
        <button type="submit" className="w-full rounded-[15px] border border-[#785a3224] bg-[#f2e9d6] px-5 py-3.5 text-[15px] font-semibold text-[#2a2018]">
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-center text-[14px] text-[#6a5a48] underline-offset-4 hover:underline">
        {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
      {status && <p className="mt-4 rounded-[13px] bg-[#f2e9d6] px-4 py-3 text-[14px] text-[#6a5a48]">{status}</p>}
    </LoginShell>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[440px] rounded-[28px] border border-[#785a3224] bg-[#fbf6ec] p-8 shadow-[0_18px_60px_rgba(70,45,20,.13)]">
        <div className="mb-7 text-center">
          <Wordmark className="text-[40px]" />
          <p className="mt-3 text-[16px] italic text-[#8a7860]">Smart history for your research.</p>
        </div>
        {children}
      </div>
    </main>
  );
}
