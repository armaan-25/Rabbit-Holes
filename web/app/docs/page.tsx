import Link from "next/link";
import { Wordmark } from "@/components/Logo";

const INSTALL_STEPS = [
  ["Download", "Download the extension zip from Rabbit Holes."],
  ["Unzip", "Keep the unzipped folder somewhere stable."],
  ["Load unpacked", "Open chrome://extensions, enable Developer mode, then choose the unzipped folder."],
  ["Configure AI", "Open Settings and add your OpenRouter, Anthropic, OpenAI, Gemini, Ollama, LM Studio, or compatible endpoint."],
  ["Browse", "Search and open related pages normally. Rabbit Holes captures the trail locally."],
  ["Build", "Click Build rabbit holes when you want to turn the captured trail into investigations."],
];

const FAQ = [
  ["Do I need an account?", "Use Dashboard to sign in when you want the app workspace. The extension-first flow still keeps provider settings and captured state local by default."],
  ["Where does my data live?", "Captured pages, provider settings, and generated investigations are stored locally unless you explicitly export or enable sync later."],
  ["Which browsers work?", "Chrome, Arc, Brave, Edge, Opera, and other Chromium browsers can load the same extension package."],
  ["Which AI providers work?", "OpenRouter, Anthropic, OpenAI, Gemini, Ollama, LM Studio, and OpenAI-compatible endpoints are supported through one provider setting."],
  ["What should I browse first?", "Use it on a real thread: a few related searches, docs, papers, repos, articles, or videos. Thin trails are intentionally rejected."],
];

export default function DocsPage() {
  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <div className="mx-auto w-full max-w-[980px]">
        <Link href="/" className="inline-flex no-underline">
          <Wordmark className="text-[24px]" />
        </Link>

        <section className="pt-14">
          <div className="rh-faint text-[12px] font-bold uppercase tracking-[0.24em]">Docs</div>
          <h1 className="rh-display mt-3 max-w-[11ch] text-[clamp(52px,8vw,86px)] font-semibold leading-[0.95] tracking-[-0.045em]">
            Install. Browse. Continue.
          </h1>
          <p className="rh-muted mt-6 max-w-[680px] text-[19px] leading-8">
            Rabbit Holes is a browser companion for preserving research context. It captures the trail locally, then turns related pages and searches into investigations you can come back to.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/downloads/rabbit-holes-extension.zip" download className="rounded-full bg-[var(--rh-primary)] px-7 py-4 text-[16px] font-semibold text-[var(--rh-primary-text)] no-underline">
              Download extension ↓
            </a>
            <Link href="/settings" className="rounded-full border border-[var(--rh-line)] px-7 py-4 text-[16px] font-semibold no-underline">
              Configure provider
            </Link>
          </div>
        </section>

        <section className="mt-14">
          <div className="rh-faint mb-4 text-[12px] font-bold uppercase tracking-[0.24em]">Manual install</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {INSTALL_STEPS.map(([title, body], index) => (
              <div key={title} className="rh-surface rounded-[18px] border p-5">
                <div className="rh-faint text-[12px] font-bold uppercase tracking-[0.2em]">{String(index + 1).padStart(2, "0")}</div>
                <h2 className="rh-display mt-3 text-[25px] font-semibold leading-tight">{title}</h2>
                <p className="rh-muted mt-2 text-[15px] leading-7">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="rh-faint mb-4 text-[12px] font-bold uppercase tracking-[0.24em]">FAQ</div>
          <div className="rh-surface divide-y divide-[var(--rh-line)] rounded-[22px] border">
            {FAQ.map(([question, answer]) => (
              <section key={question} className="p-6">
                <h2 className="rh-display text-[24px] font-semibold leading-tight">{question}</h2>
                <p className="rh-muted mt-2 max-w-[72ch] text-[15.5px] leading-7">{answer}</p>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
