import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="rh-paper grid min-h-screen place-items-center px-6 py-16">
      <section className="w-full max-w-[560px] rounded-[32px] border border-[var(--rh-line)] bg-[var(--rh-surface)] p-8 text-center">
        <div className="rh-faint text-[12px] font-semibold uppercase tracking-[0.22em]">Local-first mode</div>
        <h1 className="rh-display mt-3 text-[46px] font-semibold leading-none text-[var(--rh-ink)]">No account required.</h1>
        <p className="rh-muted mx-auto mt-4 max-w-[38ch] text-[18px] leading-7">
          Install the extension, choose your model provider, and Rabbit Holes stores investigations in browser storage by default.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/install" className="rounded-full bg-[var(--rh-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--rh-primary-text)] no-underline">Install Extension</Link>
          <Link href="/settings" className="rounded-full border border-[var(--rh-line-strong)] px-6 py-3 text-[15px] font-semibold text-[var(--rh-ink)] no-underline">Provider Settings</Link>
        </div>
      </section>
    </main>
  );
}
