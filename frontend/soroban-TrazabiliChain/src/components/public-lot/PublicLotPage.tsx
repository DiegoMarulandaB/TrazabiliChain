"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { EvidenceFileLink } from "@/components/evidence-file/EvidenceFileLink";
import { roleLabels } from "@/components/organization-members/OrganizationMembers";
import { useLotRecords } from "@/lib/lots/lot-storage";

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
  const records = useLotRecords();
  const record = records.find((item) => item.id === id);

  return (
    <main className="mx-auto min-h-svh w-[min(100%-2.5rem,48rem)] py-12 sm:py-20">
      <Link href="/" className="text-sm font-semibold text-accent underline underline-offset-4">
        Volver a TrazabiliChain
      </Link>

      {!hydrated ? (
        <p className="mt-10 text-sm text-muted" role="status">
          Consultando registro local…
        </p>
      ) : record ? (
        <article className="mt-8 rounded-md border border-line bg-white p-5 sm:p-8">
          <p className="mb-2 text-[11px] font-bold text-accent">REGISTRO DE DEMOSTRACIÓN</p>
          <h1 className="mb-6 font-display text-3xl font-medium text-ink">{record.product}</h1>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Identificador del lote</dt>
              <dd className="mt-1 break-all font-mono text-sm text-ink">{record.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Origen</dt>
              <dd className="mt-1 text-sm text-ink">{record.origin}</dd>
            </div>
            {record.characteristics && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">Características del lote</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
                  {record.characteristics}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted">Fecha del lote</dt>
              <dd className="mt-1 text-sm text-ink">
                <time dateTime={record.originDate}>{formatDate(record.originDate)}</time>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Organización responsable</dt>
              <dd className="mt-1 text-sm text-ink">{record.organization}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Creado</dt>
              <dd className="mt-1 text-sm text-ink">
                <time dateTime={record.createdAt}>{formatDate(record.createdAt, true)}</time>
              </dd>
            </div>
          </dl>
          <section className="mt-7 border-t border-line pt-5" aria-labelledby="public-events-title">
            <h2 id="public-events-title" className="font-display text-xl font-medium text-ink">
              Recorrido registrado
            </h2>
            {record.events.length > 0 ? (
              <ol className="mt-4 grid gap-4 border-l border-line pl-5">
                {record.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      className="absolute -left-[1.38rem] top-1.5 size-2 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <h3 className="mb-1 text-sm font-semibold text-ink">{event.type}</h3>
                    <p className="mb-1 text-xs text-muted">
                      <time dateTime={event.occurredAt}>{formatDate(event.occurredAt, true)}</time>
                      {" · "}
                      {event.actorName} · {event.organization}
                    </p>
                    <p className="mb-0 text-sm leading-6 text-ink">{event.details}</p>
                    {event.evidenceFileName && (
                      <div className="mt-2">
                        <EvidenceFileLink evidenceId={event.id} fileName={event.evidenceFileName} />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 mb-0 text-sm text-muted">
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
                        <dt className="text-xs text-muted">Emisor declarado</dt>
                        <dd className="mt-1 mb-0 text-ink">{certificate.issuer}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Número</dt>
                        <dd className="mt-1 mb-0 text-ink">{certificate.certificateNumber}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Vigencia declarada</dt>
                        <dd className="mt-1 mb-0 text-ink">
                          {certificate.validUntil
                            ? formatDate(certificate.validUntil)
                            : "Sin fecha de vencimiento indicada"}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-muted">Huella SHA-256 del archivo</dt>
                        <dd className="mt-1 mb-0 break-all font-mono text-xs text-ink">
                          {certificate.evidenceSha256}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-muted">Asociado por</dt>
                        <dd className="mt-1 mb-0 text-sm text-ink">
                          {certificate.recordedBy} ·{" "}
                          {certificate.recordedByRole
                            ? roleLabels[certificate.recordedByRole]
                            : "rol no registrado"}{" "}
                          · {certificate.recordedByOrganization}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="sr-only">Documento de evidencia</dt>
                        <dd className="m-0">
                          <EvidenceFileLink
                            evidenceId={certificate.id}
                            fileName={certificate.evidenceFileName}
                          />
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 mb-0 text-xs leading-5 text-muted">
                      Documento y emisor declarados por el usuario; no han sido verificados por la
                      plataforma.
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 mb-0 text-sm text-muted">
                No se han asociado certificados a este lote.
              </p>
            )}
          </section>
          <p className="mt-7 mb-0 border-t border-line pt-4 text-xs leading-5 text-muted">
            Vista local de demostración. Estos datos no se han verificado ni anclado en Stellar y
            solo están disponibles en el navegador donde se creó el lote.
          </p>
        </article>
      ) : (
        <section className="mt-8 border-t border-line pt-8" aria-labelledby="not-found-title">
          <h1 id="not-found-title" className="font-display text-3xl font-medium text-ink">
            Registro no disponible
          </h1>
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
            Este enlace apunta a un identificador de demostración que no está guardado en este
            navegador. Los enlaces compartidos entre dispositivos requieren un backend persistente.
          </p>
        </section>
      )}
    </main>
  );
}
