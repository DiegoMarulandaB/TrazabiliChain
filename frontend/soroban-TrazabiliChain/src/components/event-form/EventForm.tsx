"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormFieldError } from "@/components/ui/FormFieldError";
import {
  hashEvidenceFile,
  removeEvidenceFile,
  saveEvidenceFile,
} from "@/lib/lots/evidence-storage";
import {
  updateLotRecord,
  type DemoRole,
  type LotEvent,
  type LotRecord,
} from "@/lib/lots/lot-storage";
import { verifyCurrentPassword } from "@/lib/supabase/verify-current-password";

const eventTypes = ["Recepción", "Despacho", "Transformación", "Entrega", "Inspección", "Otro"];
const maximumEvidenceSize = 10 * 1024 * 1024;
const acceptedEvidenceTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function getLocalDateTimeInputValue() {
  const localTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function EventForm({
  records,
  actorName,
  actorRole,
  organization,
}: {
  records: LotRecord[];
  actorName: string;
  actorRole: DemoRole;
  organization: string;
}) {
  const [lotId, setLotId] = useState(records[0]?.id ?? "");
  const [type, setType] = useState(eventTypes[0]);
  const [occurredAt, setOccurredAt] = useState(getLocalDateTimeInputValue);
  const [details, setDetails] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editActorName, setEditActorName] = useState("");
  const [editOrganization, setEditOrganization] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [removeExistingEvidence, setRemoveExistingEvidence] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const eventFormRef = useRef<HTMLFormElement>(null);
  const submissionInProgress = useRef(false);
  const submissionConfirmed = useRef(false);
  const ownedEvents = records.flatMap((record) =>
    record.events
      .filter(
        (event) =>
          event.actorName === actorName &&
          event.actorRole === actorRole &&
          event.organization === organization,
      )
      .map((event) => ({ recordId: record.id, event })),
  );
  const editingEntry = ownedEvents.find(({ event }) => event.id === editingEventId);

  function reportError(message: string) {
    setMessage(message);
    toast.error(message);
  }

  function reportSuccess(message: string) {
    setMessage(message);
    toast.success(message);
  }

  function clearFieldError(field: string) {
    setMessage("");
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) {
      return;
    }
    const errors: Record<string, string> = {};
    if (!lotId) errors["event-lot"] = "Selecciona un lote.";
    if (!eventTypes.includes(type)) errors["event-type"] = "Selecciona el tipo de evento.";
    if (!occurredAt) errors["event-time"] = "Selecciona la fecha y hora del evento.";
    if (!details.trim()) errors["event-details"] = "Escribe el detalle del evento.";
    if (!actorName.trim() || !organization.trim()) {
      errors["event-responsible"] = "Completa el actor y la organización en el perfil de trabajo.";
    }
    if (editingEventId && !editReason.trim()) {
      errors["event-edit-reason"] = "Escribe la razón del cambio.";
    }
    if (editingEventId && !editActorName.trim()) {
      errors["event-edit-actor"] = "Escribe el responsable del evento.";
    }
    if (editingEventId && !editOrganization.trim()) {
      errors["event-edit-organization"] = "Escribe la organización del evento.";
    }
    if (editingEventId && !editPassword) {
      errors["event-edit-password"] = "Ingresa la contraseña de tu cuenta.";
    }
    if (evidenceFile && evidenceFile.size > maximumEvidenceSize) {
      errors["event-evidence"] = "La evidencia supera el límite local de 10 MB.";
    } else if (evidenceFile && !acceptedEvidenceTypes.has(evidenceFile.type)) {
      errors["event-evidence"] = "La evidencia debe ser PDF, JPEG, PNG o WebP.";
    } else if (!evidenceFile && fieldErrors["event-evidence"]) {
      errors["event-evidence"] = fieldErrors["event-evidence"];
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      reportError("Completa los campos marcados antes de continuar.");
      document.getElementById(Object.keys(errors)[0])?.focus();
      return;
    }
    if (editingEventId && !editingEntry) {
      reportError(
        "Este evento ya no está disponible para editar. Recarga la lista e inténtalo otra vez.",
      );
      return;
    }
    if (!submissionConfirmed.current) {
      setIsConfirmationOpen(true);
      return;
    }
    submissionConfirmed.current = false;

    const selectedLot = records.find((record) => record.id === lotId);
    const normalizedDetails = details.trim().toLocaleLowerCase("es");
    const nextActorName = editingEventId ? editActorName.trim() : actorName;
    const nextOrganization = editingEventId ? editOrganization.trim() : organization;
    const duplicateEvent = selectedLot?.events.some(
      (existingEvent) =>
        existingEvent.id !== editingEventId &&
        existingEvent.type === type &&
        existingEvent.occurredAt === new Date(occurredAt).toISOString() &&
        existingEvent.actorName === nextActorName &&
        existingEvent.organization === nextOrganization &&
        existingEvent.details.trim().toLocaleLowerCase("es") === normalizedDetails,
    );
    if (duplicateEvent) {
      reportError("Este evento ya existe en el historial del lote.");
      return;
    }

    submissionInProgress.current = true;
    setIsSaving(true);
    const eventId = window.crypto.randomUUID();
    let evidenceSha256: string | undefined;

    try {
      if (editingEventId && editingEntry) {
        if (!(await verifyCurrentPassword(editPassword))) {
          reportError("La contraseña no coincide. No se modificó el evento.");
          return;
        }

        const previousEvidenceId = editingEntry.event.evidenceId ?? editingEntry.event.id;
        const nextEvidenceId = evidenceFile ? window.crypto.randomUUID() : previousEvidenceId;
        let evidenceFileName = editingEntry.event.evidenceFileName;
        let evidenceHash = editingEntry.event.evidenceSha256;
        if (evidenceFile) {
          evidenceHash = await hashEvidenceFile(evidenceFile);
          if (!(await saveEvidenceFile(nextEvidenceId, evidenceFile))) {
            reportError("No se pudo guardar la nueva evidencia.");
            return;
          }
          evidenceFileName = evidenceFile.name;
        }

        const updatedAt = new Date().toISOString();
        const saved = await updateLotRecord(editingEntry.recordId, (record) => ({
          ...record,
          events: record.events.map((existingEvent) =>
            existingEvent.id === editingEventId
              ? {
                  ...existingEvent,
                  type,
                  occurredAt: new Date(occurredAt).toISOString(),
                  actorName: nextActorName,
                  organization: nextOrganization,
                  details: details.trim(),
                  ...(evidenceFile
                    ? {
                        evidenceId: nextEvidenceId,
                        evidenceFileName,
                        evidenceSha256: evidenceHash,
                      }
                    : removeExistingEvidence
                      ? {
                          evidenceId: undefined,
                          evidenceFileName: undefined,
                          evidenceSha256: undefined,
                        }
                      : {}),
                }
              : existingEvent,
          ),
          auditHistory: [
            ...(record.auditHistory ?? []),
            {
              id: window.crypto.randomUUID(),
              action: "edited" as const,
              target: "evento" as const,
              at: updatedAt,
              actor: actorName,
              role: actorRole,
              reason: editReason.trim(),
              description: `Se actualizaron el tipo, la fecha o el detalle del evento en el lote ${record.product}; ${evidenceFile ? "se reemplazó la evidencia" : removeExistingEvidence ? "se quitó la evidencia" : "la evidencia se conservó"}.`,
            },
          ],
        }));

        if (!saved) {
          if (evidenceFile) await removeEvidenceFile(nextEvidenceId);
          reportError("No se pudo guardar el evento actualizado.");
          return;
        }
        if ((evidenceFile || removeExistingEvidence) && editingEntry.event.evidenceFileName) {
          await removeEvidenceFile(previousEvidenceId);
        }
        reportSuccess("Evento actualizado y cambio registrado en la auditoría del lote.");
        setEditingEventId(null);
        setEditReason("");
        setEditPassword("");
        setRemoveExistingEvidence(false);
        setEvidenceFile(null);
        setFieldErrors({});
        return;
      }

      if (evidenceFile) {
        evidenceSha256 = await hashEvidenceFile(evidenceFile);
        if (!(await saveEvidenceFile(eventId, evidenceFile))) {
          reportError("No se pudo guardar la evidencia en este navegador.");
          return;
        }
      }

      const lotEvent: LotEvent = {
        id: eventId,
        type,
        occurredAt: new Date(occurredAt).toISOString(),
        recordedAt: new Date().toISOString(),
        actorName,
        actorRole,
        organization,
        details: details.trim(),
        ...(evidenceFile && evidenceSha256
          ? { evidenceFileName: evidenceFile.name, evidenceSha256 }
          : {}),
      };

      const saved = await updateLotRecord(lotId, (record) => ({
        ...record,
        events: [...record.events, lotEvent].sort((first, second) =>
          first.occurredAt.localeCompare(second.occurredAt),
        ),
      }));

      if (!saved) {
        if (evidenceFile) {
          await removeEvidenceFile(eventId);
        }
        reportError("No se pudo guardar el evento en Supabase.");
        return;
      }

      reportSuccess(`Evento de ${type.toLowerCase()} agregado al historial.`);
      setDetails("");
      setEvidenceFile(null);
      setFieldErrors({});
    } catch {
      reportError("No se pudo procesar la evidencia en este navegador.");
    } finally {
      submissionInProgress.current = false;
      setIsSaving(false);
    }
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-700">Primero registra un lote para poder agregar eventos.</p>
    );
  }

  function beginEditingEvent(eventId: string) {
    const match = ownedEvents.find(({ event }) => event.id === eventId);
    if (!match) return;
    setEditingEventId(eventId);
    setLotId(match.recordId);
    setType(match.event.type);
    setOccurredAt(toDateTimeLocalValue(match.event.occurredAt));
    setDetails(match.event.details);
    setEditActorName(match.event.actorName);
    setEditOrganization(match.event.organization);
    setEvidenceFile(null);
    setEditReason("");
    setEditPassword("");
    setRemoveExistingEvidence(false);
    setMessage("");
    setFieldErrors({});
  }

  function cancelEditingEvent() {
    setEditingEventId(null);
    setEditActorName("");
    setEditOrganization("");
    setEditReason("");
    setEditPassword("");
    setEvidenceFile(null);
    setRemoveExistingEvidence(false);
    setType(eventTypes[0]);
    setOccurredAt(getLocalDateTimeInputValue());
    setDetails("");
    setMessage("");
    setFieldErrors({});
  }

  return (
    <section aria-labelledby="event-form-title" className="max-w-2xl">
      <h2 id="event-form-title" className="font-display text-2xl font-medium text-ink">
        Registrar evento de cadena
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-700">
        Identifica el lote, el hito y quién lo reporta. La fecha del evento y la fecha de captura se
        guardan por separado.
      </p>
      <form
        ref={eventFormRef}
        className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={submitEvent}
      >
        <div className="grid gap-1.5">
          <label htmlFor="event-lot" className="text-sm font-semibold text-ink">
            Lote
          </label>
          <select
            id="event-lot"
            required
            disabled={Boolean(editingEventId)}
            aria-invalid={Boolean(fieldErrors["event-lot"])}
            aria-describedby={fieldErrors["event-lot"] ? "event-lot-error" : undefined}
            value={lotId}
            onChange={(event) => {
              setLotId(event.target.value);
              clearFieldError("event-lot");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {record.product} · {record.id.slice(0, 8)}
              </option>
            ))}
          </select>
          <FormFieldError id="event-lot-error" message={fieldErrors["event-lot"]} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="event-type" className="text-sm font-semibold text-ink">
            Tipo de evento
          </label>
          <select
            id="event-type"
            required
            aria-invalid={Boolean(fieldErrors["event-type"])}
            aria-describedby={fieldErrors["event-type"] ? "event-type-error" : undefined}
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              clearFieldError("event-type");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {eventTypes.map((eventType) => (
              <option key={eventType}>{eventType}</option>
            ))}
          </select>
          <FormFieldError id="event-type-error" message={fieldErrors["event-type"]} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="event-time" className="text-sm font-semibold text-ink">
            Fecha y hora del evento
          </label>
          <input
            id="event-time"
            type="datetime-local"
            required
            aria-invalid={Boolean(fieldErrors["event-time"])}
            aria-describedby={fieldErrors["event-time"] ? "event-time-error" : undefined}
            value={occurredAt}
            onChange={(event) => {
              setOccurredAt(event.target.value);
              clearFieldError("event-time");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
          <FormFieldError id="event-time-error" message={fieldErrors["event-time"]} />
        </div>
        <div className="grid gap-1.5">
          {editingEventId ? (
            <>
              <div className="grid gap-1.5">
                <label htmlFor="event-edit-actor" className="text-sm font-semibold text-ink">
                  Responsable declarado
                </label>
                <input
                  id="event-edit-actor"
                  value={editActorName}
                  onChange={(event) => {
                    setEditActorName(event.target.value);
                    clearFieldError("event-edit-actor");
                  }}
                  aria-invalid={Boolean(fieldErrors["event-edit-actor"])}
                  aria-describedby={
                    fieldErrors["event-edit-actor"] ? "event-edit-actor-error" : undefined
                  }
                  className="min-h-11 min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                />
                <FormFieldError
                  id="event-edit-actor-error"
                  message={fieldErrors["event-edit-actor"]}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="event-edit-organization" className="text-sm font-semibold text-ink">
                  Organización declarada
                </label>
                <input
                  id="event-edit-organization"
                  value={editOrganization}
                  onChange={(event) => {
                    setEditOrganization(event.target.value);
                    clearFieldError("event-edit-organization");
                  }}
                  aria-invalid={Boolean(fieldErrors["event-edit-organization"])}
                  aria-describedby={
                    fieldErrors["event-edit-organization"]
                      ? "event-edit-organization-error"
                      : undefined
                  }
                  className="min-h-11 min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                />
                <FormFieldError
                  id="event-edit-organization-error"
                  message={fieldErrors["event-edit-organization"]}
                />
              </div>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold text-ink">Responsable</span>
              <span
                id="event-responsible"
                tabIndex={-1}
                className="flex min-h-11 items-center rounded-md border border-line bg-paper px-3 text-sm text-ink"
                aria-describedby={
                  fieldErrors["event-responsible"] ? "event-responsible-error" : undefined
                }
              >
                {actorName} · {organization}
              </span>
              <FormFieldError
                id="event-responsible-error"
                message={fieldErrors["event-responsible"]}
              />
            </>
          )}
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="event-details" className="text-sm font-semibold text-ink">
            Detalle del evento
          </label>
          <textarea
            id="event-details"
            required
            aria-invalid={Boolean(fieldErrors["event-details"])}
            aria-describedby={fieldErrors["event-details"] ? "event-details-error" : undefined}
            maxLength={500}
            rows={3}
            value={details}
            onChange={(event) => {
              setDetails(event.target.value);
              clearFieldError("event-details");
            }}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            placeholder="Describe brevemente qué ocurrió"
          />
          <FormFieldError id="event-details-error" message={fieldErrors["event-details"]} />
        </div>
        <div className="sm:col-span-2">
          <FileUploadField
            id="event-evidence"
            label="Evidencia opcional (PDF o imagen, máximo 10 MB)"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            file={evidenceFile}
            error={fieldErrors["event-evidence"]}
            onFileChange={(file) => {
              if (!file) {
                setEvidenceFile(null);
                clearFieldError("event-evidence");
                return;
              }
              if (file.size > maximumEvidenceSize) {
                setEvidenceFile(file);
                setFieldErrors((current) => ({
                  ...current,
                  "event-evidence": "La evidencia supera el límite local de 10 MB.",
                }));
                return;
              }
              if (!acceptedEvidenceTypes.has(file.type)) {
                setEvidenceFile(file);
                setFieldErrors((current) => ({
                  ...current,
                  "event-evidence": "La evidencia debe ser PDF, JPEG, PNG o WebP.",
                }));
                return;
              }
              setEvidenceFile(file);
              clearFieldError("event-evidence");
            }}
            hint="El archivo y su huella se guardan solo en este navegador, no en Stellar."
          />
        </div>
        {editingEventId && (
          <div className="grid min-w-0 gap-3 border-t border-line pt-4 sm:col-span-2 sm:grid-cols-2">
            <p className="mb-0 text-sm font-semibold text-ink sm:col-span-2">
              Modificación de tu evento
            </p>
            {editingEntry?.event.evidenceFileName && (
              <div className="grid gap-2 sm:col-span-2">
                <p className="mb-0 text-xs text-gray-700">
                  Evidencia actual: {editingEntry.event.evidenceFileName}
                </p>
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={removeExistingEvidence}
                    onChange={(event) => setRemoveExistingEvidence(event.target.checked)}
                    className="size-4 accent-accent"
                  />
                  Quitar la evidencia actual
                </label>
              </div>
            )}
            <div className="grid min-w-0 gap-1.5">
              <label htmlFor="event-edit-reason" className="text-xs font-semibold text-ink">
                Razón de la modificación
              </label>
              <input
                id="event-edit-reason"
                value={editReason}
                onChange={(event) => {
                  setEditReason(event.target.value);
                  clearFieldError("event-edit-reason");
                }}
                aria-invalid={Boolean(fieldErrors["event-edit-reason"])}
                aria-describedby={
                  fieldErrors["event-edit-reason"] ? "event-edit-reason-error" : undefined
                }
                className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
              />
              <FormFieldError
                id="event-edit-reason-error"
                message={fieldErrors["event-edit-reason"]}
              />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <label htmlFor="event-edit-password" className="text-xs font-semibold text-ink">
                Contraseña de la cuenta
              </label>
              <input
                id="event-edit-password"
                type="password"
                autoComplete="current-password"
                value={editPassword}
                onChange={(event) => {
                  setEditPassword(event.target.value);
                  clearFieldError("event-edit-password");
                }}
                aria-invalid={Boolean(fieldErrors["event-edit-password"])}
                aria-describedby={
                  fieldErrors["event-edit-password"] ? "event-edit-password-error" : undefined
                }
                className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
              />
              <FormFieldError
                id="event-edit-password-error"
                message={fieldErrors["event-edit-password"]}
              />
            </div>
            <button
              type="button"
              onClick={cancelEditingEvent}
              className="min-h-10 justify-self-start rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-paper sm:col-span-2"
            >
              Cancelar edición
            </button>
          </div>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          {isSaving
            ? "Guardando evento…"
            : editingEventId
              ? "Guardar cambios"
              : "Agregar al historial"}
        </button>
      </form>
      {ownedEvents.length > 0 && (
        <details className="mt-6 border-t border-line pt-4">
          <summary className="w-fit cursor-pointer text-sm font-semibold text-accent underline underline-offset-4">
            Editar mis eventos
          </summary>
          <ul className="mt-3 grid gap-2">
            {ownedEvents.map(({ recordId, event }) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-line p-3"
              >
                <span className="min-w-0 text-sm text-ink">
                  {event.type} · {records.find((record) => record.id === recordId)?.product} ·{" "}
                  {event.details}
                </span>
                <button
                  type="button"
                  onClick={() => beginEditingEvent(event.id)}
                  className="min-h-10 cursor-pointer rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-paper"
                >
                  Editar
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <ConfirmDialog
        open={isConfirmationOpen}
        title={
          editingEventId
            ? "Confirmar modificación del evento"
            : "Revisa el evento antes de agregarlo"
        }
        description={
          editingEventId
            ? "El cambio requiere contraseña y razón; se añadirá al historial de auditoría del lote."
            : "Verifica el lote, la fecha, el detalle y el archivo de evidencia. El evento se añadirá al historial del lote."
        }
        confirmLabel={editingEventId ? "Guardar cambios" : "Agregar evento"}
        isBusy={isSaving}
        onCancel={() => {
          submissionConfirmed.current = false;
          setIsConfirmationOpen(false);
        }}
        onConfirm={() => {
          submissionConfirmed.current = true;
          setIsConfirmationOpen(false);
          eventFormRef.current?.requestSubmit();
        }}
      />
      <p className="mt-3 min-h-5 text-sm text-accent" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
