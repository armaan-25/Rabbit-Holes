"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExtensionAuthCompatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/auth/callback${window.location.search || ""}${window.location.hash || ""}`);
  }, [router]);

  return <main className="rh-paper min-h-screen" />;
}
