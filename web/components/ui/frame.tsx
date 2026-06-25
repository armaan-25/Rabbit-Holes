import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function AppFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[1440px]", className)} {...props} />;
}

export function ToolbarFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rh-surface rounded-[22px] border border-[var(--rh-line)] p-4 shadow-[0_2px_16px_rgba(70,45,20,.05)]", className)}
      {...props}
    />
  );
}
