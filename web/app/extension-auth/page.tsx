"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Logo";

export default function ExtensionAuthPage() {
  const [status, setStatus] = useState("Checking sign in...");

  useEffect(() => {
    void (async () => {
      const next = `/extension-auth${window.location.search}`;
      const { data } = await supabase.auth.getSession();
      let session = data.session;
      if (!session) {
        setStatus("Opening sign in...");
        window.location.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error && !session.refresh_token) {
        await supabase.auth.signOut();
        setStatus("Session expired. Opening sign in...");
        window.location.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (refreshed.data.session) session = refreshed.data.session;

      setStatus("Connecting extension...");
      const hash = new URLSearchParams({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: String(session.expires_at ?? ""),
        userId: session.user.id,
        email: session.user.email ?? "",
      });
      window.location.replace(`/rabbit-auth#${hash.toString()}`);
    })();
  }, []);

  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 text-center">
      <div className="rh-surface max-w-[480px] rounded-[28px] border p-8 shadow-[0_18px_60px_rgba(70,45,20,.13)]">
        <h1 className="rh-display rh-ink text-[34px] font-semibold"><Wordmark className="text-[34px]" /> extension</h1>
        <p className="rh-muted mt-4 text-[16px] leading-6">{status}</p>
      </div>
    </main>
  );
}
