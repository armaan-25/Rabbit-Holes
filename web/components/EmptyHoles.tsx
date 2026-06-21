import Link from "next/link";

/**
 * Shared fresh-account empty state. Uses the canonical design tokens so it
 * inherits dark mode automatically.
 */
export function EmptyHoles({
  eyebrow = "Your warren",
  title = "No rabbit holes yet",
  hint,
}: {
  readonly eyebrow?: string;
  readonly title?: string;
  readonly hint?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-dashed border-[#785a3224] bg-[#fbf6ec] px-8 py-14 text-center shadow-[0_2px_18px_rgba(70,45,20,.06)]">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-[#785a3224] bg-[#f2e9d6] text-[30px]">🕳️</div>
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#a8967d]">{eyebrow}</div>
      <h2 className="rh-display text-[30px] font-semibold leading-tight text-[#2a2018]">{title}</h2>
      <p className="mx-auto mt-3 max-w-[42ch] text-[16px] leading-[1.55] text-[#6a5a48]">
        {hint ??
          "Install the extension and browse normally. As you go down a rabbit hole, your searches and pages get clustered into investigations that show up here."}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/downloads/rabbit-holes-extension.zip"
          download
          className="inline-flex rounded-full bg-[#2a2018] px-7 py-3.5 text-[15px] font-semibold text-[#f3e8d4] transition hover:-translate-y-0.5"
        >
          Download extension ↓
        </a>
        <Link
          href="/settings"
          className="inline-flex rounded-full border border-[#785a3224] bg-[#f2e9d6] px-7 py-3.5 text-[15px] font-semibold text-[#2a2018] no-underline transition hover:-translate-y-0.5"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}

/** Full-page variant for routes that are nothing but holes (map, timeline, heatmap). */
export function EmptyHolesPage(props: { readonly eyebrow?: string; readonly title?: string; readonly hint?: string }) {
  return (
    <div className="rh-paper grid min-h-screen place-items-center px-5 py-16">
      <EmptyHoles {...props} />
    </div>
  );
}
