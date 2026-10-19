"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { getLotEventCount, getLotEventHash } from "@/lib/stellar/read";
import { anchorLotHash, getTraceabilityContractAdmin } from "@/lib/stellar/write";
import { getPublicLotHash } from "@/lib/stellar/lot-hash";
import { notifyOwnerOfLotAnchor } from "@/lib/lots/anchor-notifications";
import type { LotRecord } from "@/lib/lots/lot-storage";
import { stellarNetwork } from "@/lib/stellar/network";

type AnchorResult = {
  transactionHash: string;
  feeXlm: string;
};

type AnchorStatus = {
  record: LotRecord;
  message: string;
  latestHash?: string;
  isError?: boolean;
};

export function useLotAnchor(
  record: LotRecord,
  { notifyProducer = false }: { notifyProducer?: boolean } = {},
) {
  const { address, signTransaction } = useStellarWallet();
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [isCheckingAnchor, setIsCheckingAnchor] = useState(false);
  const [result, setResult] = useState<AnchorResult | null>(null);
  const [anchorStatus, setAnchorStatus] = useState<AnchorStatus | null>(null);

  async function checkAnchor() {
    setIsCheckingAnchor(true);
    setAnchorStatus(null);
    try {
      const eventCount = await getLotEventCount(record.id);
      if (eventCount === 0) {
        setAnchorStatus({
          record,
          message: "No hay una huella registrada en Stellar para este lote.",
        });
        return;
      }

      const latestHash = await getLotEventHash(record.id, eventCount - 1);
      if (!latestHash) {
        setAnchorStatus({
          record,
          message: "Stellar no devolvió la última huella del lote.",
          isError: true,
        });
        return;
      }

      const currentHash = await getPublicLotHash(record);
      setAnchorStatus({
        record,
        latestHash,
        message:
          latestHash === currentHash
            ? `La última huella coincide con la ficha actual. Anclajes registrados: ${eventCount}.`
            : `Hay una huella anterior, pero no coincide con la ficha actual. Anclajes registrados: ${eventCount}.`,
      });
    } catch (error) {
      setAnchorStatus({
        record,
        message:
          error instanceof Error
            ? error.message
            : `No se pudo consultar el contrato en Stellar ${stellarNetwork.label}.`,
        isError: true,
      });
    } finally {
      setIsCheckingAnchor(false);
    }
  }

  async function anchor() {
    if (!address) {
      toast.error("Conecta una wallet de Stellar para registrar la huella.");
      return;
    }

    const toastId = toast.loading(`Comprobando el lote en Stellar ${stellarNetwork.label}…`);
    setIsAnchoring(true);
    setResult(null);

    try {
      const hash = await getPublicLotHash(record);

      const eventCount = await getLotEventCount(record.id);
      if (eventCount > 0) {
        const latestHash = await getLotEventHash(record.id, eventCount - 1);
        if (latestHash === hash) {
          setAnchorStatus({
            record,
            latestHash,
            message: `La última huella ya coincide con la ficha actual. Anclajes registrados: ${eventCount}.`,
          });
          toast.info("La huella más reciente ya coincide con esta ficha.", { id: toastId });
          return;
        }
      }

      const transaction = await anchorLotHash(address, record.id, hash, signTransaction);

      setResult({ transactionHash: transaction.transactionHash, feeXlm: transaction.feeXlm });
      let producerNotified: boolean | undefined;
      if (notifyProducer) {
        try {
          const contractAdmin = await getTraceabilityContractAdmin();
          if (contractAdmin === address) {
            producerNotified = await notifyOwnerOfLotAnchor(record.id, transaction.transactionHash);
          }
        } catch {
          producerNotified = false;
        }
      }
      await checkAnchor();
      toast.success(`Huella confirmada en Stellar ${stellarNetwork.label}.`, {
        id: toastId,
        description: notifyProducer
          ? producerNotified
            ? `El Productor recibirá un aviso. Tarifa de red: ${transaction.feeXlm} XLM`
            : `Huella confirmada, pero no se pudo guardar el aviso al Productor. Tarifa: ${transaction.feeXlm} XLM`
          : `Tarifa de red: ${transaction.feeXlm} XLM`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la huella.", {
        id: toastId,
      });
    } finally {
      setIsAnchoring(false);
    }
  }

  return { anchor, anchorStatus, checkAnchor, isAnchoring, isCheckingAnchor, result };
}
