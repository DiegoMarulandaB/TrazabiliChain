"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { getLotEventCount, getLotEventHash } from "@/lib/stellar/read";
import { anchorLotHash } from "@/lib/stellar/write";
import type { LotRecord } from "@/lib/lots/lot-storage";

type AnchorResult = {
  transactionHash: string;
  feeXlm: string;
};

export function useLotAnchor(record: LotRecord) {
  const { address, signTransaction } = useStellarWallet();
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [result, setResult] = useState<AnchorResult | null>(null);

  async function anchor() {
    if (!address) {
      toast.error("Conecta una wallet de Stellar para registrar la huella.");
      return;
    }

    const toastId = toast.loading("Comprobando el lote en Stellar Testnet…");
    setIsAnchoring(true);
    setResult(null);

    try {
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
      const hash = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");

      const eventCount = await getLotEventCount(record.id);
      if (eventCount > 0) {
        const latestHash = await getLotEventHash(record.id, eventCount - 1);
        if (latestHash === hash) {
          toast.info("La huella más reciente ya coincide con esta ficha.", { id: toastId });
          return;
        }
      }

      const transaction = await anchorLotHash(address, record.id, hash, signTransaction);

      setResult({ transactionHash: transaction.transactionHash, feeXlm: transaction.feeXlm });
      toast.success("Huella confirmada en Stellar Testnet.", {
        id: toastId,
        description: `Tarifa de red: ${transaction.feeXlm} XLM`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la huella.", {
        id: toastId,
      });
    } finally {
      setIsAnchoring(false);
    }
  }

  return { anchor, isAnchoring, result };
}
