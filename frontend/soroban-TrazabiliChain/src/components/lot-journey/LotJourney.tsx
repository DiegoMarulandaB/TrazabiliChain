"use client";

import { useState } from "react";
import { roleLabels } from "@/components/organization-members/OrganizationMembers";
import type { DemoRole, LotRecord } from "@/lib/lots/lot-storage";
import { getLotEventCount, getLotEventHash } from "@/lib/stellar/read";
import { getPublicLotHash } from "@/lib/stellar/lot-hash";

type JourneyStep = {
  id: string;
  title: string;
  occurredAt: string;
  profile: DemoRole | null;
  organization: string;
  detail: string;
};

function formatJourneyDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function LotJourney({ record }: { record: LotRecord }) {
  const [isCheckingAnchor, setIsCheckingAnchor] = useState(false);
  const [anchorStatus, setAnchorStatus] = useState("");
  const [anchorError, setAnchorError] = useState(false);
  const steps: JourneyStep[] = [
    {
      id: `origin-${record.id}`,
      title: "Lote registrado",
      occurredAt: record.createdAt,
      profile: record.createdByRole ?? "producer",
      organization: record.createdByOrganization || record.organization,
      detail: `${record.product} · ${record.origin}`,
    },
    ...record.events.map((event) => ({
      id: `event-${event.id}`,
      title: event.type,
      occurredAt: event.occurredAt,
      profile: event.actorRole,
      organization: event.organization,
      detail: event.evidenceSha256
        ? `${event.details} · SHA-256 de evidencia: ${event.evidenceSha256}`
        : event.details,
    })),
    ...record.certificates.map((certificate) => ({
      id: `certificate-${certificate.id}`,
      title: `Certificado asociado · ${certificate.name}`,
      occurredAt: certificate.recordedAt,
      profile: certificate.recordedByRole,
      organization: certificate.recordedByOrganization,
      detail: `${certificate.issuer} · ${certificate.certificateNumber} · SHA-256: ${certificate.evidenceSha256}`,
    })),
  ].sort((first, second) => first.occurredAt.localeCompare(second.occurredAt));

  async function checkAnchor() {
    setIsCheckingAnchor(true);
    setAnchorStatus("");
    setAnchorError(false);
    try {
      const eventCount = await getLotEventCount(record.id);
      if (eventCount === 0) {
        setAnchorStatus("Todavía no hay una huella de este lote en Stellar Testnet.");
        return;
      }

      const latestHash = await getLotEventHash(record.id, eventCount - 1);
      if (!latestHash) {
        setAnchorError(true);
        setAnchorStatus("Stellar no devolvió la última huella.");
        return;
      }

      const currentHash = await getPublicLotHash(record);
      setAnchorStatus(
        latestHash === currentHash
          ? `La última huella coincide con la información actual. Anclajes: ${eventCount}. Hash: ${latestHash}`
          : `Existe un anclaje anterior, pero no coincide con la información actual. Anclajes: ${eventCount}. Último hash: ${latestHash}`,
      );
    } catch (error) {
      setAnchorError(true);
      setAnchorStatus(
        error instanceof Error ? error.message : "No se pudo consultar Stellar Testnet.",
      );
    } finally {
      setIsCheckingAnchor(false);
    }
  }

  return (
    <section className="mt-4 border-t border-line pt-4" aria-label="Recorrido del lote">
      <h4 className="mb-3 text-sm font-semibold text-ink">Etapas del lote</h4>
      <ol className="grid gap-3 border-l border-line pl-4">
        {steps.map((step) => (
          <li key={step.id} className="relative min-w-0">
            <span
              className="absolute left-[-1.32rem] top-1.5 size-2 rounded-full bg-accent"
              aria-hidden="true"
            />
            <p className="mb-1 text-sm font-medium text-ink">{step.title}</p>
            <p className="mb-1 text-xs text-gray-700">
              {formatJourneyDate(step.occurredAt)} ·{" "}
              {step.profile ? roleLabels[step.profile] : "Perfil no registrado"} ·{" "}
              {step.organization}
            </p>
            <p className="mb-0 wrap-break-word text-sm leading-5 text-ink">{step.detail}</p>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => void checkAnchor()}
        disabled={isCheckingAnchor}
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-paper disabled:cursor-wait disabled:opacity-60"
      >
        {isCheckingAnchor ? "Consultando Testnet…" : "Consultar anclaje en Testnet"}
      </button>
      {anchorStatus && (
        <p
          className={`mt-2 mb-0 break-all text-xs leading-5 ${anchorError ? "text-red-800" : "text-gray-700"}`}
          role={anchorError ? "alert" : "status"}
          aria-live={anchorError ? "assertive" : "polite"}
        >
          {anchorStatus}
        </p>
      )}
    </section>
  );
}
