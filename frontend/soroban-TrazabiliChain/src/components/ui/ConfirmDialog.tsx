"use client";

import { useEffect, useId, useRef } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  helperText,
  confirmLabel = "Continuar",
  backLabel,
  isBusy = false,
  onCancel,
  onBack,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  helperText?: string;
  confirmLabel?: string;
  backLabel?: string;
  isBusy?: boolean;
  onCancel: () => void;
  onBack?: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,32rem)] overflow-y-auto rounded-md border border-line bg-white p-0 text-ink shadow-[0_24px_80px_-32px_rgba(25,51,50,0.5)] backdrop:bg-ink/50"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="mb-0 min-w-0 break-words font-display text-xl font-medium [overflow-wrap:anywhere]"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar ventana"
            disabled={isBusy}
            onClick={onCancel}
            className="grid size-9 shrink-0 place-items-center rounded-md border border-line text-xl leading-none hover:bg-paper disabled:opacity-50"
          >
            ×
          </button>
        </div>
        <p
          id={descriptionId}
          className="mt-3 mb-0 break-words whitespace-pre-line text-sm leading-6 text-gray-700 [overflow-wrap:anywhere]"
        >
          {description}
        </p>
        {helperText && (
          <p className="mt-3 mb-0 rounded-sm bg-accent-soft px-3 py-2 text-xs leading-5 text-ink">
            {helperText}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {backLabel && onBack && (
            <button
              type="button"
              disabled={isBusy}
              onClick={onBack}
              className="mr-auto min-h-11 rounded-md border border-line px-4 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-50"
            >
              {backLabel}
            </button>
          )}
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="min-h-11 rounded-md border border-line px-4 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-wait disabled:opacity-60"
          >
            {isBusy ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
