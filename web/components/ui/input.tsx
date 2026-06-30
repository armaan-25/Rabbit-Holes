import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClass = "h-11 rounded-[13px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-4 text-[14px] text-[var(--rh-ink)] outline-none transition placeholder:text-[var(--rh-faint)] focus:border-[var(--rh-line-strong)]";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        fieldClass,
        "rh-select appearance-none bg-[var(--rh-surface-2)] pr-11 text-[var(--rh-ink-soft)]",
        className
      )}
      {...props}
    />
  );
}
