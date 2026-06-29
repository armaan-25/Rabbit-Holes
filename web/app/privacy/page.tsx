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
    title: "Local-first storage",
    body: "Rabbit Holes stores investigations, browsing metadata, summaries, and settings locally by default. Cloud sync is not required to use the product.",
  },
  {
    title: "Your AI provider",
    body: "When AI features are used, requests should go to the provider you configure, such as OpenAI, Anthropic, OpenRouter, Gemini, Ollama, LM Studio, or another OpenAI-compatible endpoint. Your provider's terms and retention policy apply to those requests.",
  },
  {
    title: "Your controls",
    body: "You can pause, resume, stop, export, remove captured tabs, and reset local data from the extension and settings page.",
  },
  {
    title: "Contact",
    body: "For privacy questions or support, email aa5851@columbia.edu.",
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
          Rabbit Holes is a local-first browser companion. This policy explains the browsing data the extension needs, how it is used, and the controls you have.
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
          Last updated: June 29, 2026 · Support: <a className="underline" href="mailto:aa5851@columbia.edu">aa5851@columbia.edu</a>
        </p>
      </div>
    </main>
  );
}
