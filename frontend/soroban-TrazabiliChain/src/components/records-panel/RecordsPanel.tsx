"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState, type FormEvent } from "react";
import { LotSharing } from "@/components/lot-sharing/LotSharing";
import { EventForm } from "@/components/event-form/EventForm";
import { CertificateForm } from "@/components/certificate-form/CertificateForm";
import {
  OrganizationMembers,
  roleLabels,
} from "@/components/organization-members/OrganizationMembers";
import { BuyerDashboard } from "@/components/buyer-dashboard/BuyerDashboard";
import { AuditDashboard } from "@/components/audit-dashboard/AuditDashboard";
import { ConsumerScanner } from "@/components/consumer-scanner/ConsumerScanner";
import { EvidenceFileLink } from "@/components/evidence-file/EvidenceFileLink";
import {
  demoRoles,
  saveLotRecord,
  useLotRecords,
  type DemoRole,
  type LotRecord,
} from "@/lib/lots/lot-storage";

gsap.registerPlugin(useGSAP);

type LotForm = Omit<LotRecord, "id" | "createdAt" | "events" | "certificates">;

const initialForm: LotForm = {
  product: "",
  characteristics: "",
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
  const [role, setRole] = useState<DemoRole>("producer");
  const [actorName, setActorName] = useState("Usuario de demostración");
  const [activeOrganization, setActiveOrganization] = useState("Organización de demostración");
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
    if (role !== "producer") {
      setAnnouncement("El perfil seleccionado no puede crear lotes en este flujo de demo.");
      return;
    }

    const record: LotRecord = {
      ...form,
      organization: form.organization.trim(),
      id: window.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      events: [],
      certificates: [],
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

      <section
        aria-labelledby="demo-profile-title"
        className="my-6 grid gap-4 border-l-2 border-amber-600 bg-amber-50 px-4 py-4 sm:grid-cols-3 sm:items-end"
      >
        <div className="sm:col-span-3">
          <h2 id="demo-profile-title" className="mb-1 text-sm font-semibold text-amber-950">
            Perfil del flujo de demostración
          </h2>
          <p className="mb-0 text-xs leading-5 text-amber-950">
            Cambiar el rol solo modifica la interfaz; no autentica al usuario ni protege los datos.
          </p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="workflow-role" className="text-xs font-semibold text-ink">
            Rol
          </label>
          <select
            id="workflow-role"
            value={role}
            onChange={(event) => setRole(event.target.value as DemoRole)}
            className="min-h-10 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {demoRoles.map((demoRole) => (
              <option key={demoRole} value={demoRole}>
                {roleLabels[demoRole]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="demo-actor" className="text-xs font-semibold text-ink">
            Actor declarado
          </label>
          <input
            id="demo-actor"
            required
            maxLength={100}
            value={actorName}
            onChange={(event) => setActorName(event.target.value)}
            className="min-h-10 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="demo-organization" className="text-xs font-semibold text-ink">
            Organización declarada
          </label>
          <input
            id="demo-organization"
            required
            maxLength={120}
            value={activeOrganization}
            onChange={(event) => setActiveOrganization(event.target.value)}
            className="min-h-10 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
      </section>

      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:py-10">
        {role === "producer" && (
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
                <label htmlFor="characteristics" className="text-sm font-semibold text-ink">
                  Características del lote
                </label>
                <textarea
                  id="characteristics"
                  name="characteristics"
                  required
                  maxLength={1000}
                  rows={3}
                  value={form.characteristics}
                  onChange={(event) => updateField("characteristics", event.target.value)}
                  className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                  placeholder="Variedad, cosecha, calidad u otros datos del producto"
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
              de sesión ni permisos reales. No registres información sensible; los enlaces
              compartidos no se resolverán en otros dispositivos.
            </p>
            {storageError && (
              <p className="mt-2 mb-0 text-sm text-red-800" role="alert">
                No se pudo guardar el lote. Revisa el espacio disponible del navegador e inténtalo
                de nuevo.
              </p>
            )}
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {announcement}
            </p>
          </section>
        )}

        {role === "supplyActor" && (
          <section data-enter className="lg:col-span-2">
            <EventForm
              records={records}
              actorName={actorName}
              actorRole={role}
              organization={activeOrganization}
            />
          </section>
        )}
        {role === "certifier" && (
          <section data-enter className="lg:col-span-2">
            <CertificateForm
              records={records}
              actorName={actorName}
              actorRole={role}
              organization={activeOrganization}
            />
          </section>
        )}
        {role === "organizationAdmin" && (
          <section data-enter className="lg:col-span-2">
            <OrganizationMembers />
          </section>
        )}
        {role === "b2bBuyer" && (
          <section data-enter className="lg:col-span-2">
            <BuyerDashboard records={records} />
          </section>
        )}
        {role === "auditor" && (
          <section data-enter className="lg:col-span-2">
            <AuditDashboard records={records} />
          </section>
        )}
        {role === "consumer" && (
          <section data-enter className="lg:col-span-2">
            <ConsumerScanner />
          </section>
        )}

        {role !== "consumer" && role !== "b2bBuyer" && role !== "auditor" && (
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
                        {record.characteristics && (
                          <p className="mb-2 max-w-prose text-sm leading-5 text-ink">
                            {record.characteristics}
                          </p>
                        )}
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
                          <time dateTime={record.createdAt}>
                            {formatCreatedAt(record.createdAt)}
                          </time>
                        </dd>
                      </div>
                    </dl>
                    {record.events.length > 0 && (
                      <section
                        className="mt-4 border-t border-line pt-4"
                        aria-label="Eventos del lote"
                      >
                        <h4 className="mb-3 text-sm font-semibold text-ink">
                          Historial de eventos
                        </h4>
                        <ol className="grid gap-3 border-l border-line pl-4">
                          {record.events.map((lotEvent) => (
                            <li key={lotEvent.id} className="relative">
                              <span
                                className="absolute -left-[1.32rem] top-1.5 size-2 rounded-full bg-accent"
                                aria-hidden="true"
                              />
                              <p className="mb-1 text-sm font-medium text-ink">{lotEvent.type}</p>
                              <p className="mb-1 text-xs text-muted">
                                {new Intl.DateTimeFormat("es-CO", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(lotEvent.occurredAt))}
                                {" · "}
                                {lotEvent.actorName} · {lotEvent.organization}
                              </p>
                              <p className="mb-0 text-sm leading-5 text-ink">{lotEvent.details}</p>
                              {lotEvent.evidenceFileName && (
                                <div className="mt-2">
                                  <EvidenceFileLink
                                    evidenceId={lotEvent.id}
                                    fileName={lotEvent.evidenceFileName}
                                  />
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      </section>
                    )}
                    {record.certificates.length > 0 && (
                      <section
                        className="mt-4 border-t border-line pt-4"
                        aria-label="Certificados asociados"
                      >
                        <h4 className="mb-2 text-sm font-semibold text-ink">
                          Certificados asociados
                        </h4>
                        <ul className="grid gap-3">
                          {record.certificates.map((certificate) => (
                            <li key={certificate.id} className="text-sm">
                              <p className="mb-1 font-medium text-ink">{certificate.name}</p>
                              <p className="mb-1 text-xs text-muted">
                                Emisor declarado: {certificate.issuer} ·{" "}
                                {certificate.certificateNumber}
                              </p>
                              <p className="mb-1 break-all font-mono text-[11px] text-muted">
                                SHA-256: {certificate.evidenceSha256}
                              </p>
                              <p className="mb-2 text-xs text-muted">
                                Asociado por {certificate.recordedBy} ·{" "}
                                {certificate.recordedByRole
                                  ? roleLabels[certificate.recordedByRole]
                                  : "rol no registrado"}
                              </p>
                              <EvidenceFileLink
                                evidenceId={certificate.id}
                                fileName={certificate.evidenceFileName}
                              />
                              <p className="mb-0 text-xs text-muted">
                                Asociado como evidencia; no implica que el emisor o certificado haya
                                sido validado.
                              </p>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    <LotSharing record={record} />
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
