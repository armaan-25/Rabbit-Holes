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

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[19px] font-semibold tabular-nums tracking-tight text-haze-100">
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-haze-400">{label}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#a8967d]">
      {children}
    </div>
  );
}
