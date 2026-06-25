import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface-2)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rh-ink-soft)]", className)}
      {...props}
    />
  );
}
