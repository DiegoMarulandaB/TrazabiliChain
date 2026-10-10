"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState, type FormEvent } from "react";
import { LotSharing } from "@/components/lot-sharing/LotSharing";
import { saveLotRecord, useLotRecords, type LotRecord } from "@/lib/lots/lot-storage";

gsap.registerPlugin(useGSAP);

type LotForm = Omit<LotRecord, "id" | "createdAt">;

const initialForm: LotForm = {
  product: "",
  origin: "",
  originDate: "",
  organization: "",
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecordsPanel() {
  const records = useLotRecords();
  const [form, setForm] = useState<LotForm>(initialForm);
  const [newRecordId, setNewRecordId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [storageError, setStorageError] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const recordElements = useRef<Record<string, HTMLLIElement | null>>({});

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-enter]",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" },
        );
      });
      return () => media.revert();
    },
    { scope: panelRef },
  );

  useGSAP(
    () => {
      if (!newRecordId) {
        return;
      }

      const recordElement = recordElements.current[newRecordId];
      if (!recordElement) {
        return;
      }

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          recordElement,
          { autoAlpha: 0, y: 16, scale: 0.985 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" },
        );
      });
      return () => media.revert();
    },
    { dependencies: [newRecordId], scope: panelRef, revertOnUpdate: true },
  );

  function updateField(field: keyof LotForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const record: LotRecord = {
      ...form,
      id: window.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (!saveLotRecord(record)) {
      setStorageError(true);
      setAnnouncement("No se pudo guardar el lote en este navegador.");
      return;
    }

    setStorageError(false);
    setNewRecordId(record.id);
    setAnnouncement(`Registro de ${record.product} creado: ${formatCreatedAt(record.createdAt)}`);
    setForm(initialForm);
  }

  return (
    <section ref={panelRef} id="registro" aria-labelledby="page-title" className="scroll-mt-8">
      <div
        data-enter
        className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5"
      >
        <div>
          <p className="mb-2.5 text-[11px] font-bold text-accent">TRAZABILIDAD DE LOTES</p>
          <h1
            id="page-title"
            className="font-display text-[30px] font-medium text-ink sm:text-[34px]"
          >
            Registros
          </h1>
        </div>
        <span className="pb-1 text-xs text-muted" aria-live="polite">
          {records.length} {records.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:py-10">
        <section data-enter aria-labelledby="create-record-title">
          <div className="mb-5">
            <h2
              id="create-record-title"
              className="mb-2 font-display text-2xl font-medium text-ink"
            >
              Registrar un lote
            </h2>
            <p className="mb-0 text-sm leading-6 text-muted">
              Añade los datos de origen y la organización responsable.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={createRecord}>
            <div className="grid gap-1.5">
              <label htmlFor="product" className="text-sm font-semibold text-ink">
                Producto o lote
              </label>
              <input
                id="product"
                name="product"
                autoComplete="off"
                required
                maxLength={100}
                value={form.product}
                onChange={(event) => updateField("product", event.target.value)}
                className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-muted focus-visible:border-accent focus-visible:outline-accent"
                placeholder="Café en grano"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="origin" className="text-sm font-semibold text-ink">
                Ubicación de origen
              </label>
              <input
                id="origin"
                name="origin"
                autoComplete="off"
                required
                maxLength={160}
                value={form.origin}
                onChange={(event) => updateField("origin", event.target.value)}
                className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-muted focus-visible:border-accent focus-visible:outline-accent"
                placeholder="Finca, municipio, país"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid content-start gap-1.5">
                <label htmlFor="origin-date" className="text-sm font-semibold text-ink">
                  Fecha del lote
                </label>
                <input
                  id="origin-date"
                  name="originDate"
                  type="date"
                  required
                  value={form.originDate}
                  onChange={(event) => updateField("originDate", event.target.value)}
                  className="date-input min-h-11 min-w-0 cursor-pointer rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:border-accent focus-visible:outline-accent"
                />
              </div>

              <div className="grid content-start gap-1.5">
                <label htmlFor="organization" className="text-sm font-semibold text-ink">
                  Organización responsable
                </label>
                <input
                  id="organization"
                  name="organization"
                  autoComplete="organization"
                  required
                  maxLength={100}
                  value={form.organization}
                  onChange={(event) => updateField("organization", event.target.value)}
                  className="min-h-11 min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-muted focus-visible:border-accent focus-visible:outline-accent"
                  placeholder="Nombre de la organización"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 min-h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-[#125746] focus-visible:outline-offset-2"
            >
              Crear registro
            </button>
          </form>

          <p className="mt-4 mb-0 text-xs leading-5 text-muted">
            Modo de demostración local: los datos se guardan solo en este navegador. No hay inicio
            de sesión ni permisos reales. No registres información sensible; los enlaces compartidos
            no se resolverán en otros dispositivos.
          </p>
          {storageError && (
            <p className="mt-2 mb-0 text-sm text-red-800" role="alert">
              No se pudo guardar el lote. Revisa el espacio disponible del navegador e inténtalo de
              nuevo.
            </p>
          )}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </p>
        </section>

        <section data-enter aria-labelledby="records-list-title">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="mb-1 text-[11px] font-bold text-accent">HISTORIAL</p>
              <h2
                id="records-list-title"
                className="mb-0 font-display text-2xl font-medium text-ink"
              >
                Lotes registrados
              </h2>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
              <span
                className="mb-3 grid size-10 place-items-center rounded-full border border-[#bdd7cc] bg-accent-soft text-lg text-accent"
                aria-hidden="true"
              >
                —
              </span>
              <p className="mb-1 font-medium text-ink">Aún no hay lotes</p>
              <p className="mb-0 text-sm text-muted">
                El primer registro aparecerá en este historial.
              </p>
            </div>
          ) : (
            <ol className="grid gap-3" aria-label="Historial de lotes registrados">
              {records.map((record) => (
                <li
                  key={record.id}
                  ref={(element) => {
                    recordElements.current[record.id] = element;
                  }}
                  data-record-id={record.id}
                  className="rounded-md border border-line bg-white p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="mb-1 font-semibold text-ink">{record.product}</h3>
                      <p className="mb-0 text-sm text-muted">{record.origin}</p>
                    </div>
                    <span className="rounded bg-accent-soft px-2 py-1 text-xs font-medium text-accent">
                      Lote
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-x-4 gap-y-3 border-t border-line pt-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted">Fecha del lote</dt>
                      <dd className="mt-1 mb-0 text-ink">
                        <time dateTime={record.originDate}>
                          {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
                            new Date(`${record.originDate}T12:00:00`),
                          )}
                        </time>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Organización responsable</dt>
                      <dd className="mt-1 mb-0 text-ink">{record.organization}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-muted">Creado</dt>
                      <dd className="mt-1 mb-0 text-ink">
                        <time dateTime={record.createdAt}>{formatCreatedAt(record.createdAt)}</time>
                      </dd>
                    </div>
                  </dl>
                  <LotSharing record={record} />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}
