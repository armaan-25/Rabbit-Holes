"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Wordmark } from "@/components/Logo";
import { readRabbitSession, writeRabbitSession } from "@/lib/local-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nextPath, setNextPath] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next?.startsWith("/")) setNextPath(next);
    const existing = readRabbitSession();
    if (existing?.email) setEmail(existing.email);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;
    writeRabbitSession(value);
    router.replace(nextPath);
  }

  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-[640px] flex-col justify-center">
        <Link href="/" className="mb-12 no-underline"><Wordmark className="text-[26px]" /></Link>
        <section className="rh-surface rounded-[28px] border p-8 shadow-[0_18px_60px_rgba(20,12,6,.08)] sm:p-10">
          <div className="rh-faint text-[12px] font-bold uppercase tracking-[0.24em]">Unlock Rabbit Holes</div>
          <h1 className="rh-display mt-4 text-[54px] font-semibold leading-none tracking-[-0.03em]">Sign in</h1>
          <p className="rh-muted mt-5 text-[18px] leading-8">
            Keep your local investigations tied to one workspace on this browser. Your data still stays on this device unless you export or enable sync later.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="rh-faint text-[11px] font-bold uppercase tracking-[0.2em]">Email</span>
              <input
                value={email}
                type="email"
                required
                autoFocus
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-[14px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-4 py-4 text-[17px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)]"
              />
            </label>
            <button type="submit" className="rh-primary w-full rounded-full px-6 py-4 text-[16px] font-semibold">
              Continue
            </button>
          </form>
          <p className="rh-muted mt-5 text-[13px] leading-6">
            This is a lightweight local sign-in for staging. Provider keys and captured history remain controlled from Settings.
          </p>
        </section>
      </div>
    </main>
  );
}
