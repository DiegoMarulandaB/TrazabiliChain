"use client";

import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormFieldError } from "@/components/ui/FormFieldError";
import { useWorkDraft } from "@/hooks/useWorkDraft";
import { updateLotRecord, type LotAuditNote, type LotRecord } from "@/lib/lots/lot-storage";

export function AuditNotePanel({
  record,
  author,
  organization,
  draftUserId,
}: {
  record: LotRecord;
  author: string;
  organization: string;
  draftUserId: string | null;
}) {
  const [text, setText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"text" | null>(null);
  const [message, setMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fieldId = `audit-note-${record.id}`;
  const noteDraft = useWorkDraft({
    userId: draftUserId,
    role: "auditor",
    product: record.product,
    draftKey: `audit-note-${record.id}`,
    payload: { text },
    onRestore: (draft) => {
      if (draft.text !== undefined) setText(draft.text);
    },
  });

  function beginEditing(note: LotAuditNote) {
    setEditingNoteId(note.id);
    setText(note.text);
    setError("");
    setErrorField(null);
    setMessage("");
  }

  function cancelEditing() {
    setEditingNoteId(null);
    setText("");
    setError("");
    setErrorField(null);
  }

  function requestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) {
      setError("Escribe una observación para el lote.");
      setErrorField("text");
      document.getElementById(`${fieldId}-text`)?.focus();
      return;
    }
    setError("");
    setErrorField(null);
    setIsDialogOpen(true);
  }

  async function confirmSave() {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const noteId = editingNoteId ?? window.crypto.randomUUID();
      const saved = await updateLotRecord(record.id, (current) => {
        const existingReason = current.auditNotes?.find(
          (existing) => existing.id === noteId,
        )?.reason;
        const note: LotAuditNote = {
          id: noteId,
          author,
          organization,
          text: text.trim(),
          ...(existingReason ? { reason: existingReason } : {}),
          createdAt:
            current.auditNotes?.find((existing) => existing.id === noteId)?.createdAt ?? now,
          updatedAt: now,
        };
        const notes = current.auditNotes ?? [];
        return {
          ...current,
          auditNotes: editingNoteId
            ? notes.map((existing) => (existing.id === noteId ? note : existing))
            : [...notes, note],
        };
      });

      if (!saved) {
        setError("No se pudo guardar la observación. Verifica el acceso al lote.");
        setErrorField(null);
        setIsDialogOpen(false);
        return;
      }

      setMessage(editingNoteId ? "Observación actualizada." : "Observación agregada.");
      setEditingNoteId(null);
      setText("");
      await noteDraft.clearDraft();
      setErrorField(null);
      setIsDialogOpen(false);
    } catch {
      setError("No se pudo verificar la cuenta o guardar la observación.");
      setErrorField(null);
      setIsDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-5 border-t border-line pt-4" aria-labelledby={`${fieldId}-title`}>
      <h4 id={`${fieldId}-title`} className="mb-2 text-sm font-semibold text-ink">
        Observaciones de auditoría
      </h4>
      <p className="mb-3 text-xs leading-5 text-gray-700">
        Las observaciones no cambian ni validan los datos declarados del lote.
      </p>
      {(record.auditNotes ?? []).length > 0 && (
        <ul className="grid gap-3">
          {(record.auditNotes ?? []).map((note) => (
            <li key={note.id} className="border-l-2 border-accent pl-3">
              <p className="mb-1 whitespace-pre-wrap text-sm leading-6 text-ink">{note.text}</p>
              <p className="mb-1 text-xs text-gray-700">
                {note.author} · {note.organization} ·{" "}
                {new Intl.DateTimeFormat("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(note.updatedAt))}
              </p>
              {note.reason && <p className="mb-1 text-xs text-gray-700">Motivo: {note.reason}</p>}
              {note.author === author && note.organization === organization && (
                <button
                  type="button"
                  onClick={() => beginEditing(note)}
                  className="min-h-9 cursor-pointer text-xs font-semibold text-accent underline underline-offset-2"
                >
                  Editar mi observación
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-4 grid gap-3"
        noValidate
        onSubmit={requestSave}
        inert={!noteDraft.isReady}
      >
        <div className="grid gap-1.5">
          <label htmlFor={`${fieldId}-text`} className="text-xs font-semibold text-ink">
            {editingNoteId ? "Observación revisada" : "Nueva observación"}
          </label>
          <textarea
            id={`${fieldId}-text`}
            rows={3}
            maxLength={1000}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (errorField === "text") setError("");
              setErrorField(null);
            }}
            aria-invalid={errorField === "text"}
            aria-describedby={errorField === "text" ? `${fieldId}-error` : undefined}
            className="min-w-0 rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
        </div>
        {error && <FormFieldError id={`${fieldId}-error`} message={error} />}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-10 rounded-md bg-accent px-3 text-sm font-semibold text-white hover:bg-[#125746] disabled:opacity-60"
          >
            {editingNoteId ? "Guardar observación" : "Agregar observación"}
          </button>
          {editingNoteId && (
            <button
              type="button"
              onClick={cancelEditing}
              className="min-h-10 rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-paper"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>
      {!noteDraft.isReady && (
        <p className="mt-2 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
          Restaurando tu observación guardada…
        </p>
      )}
      {message && (
        <p className="mt-3 mb-0 text-sm text-accent" role="status">
          {message}
        </p>
      )}
      <ConfirmDialog
        open={isDialogOpen}
        title={editingNoteId ? "Confirmar cambio de observación" : "Confirmar observación"}
        description="La observación quedará asociada al historial privado del lote con autor y fecha. No modificará sus eventos ni certificados."
        helperText="Conserva los primeros 8 caracteres del ID del lote que aparece en el QR para encontrarlo en otros perfiles."
        confirmLabel={editingNoteId ? "Guardar cambios" : "Agregar observación"}
        isBusy={isSaving}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={() => void confirmSave()}
      />
    </section>
  );
}
