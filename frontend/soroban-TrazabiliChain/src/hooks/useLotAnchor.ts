"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { getLotEventCount, getLotEventHash } from "@/lib/stellar/read";
import { anchorLotHash } from "@/lib/stellar/write";
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
  isCurrentHashAnchored?: boolean;
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

  const checkAnchor = useCallback(async () => {
    setIsCheckingAnchor(true);
    setAnchorStatus(null);
    try {
      const eventCount = await getLotEventCount(record.id);
      if (eventCount === 0) {
        setAnchorStatus({
          record,
          message: "No hay una huella registrada en Stellar para este lote.",
          isCurrentHashAnchored: false,
        });
        return;
      }

      const latestHash = await getLotEventHash(record.id, eventCount - 1);
      if (!latestHash) {
        setAnchorStatus({
          record,
          message: "Stellar no devolvió la última huella del lote.",
          isError: true,
          isCurrentHashAnchored: false,
        });
        return;
      }

      const currentHash = await getPublicLotHash(record);
      const isCurrentHashAnchored = latestHash === currentHash;
      setAnchorStatus({
        record,
        latestHash,
        isCurrentHashAnchored,
        message: isCurrentHashAnchored
          ? `La huella actual ya está anclada. No hace falta repetirla. Anclajes registrados: ${eventCount}.`
          : `La última huella no coincide con la ficha actual. Puedes anclar esta versión. Anclajes registrados: ${eventCount}.`,
      });
    } catch (error) {
      setAnchorStatus({
        record,
        message:
          error instanceof Error
            ? error.message
            : `No se pudo consultar el contrato en Stellar ${stellarNetwork.label}.`,
        isError: true,
        isCurrentHashAnchored: false,
      });
    } finally {
      setIsCheckingAnchor(false);
    }
  }, [record]);

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
            isCurrentHashAnchored: true,
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
          producerNotified = await notifyOwnerOfLotAnchor(record.id, transaction.transactionHash);
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
