"use client";

import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  eyebrow = "Confirm",
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel,
}: {
  readonly open: boolean;
  readonly eyebrow?: string;
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly danger?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] grid place-items-center bg-[#140d08]/72 px-4 backdrop-blur-[8px]"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="rh-surface w-full max-w-[520px] rounded-[28px] border p-7 shadow-[0_34px_90px_rgba(18,11,5,.42)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rh-faint text-[11px] font-bold uppercase tracking-[0.22em]">{eyebrow}</div>
        <h2 className="rh-display rh-ink mt-3 text-[34px] font-semibold leading-tight">{title}</h2>
        <p className="rh-muted mt-3 text-[16px] leading-7">{body}</p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
