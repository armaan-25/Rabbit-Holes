import Link from "next/link";
import { Wordmark } from "@/components/Logo";

const TERMS = [
  "Rabbit Holes is provided as an early browser-history research tool. Do not rely on it as the only copy of important research or compliance records.",
  "You are responsible for the browsing data you choose to capture, including whether private/incognito capture is enabled.",
  "You may not use Rabbit Holes to capture another person's browsing activity without permission.",
  "The product may use AI-generated summaries and clusters. Those outputs can be incomplete or wrong and should be reviewed before use.",
  "The service may rate limit or reject requests to protect availability, cost, and abuse risk.",
  "Before public launch, replace this draft with legal terms reviewed for your entity, jurisdiction, and Chrome Web Store listing.",
];

export default function TermsPage() {
  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[#2a2018]">
      <div className="mx-auto max-w-[860px]">
        <Link href="/" className="no-underline"><Wordmark className="text-[24px]" /></Link>
        <div className="mt-12 text-[12px] font-bold uppercase tracking-[0.24em] text-[#a8967d]">Terms</div>
        <h1 className="rh-display mt-3 text-[52px] font-semibold leading-none">Terms of Use</h1>
        <p className="mt-5 text-[18px] leading-8 text-[#5a4a38]">
          These terms are a practical launch draft for testing and review. Get real legal review before public distribution.
        </p>
        <div className="mt-10 rounded-[22px] border border-[#785a3224] bg-[#fbf6ec] p-7">
          <ol className="space-y-5">
            {TERMS.map((term, i) => (
              <li key={term} className="grid gap-4 sm:grid-cols-[42px_1fr]">
                <span className="rh-display text-[28px] font-semibold text-[#c2703f]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[16.5px] leading-7 text-[#5a4a38]">{term}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-8 text-[13px] text-[#8a7860]">Last updated: June 22, 2026</p>
      </div>
    </main>
  );
}
