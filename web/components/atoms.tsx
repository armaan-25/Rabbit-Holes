import { KIND_META, ENTITY_META, STATUS_META } from "@/lib/ui";
import type { NodeKind, EntityKind, HoleStatus } from "@/lib/types";

export function KindBadge({ kind }: { kind: NodeKind | "search" }) {
  const m = KIND_META[kind];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
      style={{ color: m.color, background: `${m.color}14` }}
    >
      <span className="text-[11px]">{m.glyph}</span>
      {m.label}
    </span>
  );
}

export function EntityChip({ name, kind }: { name: string; kind: EntityKind }) {
  const m = ENTITY_META[kind];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[12px]"
      style={{ borderColor: `${m.color}33`, color: "#5a4a38" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {name}
    </span>
  );
}

export function StatusBadge({ status }: { status: HoleStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2e9d6] px-2.5 py-1 text-[12px] font-semibold text-[#5a4a38]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#a8967d]">
      {children}
    </div>
  );
}
