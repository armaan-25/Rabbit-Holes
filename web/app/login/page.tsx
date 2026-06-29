import Link from "next/link";
import { Wordmark } from "@/components/Logo";

export default function LoginPage() {
  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-[720px] flex-col justify-center">
        <Link href="/" className="mb-12 no-underline"><Wordmark className="text-[26px]" /></Link>
        <section className="rh-surface rounded-[28px] border p-8 shadow-[0_18px_60px_rgba(20,12,6,.08)] sm:p-10">
          <div className="rh-faint text-[12px] font-bold uppercase tracking-[0.24em]">Optional account</div>
          <h1 className="rh-display mt-4 text-[54px] font-semibold leading-none tracking-[-0.03em]">Sign in</h1>
          <p className="rh-muted mt-5 text-[18px] leading-8">
            Rabbit Holes works locally without an account. Sign in is reserved for future sync, backup, and sharing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/settings" className="rh-primary rounded-full px-6 py-3.5 text-[15px] font-semibold no-underline">
              Configure locally
            </Link>
            <Link href="/dashboard" className="rh-surface-2 rounded-full border px-6 py-3.5 text-[15px] font-semibold no-underline">
              Open app
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
