"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
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
