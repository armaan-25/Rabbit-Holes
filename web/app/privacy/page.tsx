import Link from "next/link";
import { Wordmark } from "@/components/Logo";

const SECTIONS = [
  {
    title: "What Rabbit Holes captures",
    body: "The browser extension captures page visits, search queries, page titles, domains, navigation/referrer relationships, tab opens, and timestamps so it can reconstruct your research trail.",
  },
  {
    title: "What Rabbit Holes skips",
    body: "The extension is configured to skip sensitive domains like Google account login, Microsoft login, and Gmail. Incognito/private windows are off by default unless you explicitly enable them.",
  },
  {
    title: "How data is used",
    body: "Captured data is used to create maps, timelines, summaries, and answer questions grounded in pages you actually visited. AI is used for clustering and synthesis, not for selling ads.",
  },
  {
    title: "Your controls",
    body: "You can pause, resume, stop, export, and reset your captured data from the extension and settings page. Reset clears backend capture data for your signed-in account when available.",
  },
  {
    title: "Third-party services",
    body: "Rabbit Holes uses Supabase for authentication/database storage, Railway for hosting, Google OAuth for sign-in, and Anthropic for AI clustering and synthesis.",
  },
  {
    title: "Contact",
    body: "For privacy questions, account deletion requests, or support, email aa5851@columbia.edu.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <div className="mx-auto max-w-[860px]">
        <Link href="/" className="no-underline"><Wordmark className="text-[24px]" /></Link>
        <div className="rh-faint mt-12 text-[12px] font-bold uppercase tracking-[0.24em]">Privacy</div>
        <h1 className="rh-display rh-ink mt-3 text-[52px] font-semibold leading-none">Privacy Policy</h1>
        <p className="rh-muted mt-5 text-[18px] leading-8">
          Rabbit Holes is a browser-history research tool. This policy explains the browsing data the product needs, how it is used, and the controls users have.
        </p>
        <div className="mt-10 space-y-4">
          {SECTIONS.map((section) => (
            <section key={section.title} className="rh-surface rounded-[20px] border p-6">
              <h2 className="rh-display rh-ink text-[25px] font-semibold">{section.title}</h2>
              <p className="rh-muted mt-3 text-[16px] leading-7">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="rh-muted mt-8 text-[13px]">
          Last updated: June 22, 2026 · Support: <a className="underline" href="mailto:aa5851@columbia.edu">aa5851@columbia.edu</a>
        </p>
      </div>
    </main>
  );
}
