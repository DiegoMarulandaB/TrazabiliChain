import type { LotRecord } from "@/lib/lots/lot-storage";
import { roleLabels } from "@/components/organization-members/OrganizationMembers";
import { EvidenceFileLink } from "@/components/evidence-file/EvidenceFileLink";

type AuditEntry = {
  lot: LotRecord;
  event: LotRecord["events"][number];
};

function auditFindings({ lot, event }: AuditEntry) {
  const findings: string[] = [];
  if (event.occurredAt.slice(0, 10) < lot.originDate) {
    findings.push("La fecha del evento es anterior a la fecha declarada del lote.");
  }
  if (event.recordedAt < lot.createdAt) {
    findings.push("El evento figura capturado antes de la creación del lote.");
  }
  if (!event.actorName.trim() || !event.organization.trim()) {
    findings.push("Falta identificar al actor o la organización que reporta el evento.");
  }
  if (!event.actorRole) {
    findings.push("El rol del actor no está registrado en este evento.");
  }
  const duplicate = lot.events.some(
    (otherEvent) =>
      otherEvent.id !== event.id &&
      otherEvent.type === event.type &&
      otherEvent.occurredAt === event.occurredAt &&
      otherEvent.details.trim().toLocaleLowerCase("es") ===
        event.details.trim().toLocaleLowerCase("es"),
  );
  if (duplicate) {
    findings.push("Hay otro evento de este lote con tipo, fecha y detalle coincidentes.");
  }
  return findings;
}

export function AuditDashboard({ records }: { records: LotRecord[] }) {
  const entries: AuditEntry[] = records
    .flatMap((lot) => lot.events.map((event) => ({ lot, event })))
    .sort((first, second) => second.event.recordedAt.localeCompare(first.event.recordedAt));
  const findingsCount = entries.reduce((count, entry) => count + auditFindings(entry).length, 0);

  return (
    <section aria-labelledby="audit-title">
      <h2 id="audit-title" className="font-display text-2xl font-medium text-ink">
        Revisión de auditoría
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        Historial ordenado por momento de captura, con advertencias básicas de consistencia. Estas
        reglas no detectan fraude ni validan la veracidad de los datos.
      </p>
      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <span className="rounded-md border border-line bg-white px-3 py-2 text-ink">
          {records.length} lotes revisables
        </span>
        <span className="rounded-md border border-line bg-white px-3 py-2 text-ink">
          {entries.length} eventos
        </span>
        <span className="rounded-md border border-line bg-white px-3 py-2 text-ink">
          {findingsCount} alertas de consistencia
        </span>
      </div>
      <ol className="mt-5 grid gap-3">
        {entries.map(({ lot, event }) => {
          const findings = auditFindings({ lot, event });
          return (
            <li key={event.id} className="rounded-md border border-line bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="mb-1 font-semibold text-ink">
                    {event.type} · {lot.product}
                  </h3>
                  <p className="mb-0 text-sm text-muted">
                    {event.actorName} ·{" "}
                    {event.actorRole ? roleLabels[event.actorRole] : "Rol no registrado"} ·{" "}
                    {event.organization}
                  </p>
                </div>
                <time className="text-xs text-muted" dateTime={event.recordedAt}>
                  Capturado:{" "}
                  {new Intl.DateTimeFormat("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(event.recordedAt))}
                </time>
              </div>
              <p className="mt-3 mb-0 text-sm leading-6 text-ink">{event.details}</p>
              <p className="mt-2 mb-0 text-xs text-muted">
                Ocurrió:{" "}
                {new Intl.DateTimeFormat("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(event.occurredAt))}
              </p>
              {event.evidenceSha256 && (
                <p className="mt-2 mb-0 break-all font-mono text-[11px] text-muted">
                  SHA-256 de evidencia: {event.evidenceSha256}
                </p>
              )}
              {event.evidenceFileName && (
                <div className="mt-2">
                  <EvidenceFileLink evidenceId={event.id} fileName={event.evidenceFileName} />
                </div>
              )}
              {findings.length > 0 ? (
                <ul className="mt-3 grid gap-1 border-l-2 border-amber-600 pl-3 text-sm text-amber-900">
                  {findings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 mb-0 text-xs text-emerald-800">
                  Sin alertas de consistencia básicas.
                </p>
              )}
            </li>
          );
        })}
        {entries.length === 0 && (
          <li className="rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            Todavía no hay eventos para revisar.
          </li>
        )}
      </ol>
    </section>
  );
}
