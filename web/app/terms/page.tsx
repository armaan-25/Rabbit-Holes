import Link from "next/link";
import { Wordmark } from "@/components/Logo";

const TERMS = [
  "Rabbit Holes is provided as an early local-first browser companion. Do not rely on it as the only copy of important research or compliance records.",
  "You are responsible for the browsing data you choose to capture, including whether private/incognito capture is enabled.",
  "You may not use Rabbit Holes to capture another person's browsing activity without permission.",
  "You are responsible for any AI provider keys, models, local endpoints, costs, and policies you configure.",
  "AI-generated summaries and clusters can be incomplete or wrong and should be reviewed before use.",
  "For support, contact aa5851@columbia.edu.",
];

export default function TermsPage() {
  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <div className="mx-auto max-w-[860px]">
        <Link href="/" className="no-underline"><Wordmark className="text-[24px]" /></Link>
        <div className="rh-faint mt-12 text-[12px] font-bold uppercase tracking-[0.24em]">Terms</div>
        <h1 className="rh-display rh-ink mt-3 text-[52px] font-semibold leading-none">Terms of Use</h1>
        <p className="rh-muted mt-5 text-[18px] leading-8">
          These terms govern use of Rabbit Holes, including the web documentation and browser extension.
        </p>
        <div className="rh-surface mt-10 rounded-[22px] border p-7">
          <ol className="space-y-5">
            {TERMS.map((term, i) => (
              <li key={term} className="grid gap-4 sm:grid-cols-[42px_1fr]">
                <span className="rh-display text-[28px] font-semibold text-[#c2703f]">{String(i + 1).padStart(2, "0")}</span>
                <span className="rh-muted text-[16.5px] leading-7">{term}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="rh-muted mt-8 text-[13px]">
          Last updated: June 29, 2026 · Support: <a className="underline" href="mailto:aa5851@columbia.edu">aa5851@columbia.edu</a>
        </p>
      </div>
    </main>
  );
}
