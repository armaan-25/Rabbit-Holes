"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Logo";
import { getSupabaseClient, safeNextPath, writeSupabaseUserSession } from "@/lib/supabase-auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Finishing sign in...");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const next = safeNextPath(params.get("next"));
      const code = params.get("code");
      const authError = params.get("error_description") || params.get("error");

      try {
        if (authError) throw new Error(authError);
        if (!code) throw new Error("Missing sign-in code. Please try again.");

        const client = getSupabaseClient();
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!data.session?.user) throw new Error("No active session returned.");

        writeSupabaseUserSession(data.session.user);
        if (!cancelled) router.replace(next);
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Sign in failed.");
          window.setTimeout(() => router.replace("/login"), 1500);
        }
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 py-10 text-center">
      <div className="rh-surface w-full max-w-[420px] rounded-[28px] border p-8">
        <Wordmark className="text-[38px]" />
        <p className="rh-muted mt-4 text-[15px]">{status}</p>
      </div>
    </main>
  );
}
