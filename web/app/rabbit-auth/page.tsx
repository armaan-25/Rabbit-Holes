"use client";

import { useEffect, useState } from "react";

export default function RabbitAuthPage() {
  const [message, setMessage] = useState("Handing your session to the extension...");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setMessage("If this tab did not close, reload the Rabbit Holes extension and try signing in again.");
    }, 2500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 text-center">
      <div className="rh-surface max-w-[460px] rounded-[28px] border p-8 shadow-[0_18px_60px_rgba(70,45,20,.13)]">
        <h1 className="rh-display rh-ink text-[34px] font-semibold">Connecting extension</h1>
        <p className="rh-muted mt-4 text-[16px] leading-6">
          {message}
        </p>
      </div>
    </main>
  );
}
