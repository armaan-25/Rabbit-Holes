"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { readRabbitSession } from "@/lib/local-auth";
import { syncSupabaseSessionToLocal } from "@/lib/supabase-auth";

const PUBLIC_PATHS = ["/", "/docs", "/install", "/privacy", "/terms", "/login", "/signup", "/auth/callback", "/extension-auth", "/rabbit-auth"];

function isPublic(pathname: string) {
  if (pathname.startsWith("/share/")) return true;
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = useMemo(() => isPublic(pathname), [pathname]);
  const [ready, setReady] = useState(publicRoute);

  useEffect(() => {
    if (publicRoute) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function checkAuth() {
      const cached = readRabbitSession();
      if (cached) {
        setReady(true);
        void syncSupabaseSessionToLocal();
        return;
      }

      const session = await syncSupabaseSessionToLocal();
      if (cancelled) return;

      if (session) {
        setReady(true);
        return;
      }

      setReady(false);
      const next = encodeURIComponent(`${pathname}${window.location.search || ""}`);
      router.replace(`/login?next=${next}`);
    }

    void checkAuth();
    return () => {
      cancelled = true;
    };
  }, [pathname, publicRoute, router]);

  if (!ready && !publicRoute) {
    return <div className="rh-paper min-h-screen" />;
  }

  return <>{children}</>;
}
