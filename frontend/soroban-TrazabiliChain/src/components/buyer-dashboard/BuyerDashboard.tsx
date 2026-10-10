"use client";

import { useMemo, useState } from "react";
import { EvidenceFileLink } from "@/components/evidence-file/EvidenceFileLink";
import type { LotRecord } from "@/lib/lots/lot-storage";

export function BuyerDashboard({ records }: { records: LotRecord[] }) {
  const [query, setQuery] = useState("");
  const [declaredValidOnly, setDeclaredValidOnly] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return records.filter((record) => {
      const matchesText = [record.product, record.origin, record.organization].some((value) =>
        value.toLocaleLowerCase("es").includes(normalizedQuery),
      );
      const hasDeclaredCurrentCertificate = record.certificates.some(
        (certificate) =>
          certificate.issuedAt <= today &&
          (!certificate.validUntil || certificate.validUntil >= today),
      );
      return matchesText && (!declaredValidOnly || hasDeclaredCurrentCertificate);
    });
  }, [declaredValidOnly, query, records, today]);

  return (
    <section aria-labelledby="buyer-title">
      <h2 id="buyer-title" className="font-display text-2xl font-medium text-ink">
        Consulta de abastecimiento
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Filtra lotes y revisa las evidencias declaradas para respaldar la evaluación de compra.
      </p>
      <div className="mt-5 flex flex-wrap items-end gap-4">
        <div className="grid min-w-60 flex-1 gap-1.5">
          <label htmlFor="buyer-search" className="text-sm font-semibold text-ink">
            Buscar lote, origen u organización
          </label>
          <input
            id="buyer-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={declaredValidOnly}
            onChange={(event) => setDeclaredValidOnly(event.target.checked)}
            className="size-4 accent-accent"
          />
          Solo certificados con vigencia declarada actual
        </label>
      </div>
      <p className="mt-4 text-xs text-muted" aria-live="polite">
        {filteredRecords.length} de {records.length} lotes
      </p>
      <div className="mt-3 grid gap-3">
        {filteredRecords.map((record) => (
          <article key={record.id} className="rounded-md border border-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="mb-1 font-semibold text-ink">{record.product}</h3>
                <p className="mb-0 text-sm text-muted">
                  {record.origin} · {record.organization}
                </p>
              </div>
              <span className="text-xs text-muted">
                {record.certificates.length}{" "}
                {record.certificates.length === 1 ? "evidencia" : "evidencias"}
              </span>
            </div>
            {record.characteristics && (
              <p className="mt-3 mb-0 text-sm leading-6 text-ink">{record.characteristics}</p>
            )}
            {record.certificates.length > 0 && (
              <ul className="mt-4 grid gap-2 border-t border-line pt-3 text-sm">
                {record.certificates.map((certificate) => (
                  <li key={certificate.id}>
                    <span className="font-medium text-ink">{certificate.name}</span>
                    <span className="text-muted"> · Emisor declarado: {certificate.issuer}</span>
                    <span className="block text-xs text-muted">
                      Emisión: {certificate.issuedAt}; vence:{" "}
                      {certificate.validUntil || "sin fecha indicada"}
                    </span>
                    <span className="block break-all font-mono text-[11px] text-muted">
                      SHA-256: {certificate.evidenceSha256}
                    </span>
                    <span className="block text-xs text-muted">
                      Asociado por {certificate.recordedBy}; emisor declarado, no verificado.
                    </span>
                    <EvidenceFileLink
                      evidenceId={certificate.id}
                      fileName={certificate.evidenceFileName}
                    />
                  </li>
                ))}
              </ul>
            )}
            {record.events.length > 0 && (
              <ol
                className="mt-4 grid gap-2 border-t border-line pt-3"
                aria-label="Eventos del lote"
              >
                {record.events.map((event) => (
                  <li key={event.id} className="text-sm">
                    <p className="mb-1 font-medium text-ink">{event.type}</p>
                    <p className="mb-1 text-xs text-muted">
                      {new Intl.DateTimeFormat("es-CO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(event.occurredAt))}
                      {" · "}
                      {event.actorName} · {event.organization}
                    </p>
                    <p className="mb-1 text-sm text-ink">{event.details}</p>
                    {event.evidenceSha256 && (
                      <p className="mb-0 break-all font-mono text-[11px] text-muted">
                        SHA-256 de evidencia: {event.evidenceSha256}
                      </p>
                    )}
                    {event.evidenceFileName && (
                      <EvidenceFileLink evidenceId={event.id} fileName={event.evidenceFileName} />
                    )}
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 mb-0 text-xs text-muted">
              La asociación y el emisor son declaraciones de demo; no implican validación del
              certificado.
            </p>
          </article>
        ))}
        {filteredRecords.length === 0 && (
          <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            No hay lotes que coincidan con estos filtros.
          </p>
        )}
      </div>
    </section>
  );
}
