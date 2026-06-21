import { KIND_META } from "@/lib/ui";

export function Legend() {
  const kinds = ["search", "repo", "paper", "doc", "website"] as const;
  return (
    <div className="flex flex-wrap items-center gap-4">
      {kinds.map((k) => {
        const m = KIND_META[k];
        return (
          <span key={k} className="flex items-center gap-1.5 text-[11.5px] text-haze-400">
            <span style={{ color: m.color }}>{m.glyph}</span>
            {m.label}
          </span>
        );
      })}
      <span className="ml-2 flex items-center gap-1.5 text-[11.5px] text-haze-400">
        <span className="inline-block h-px w-5" style={{ background: "#7c6cff", borderTop: "1px dashed #7c6cff" }} />
        discovered through
      </span>
    </div>
  );
}
