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
        "appearance-none bg-[var(--rh-surface-2)] bg-[url(\"data:image/svg+xml,%3Csvg_width='14'_height='8'_viewBox='0_0_14_8'_fill='none'_xmlns='http://www.w3.org/2000/svg'%3E%3Cpath_d='M1_1L7_7L13_1'_stroke='%23b8a98f'_stroke-width='1.6'_stroke-linecap='round'_stroke-linejoin='round'/%3E%3C/svg%3E\")] bg-[length:14px_8px] bg-[right_14px_center] bg-no-repeat pr-11 text-[var(--rh-ink-soft)]",
        className
      )}
      {...props}
    />
  );
}
