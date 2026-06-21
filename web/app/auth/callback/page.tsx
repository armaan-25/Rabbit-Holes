"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Finishing sign in..." />}>
      <AuthCallbackBody />
    </Suspense>
  );
}

function AuthCallbackBody() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing sign in...");

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";
    const code = searchParams.get("code");
    const done = async (error?: { message: string } | null) => {
      if (error) {
        setMessage(error.message);
        return;
      }
      // Send first-time users through onboarding before their destination.
      const { data } = await supabase.auth.getUser();
      if (data.user && !data.user.user_metadata?.onboarded) {
        window.location.replace(`/onboarding?next=${encodeURIComponent(next)}`);
        return;
      }
      window.location.replace(next);
    };

    if (code) {
      void supabase.auth.exchangeCodeForSession(code).then(({ error }) => void done(error));
      return;
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        void done(error ?? { message: "No auth session found." });
        return;
      }
      void done(null);
    });
  }, [searchParams]);

  return <CallbackShell message={message} />;
}

function CallbackShell({ message }: { message: string }) {
  return <main className="rh-paper grid min-h-screen place-items-center text-[#2a2018]"><div className="rh-display text-[32px] font-semibold">{message}</div></main>;
}
