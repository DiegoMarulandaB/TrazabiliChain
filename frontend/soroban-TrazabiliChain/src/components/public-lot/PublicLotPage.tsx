"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { roleLabels } from "@/components/organization-members/OrganizationMembers";
import { LotJourney } from "@/components/lot-journey/LotJourney";
import { LotSharing } from "@/components/lot-sharing/LotSharing";
import { LotCharacteristics } from "@/components/lot-characteristics/LotCharacteristics";
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
          {record.photoDataUrl && (
            <Image
              src={record.photoDataUrl}
              alt={`Imagen declarada del producto ${record.product}`}
              width={1200}
              height={900}
              unoptimized
              className="mb-6 aspect-4/3 w-full rounded-md border border-line object-cover"
            />
          )}
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
                <dd className="mt-2">
                  <LotCharacteristics value={record.characteristics} />
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
            <LotJourney record={record} />
          </section>
          <section
            className="mt-7 border-t border-line pt-5"
            aria-label="Código QR y opciones para compartir"
          >
            <LotSharing record={record} />
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
