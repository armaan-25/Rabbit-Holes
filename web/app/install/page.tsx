import Link from "next/link";
import { Wordmark } from "@/components/Logo";

const STEPS = [
  ["Download", "Download the latest Rabbit Holes extension zip from the landing page."],
  ["Unzip", "Unzip the folder somewhere stable, for example your Applications or Projects folder. Chrome needs the folder to stay in place."],
  ["Open extensions", "Go to chrome://extensions and turn on Developer mode."],
  ["Load unpacked", "Click Load unpacked and select the unzipped extension folder."],
  ["Sign in", "Click the Rabbit Holes toolbar icon, sign in, then browse normally."],
  ["Build", "Click Build rabbit holes after a real browsing session to cluster the captured trail."],
];

export default function InstallPage() {
  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <div className="mx-auto max-w-[940px]">
        <Link href="/" className="no-underline"><Wordmark className="text-[24px]" /></Link>
        <div className="rh-faint mt-12 text-[12px] font-bold uppercase tracking-[0.24em]">Install</div>
        <h1 className="rh-display rh-ink mt-3 text-[52px] font-semibold leading-none">Install the extension</h1>
        <p className="rh-muted mt-5 max-w-[680px] text-[18px] leading-8">
          Chrome, Edge, Brave, Arc, and Opera can use the same Chromium extension package while the Chrome Web Store listing is not live yet.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/downloads/rabbit-holes-extension.zip" download className="rh-primary rounded-full px-7 py-4 text-[16px] font-semibold no-underline">
            Download extension ↓
          </a>
          <Link href="/privacy" className="rh-surface rounded-full border px-7 py-4 text-[16px] font-semibold no-underline">
            Privacy policy
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {STEPS.map(([title, body], i) => (
            <section key={title} className="rh-surface rounded-[20px] border p-6">
              <div className="rh-display text-[34px] font-semibold text-[#c2703f]">{String(i + 1).padStart(2, "0")}</div>
              <h2 className="rh-display rh-ink mt-3 text-[25px] font-semibold">{title}</h2>
              <p className="rh-muted mt-2 text-[16px] leading-7">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
