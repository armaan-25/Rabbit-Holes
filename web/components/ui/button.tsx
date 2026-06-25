import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClass: Record<ButtonVariant, string> = {
  primary: "rh-primary border border-transparent text-[var(--rh-primary-text)] shadow-[0_8px_28px_rgba(42,32,24,.12)] hover:-translate-y-0.5",
  secondary: "rh-surface-2 border border-[var(--rh-line)] text-[var(--rh-ink-soft)] hover:border-[var(--rh-line-strong)] hover:text-[var(--rh-ink)]",
  ghost: "border border-transparent text-[var(--rh-muted)] hover:bg-[var(--rh-surface-2)] hover:text-[var(--rh-ink)]",
  danger: "border border-[#b8795f33] bg-[#b8795f14] text-[#b8795f] hover:bg-[#b8795f20]",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-12 px-7 text-[15px]",
  icon: "h-9 w-9 p-0 text-[13px]",
};

const base = "inline-flex shrink-0 items-center justify-center rounded-full font-semibold no-underline outline-none transition disabled:pointer-events-none disabled:opacity-50";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export function Button({ variant = "secondary", size = "md", className, ...props }: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, variantClass[variant], sizeClass[size], className)} {...props} />;
}

export function ButtonLink({ variant = "secondary", size = "md", className, ...props }: SharedProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn(base, variantClass[variant], sizeClass[size], className)} {...props} />;
}
