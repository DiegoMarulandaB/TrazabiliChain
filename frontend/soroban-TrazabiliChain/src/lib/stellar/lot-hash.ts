import type { LotRecord } from "@/lib/lots/lot-storage";

export async function getPublicLotHash(record: LotRecord) {
  const publicLotData = JSON.stringify({
    id: record.id,
    product: record.product,
    characteristics: record.characteristics,
    origin: record.origin,
    originDate: record.originDate,
    organization: record.organization,
    createdBy: "Responsable de la organización",
    createdByRole: record.createdByRole,
    isPublic: true,
    createdAt: record.createdAt,
    events: [...record.events]
      .sort((first, second) => first.occurredAt.localeCompare(second.occurredAt))
      .map((event) => ({
        id: event.id,
        type: event.type,
        occurredAt: event.occurredAt,
        recordedAt: event.recordedAt,
        actorRole: event.actorRole,
        organization: event.organization,
        details: event.details,
        evidenceSha256: event.evidenceSha256 ?? null,
      })),
    certificates: [...record.certificates]
      .sort((first, second) => first.recordedAt.localeCompare(second.recordedAt))
      .map((certificate) => ({
        id: certificate.id,
        name: certificate.name,
        issuer: certificate.issuer,
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        validUntil: certificate.validUntil,
        evidenceSha256: certificate.evidenceSha256,
        recordedByRole: certificate.recordedByRole,
        recordedByOrganization: certificate.recordedByOrganization,
        recordedAt: certificate.recordedAt,
      })),
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(publicLotData));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
