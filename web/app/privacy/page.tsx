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
    body: "Before public launch, replace this section with your support email and company/legal entity. Do not ship store listings without a real contact path.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[#2a2018]">
      <div className="mx-auto max-w-[860px]">
        <Link href="/" className="no-underline"><Wordmark className="text-[24px]" /></Link>
        <div className="mt-12 text-[12px] font-bold uppercase tracking-[0.24em] text-[#a8967d]">Privacy</div>
        <h1 className="rh-display mt-3 text-[52px] font-semibold leading-none">Privacy Policy</h1>
        <p className="mt-5 text-[18px] leading-8 text-[#5a4a38]">
          This is the launch-ready privacy draft for Rabbit Holes. It explains the browser-history data the product needs and the controls users have.
        </p>
        <div className="mt-10 space-y-4">
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-[20px] border border-[#785a3224] bg-[#fbf6ec] p-6">
              <h2 className="rh-display text-[25px] font-semibold">{section.title}</h2>
              <p className="mt-3 text-[16px] leading-7 text-[#6a5a48]">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-[13px] text-[#8a7860]">Last updated: June 22, 2026</p>
      </div>
    </main>
  );
}
