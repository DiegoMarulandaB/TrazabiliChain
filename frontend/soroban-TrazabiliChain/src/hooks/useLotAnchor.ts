"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { getLotEventCount } from "@/lib/stellar/read";
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
      const eventCount = await getLotEventCount(record.id);
      if (eventCount > 0) {
        toast.info("Este lote ya tiene una huella registrada en Stellar.", { id: toastId });
        return;
      }

      const publicLotData = JSON.stringify({
        id: record.id,
        product: record.product,
        origin: record.origin,
        originDate: record.originDate,
        organization: record.organization,
      });
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(publicLotData));
      const hash = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
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
