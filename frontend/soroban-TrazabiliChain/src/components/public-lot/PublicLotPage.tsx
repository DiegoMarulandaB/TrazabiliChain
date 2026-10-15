"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { roleLabels } from "@/components/organization-members/OrganizationMembers";
import { getPublicLotRecord, type LotRecord } from "@/lib/lots/lot-storage";

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function formatDate(value: string, withTime = false) {
  const dateValue = withTime ? value : `${value}T12:00:00`;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(dateValue));
}

export function PublicLotPage({ id }: { id: string }) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot,
  );
  const [loadedRecord, setLoadedRecord] = useState<{
    id: string;
    record: LotRecord | null;
  } | null>(null);
  const isLoading = loadedRecord?.id !== id;
  const record = loadedRecord?.id === id ? loadedRecord.record : null;
  const displayedEvents = record?.events.slice(0, 5) ?? [];

  useEffect(() => {
    let isMounted = true;
    void getPublicLotRecord(id).then((publicRecord) => {
      if (isMounted) {
        setLoadedRecord({ id, record: publicRecord });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <main className="mx-auto min-h-svh w-[min(100%-2.5rem,48rem)] py-12 sm:py-20">
      <Link href="/" className="text-sm font-semibold text-accent underline underline-offset-4">
        Volver a TrazabiliChain
      </Link>

      {!hydrated || isLoading ? (
        <p className="mt-10 text-sm text-gray-700" role="status">
          Consultando ficha pública…
        </p>
      ) : record ? (
        <article className="mt-8 rounded-md border border-line bg-white p-5 sm:p-8">
          <p className="mb-2 text-[11px] font-bold text-accent">FICHA PÚBLICA · DATOS DECLARADOS</p>
          <h1 className="mb-6 font-display text-3xl font-medium text-ink">{record.product}</h1>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-gray-700">Identificador del lote</dt>
              <dd className="mt-1 break-all font-mono text-sm text-ink">{record.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-700 ">Origen</dt>
              <dd className="mt-1 text-sm text-ink">{record.origin}</dd>
            </div>
            {record.characteristics && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-gray-700">Características del lote</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
                  {record.characteristics}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-700">Fecha del lote</dt>
              <dd className="mt-1 text-sm text-ink">
                <time dateTime={record.originDate}>{formatDate(record.originDate)}</time>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-700">Organización responsable</dt>
              <dd className="mt-1 text-sm text-ink">{record.organization}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-700">Registrado por</dt>
              <dd className="mt-1 text-sm text-ink">
                {record.createdByRole ? roleLabels[record.createdByRole] : record.createdBy}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-700">Creado</dt>
              <dd className="mt-1 text-sm text-ink">
                <time dateTime={record.createdAt}>{formatDate(record.createdAt, true)}</time>
              </dd>
            </div>
          </dl>
          <section className="mt-7 border-t border-line pt-5" aria-labelledby="public-events-title">
            <h2 id="public-events-title" className="font-display text-xl font-medium text-ink">
              Recorrido registrado
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <svg
                viewBox="0 0 320 40"
                className="h-10 w-full max-w-md text-accent"
                role="img"
                aria-label={`Trazabilidad visual: origen, ${record.events.length} eventos y consulta pública`}
              >
                <path d="M16 20H304" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="16" cy="20" r="7" fill="currentColor" />
                {displayedEvents.map((event, index) => (
                  <circle
                    key={event.id}
                    cx={16 + ((index + 1) * 288) / (displayedEvents.length + 1)}
                    cy="20"
                    r="5"
                    fill="currentColor"
                  />
                ))}
                <circle cx="304" cy="20" r="7" fill="currentColor" />
              </svg>
              <span className="shrink-0 text-xs text-gray-700">
                {record.events.length} {record.events.length === 1 ? "evento" : "eventos"}
              </span>
            </div>
            {record.events.length > 0 ? (
              <ol className="mt-4 grid gap-4 border-l border-line pl-5">
                {record.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      className="absolute left-[1.38rem] top-1.5 size-2 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <h3 className="mb-1 text-sm font-semibold text-ink">{event.type}</h3>
                    <p className="mb-1 text-xs text-gray-700">
                      <time dateTime={event.occurredAt}>{formatDate(event.occurredAt, true)}</time>
                      {" · "}
                      {event.actorRole ? roleLabels[event.actorRole] : "Actor declarado"} ·{" "}
                      {event.organization}
                    </p>
                    <p className="mb-0 text-sm leading-6 text-ink">{event.details}</p>
                    {event.evidenceSha256 && (
                      <p className="mt-2 mb-0 break-all font-mono text-xs text-gray-700">
                        SHA-256 de evidencia: {event.evidenceSha256}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 mb-0 text-sm text-gray-700">
                Aún no hay eventos asociados a este lote.
              </p>
            )}
          </section>
          <section
            className="mt-7 border-t border-line pt-5"
            aria-labelledby="public-certificates-title"
          >
            <h2
              id="public-certificates-title"
              className="font-display text-xl font-medium text-ink"
            >
              Certificados y evidencias
            </h2>
            {record.certificates.length > 0 ? (
              <ul className="mt-4 grid gap-4">
                {record.certificates.map((certificate) => (
                  <li key={certificate.id} className="rounded-md border border-line p-4">
                    <h3 className="mb-2 text-sm font-semibold text-ink">{certificate.name}</h3>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-gray-700">Emisor declarado</dt>
                        <dd className="mt-1 mb-0 text-ink">{certificate.issuer}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-700">Número</dt>
                        <dd className="mt-1 mb-0 text-ink">{certificate.certificateNumber}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-700">Vigencia declarada</dt>
                        <dd className="mt-1 mb-0 text-ink">
                          {certificate.validUntil
                            ? formatDate(certificate.validUntil)
                            : "Sin fecha de vencimiento indicada"}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-gray-700">Huella SHA-256 del archivo</dt>
                        <dd className="mt-1 mb-0 break-all font-mono text-xs text-ink">
                          {certificate.evidenceSha256}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-gray-700">Asociado por</dt>
                        <dd className="mt-1 mb-0 text-sm text-ink">
                          {certificate.recordedByRole
                            ? roleLabels[certificate.recordedByRole]
                            : "certificador declarado"}{" "}
                          · {certificate.recordedByOrganization}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 mb-0 text-xs leading-5 text-gray-700">
                      Documento y emisor declarados por el usuario; no han sido verificados por la
                      plataforma.
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 mb-0 text-sm text-gray-700">
                No se han asociado certificados a este lote.
              </p>
            )}
          </section>
          <p className="mt-7 mb-0 border-t border-line pt-4 text-xs leading-5 text-gray-700">
            Los datos y certificados son declaraciones de sus autores. La ficha se comparte desde
            Supabase; los archivos de evidencia no se publican. La huella en Stellar, si existe, no
            confirma que la información de origen sea verdadera.
          </p>
        </article>
      ) : (
        <section className="mt-8 border-t border-line pt-8" aria-labelledby="not-found-title">
          <h1 id="not-found-title" className="font-display text-3xl font-medium text-ink">
            Registro no disponible
          </h1>
          <p className="mt-3 max-w-prose text-sm leading-6 text-gray-700">
            No se encontró una ficha pública para este identificador. Puede ser privada o no
            existir.
          </p>
        </section>
      )}
    </main>
  );
}
