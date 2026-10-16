"use client";

import { useRef } from "react";

export function FileUploadField({
  id,
  label,
  accept,
  file,
  required = false,
  hint,
  error,
  onFileChange,
}: {
  id: string;
  label: string;
  accept: string;
  file: File | null;
  required?: boolean;
  hint?: string;
  error?: string;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  function removeFile() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileChange(null);
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      <span id={`${id}-label`} className="text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-1 text-red-800">(obligatorio)</span>}
      </span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        required={required}
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          const selectedFile = event.target.files?.[0] ?? null;
          event.target.value = "";
          onFileChange(selectedFile);
        }}
        className="peer sr-only"
      />
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label
          htmlFor={id}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-paper peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        >
          {file ? "Cambiar archivo" : "Seleccionar archivo"}
        </label>
        {file && (
          <span className="min-w-0 break-all text-sm text-gray-700" aria-live="polite">
            {file.name}
          </span>
        )}
        {file && (
          <button
            type="button"
            onClick={removeFile}
            className="min-h-10 cursor-pointer rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-paper"
          >
            Quitar archivo
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="mb-0 text-xs leading-5 text-gray-700">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mb-0 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
