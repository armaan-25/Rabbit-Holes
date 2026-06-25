import Link from "next/link";
import { Wordmark } from "@/components/Logo";

const STEPS = [
  ["Download", "Download the Rabbit Holes extension zip from this page."],
  ["Unzip", "Unzip the file and keep the folder somewhere stable. Chrome needs the folder to stay in place."],
  ["Open extensions", "Open chrome://extensions in Chrome, Brave, Arc, Edge, or Opera, then turn on Developer mode."],
  ["Load unpacked", "Click Load unpacked and select the unzipped Rabbit Holes extension folder."],
  ["Pin and sign in", "Pin Rabbit Holes in your toolbar, open it, and sign in with the same account you use on the app."],
  ["Build", "Browse a few related pages or searches, then click Build rabbit holes to cluster the captured trail."],
];

export default function InstallPage() {
  return (
    <main className="rh-paper min-h-screen px-6 py-12 text-[var(--rh-ink)]">
      <div className="mx-auto max-w-[940px]">
        <Link href="/" className="no-underline"><Wordmark className="text-[24px]" /></Link>
        <div className="rh-faint mt-12 text-[12px] font-bold uppercase tracking-[0.24em]">Install</div>
        <h1 className="rh-display rh-ink mt-3 text-[52px] font-semibold leading-none">Install the extension</h1>
        <p className="rh-muted mt-5 max-w-[680px] text-[18px] leading-8">
          Chrome, Edge, Brave, Arc, and Opera can use the same Chromium extension package. The store listing is in review, so install manually for now.
        </p>
        <section className="rh-surface mt-7 rounded-[22px] border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="rh-faint text-[11px] font-bold uppercase tracking-[0.22em]">Early access</div>
              <h2 className="rh-display rh-ink mt-2 text-[28px] font-semibold leading-tight">Install the working extension directly.</h2>
              <p className="rh-muted mt-2 max-w-[62ch] text-[15.5px] leading-7">
                The public store listing is still being reviewed. Until it is approved, download the package and load it from Chrome&apos;s Extensions page.
              </p>
            </div>
            <div className="shrink-0 rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface-2)] px-4 py-2 text-[13px] font-semibold text-[var(--rh-ink-soft)]">
              Store listing in review
            </div>
          </div>
        </section>
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
        <div className="rh-surface mt-8 rounded-[20px] border p-6">
          <h2 className="rh-display rh-ink text-[24px] font-semibold">Send this to a tester</h2>
          <p className="rh-muted mt-3 text-[15.5px] leading-7">
            Rabbit Holes is available as a direct install while the store listing is reviewed: visit this page, download the zip, unzip it, open chrome://extensions, enable Developer mode, click Load unpacked, select the unzipped folder, pin Rabbit Holes, sign in, browse a few related pages, then click Build rabbit holes.
          </p>
        </div>
      </div>
    </main>
  );
}
