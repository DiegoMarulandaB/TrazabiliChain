"use client";

import { useRef, useState, type FormEvent } from "react";
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

const eventTypes = ["Recepción", "Despacho", "Transformación", "Entrega", "Inspección", "Otro"];
const maximumEvidenceSize = 10 * 1024 * 1024;
const acceptedEvidenceTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function getLocalDateTimeInputValue() {
  const localTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
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
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const submissionInProgress = useRef(false);

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) {
      return;
    }
    if (evidenceFile && evidenceFile.size > maximumEvidenceSize) {
      setMessage("La evidencia supera el límite local de 10 MB.");
      return;
    }
    if (evidenceFile && !acceptedEvidenceTypes.has(evidenceFile.type)) {
      setMessage("La evidencia debe ser PDF, JPEG, PNG o WebP.");
      return;
    }

    const selectedLot = records.find((record) => record.id === lotId);
    const normalizedDetails = details.trim().toLocaleLowerCase("es");
    const duplicateEvent = selectedLot?.events.some(
      (existingEvent) =>
        existingEvent.type === type &&
        existingEvent.occurredAt === new Date(occurredAt).toISOString() &&
        existingEvent.actorName === actorName &&
        existingEvent.details.trim().toLocaleLowerCase("es") === normalizedDetails,
    );
    if (duplicateEvent) {
      setMessage("Este evento ya existe en el historial del lote.");
      return;
    }

    submissionInProgress.current = true;
    setIsSaving(true);
    const eventId = window.crypto.randomUUID();
    let evidenceSha256: string | undefined;

    try {
      if (evidenceFile) {
        evidenceSha256 = await hashEvidenceFile(evidenceFile);
        if (!(await saveEvidenceFile(eventId, evidenceFile))) {
          setMessage("No se pudo guardar la evidencia en este navegador.");
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

      const saved = updateLotRecord(lotId, (record) => ({
        ...record,
        events: [...record.events, lotEvent].sort((first, second) =>
          first.occurredAt.localeCompare(second.occurredAt),
        ),
      }));

      if (!saved) {
        if (evidenceFile) {
          await removeEvidenceFile(eventId);
        }
        setMessage("No se pudo guardar el evento en este navegador.");
        return;
      }

      setMessage(`Evento de ${type.toLowerCase()} agregado al historial.`);
      setDetails("");
      setEvidenceFile(null);
      if (evidenceInputRef.current) {
        evidenceInputRef.current.value = "";
      }
    } catch {
      setMessage("No se pudo procesar la evidencia en este navegador.");
    } finally {
      submissionInProgress.current = false;
      setIsSaving(false);
    }
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-muted">Primero registra un lote para poder agregar eventos.</p>
    );
  }

  return (
    <section aria-labelledby="event-form-title" className="max-w-2xl">
      <h2 id="event-form-title" className="font-display text-2xl font-medium text-ink">
        Registrar evento de cadena
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Identifica el lote, el hito y quién lo reporta. La fecha del evento y la fecha de captura se
        guardan por separado.
      </p>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submitEvent}>
        <div className="grid gap-1.5">
          <label htmlFor="event-lot" className="text-sm font-semibold text-ink">
            Lote
          </label>
          <select
            id="event-lot"
            required
            value={lotId}
            onChange={(event) => setLotId(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {record.product} · {record.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="event-type" className="text-sm font-semibold text-ink">
            Tipo de evento
          </label>
          <select
            id="event-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {eventTypes.map((eventType) => (
              <option key={eventType}>{eventType}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="event-time" className="text-sm font-semibold text-ink">
            Fecha y hora del evento
          </label>
          <input
            id="event-time"
            type="datetime-local"
            required
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-sm font-semibold text-ink">Responsable</span>
          <span className="flex min-h-11 items-center rounded-md border border-line bg-paper px-3 text-sm text-ink">
            {actorName} · {organization}
          </span>
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="event-details" className="text-sm font-semibold text-ink">
            Detalle del evento
          </label>
          <textarea
            id="event-details"
            required
            maxLength={500}
            rows={3}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            placeholder="Describe brevemente qué ocurrió"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="event-evidence" className="text-sm font-semibold text-ink">
            Evidencia opcional (PDF o imagen, máximo 10 MB)
          </label>
          <input
            ref={evidenceInputRef}
            id="event-evidence"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
            className="min-h-11 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
          />
          <p className="mb-0 text-xs text-muted">
            El archivo y su huella se guardan solo en este navegador, no en Stellar.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          {isSaving ? "Guardando evento…" : "Agregar al historial"}
        </button>
      </form>
      <p className="mt-3 min-h-5 text-sm text-accent" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
