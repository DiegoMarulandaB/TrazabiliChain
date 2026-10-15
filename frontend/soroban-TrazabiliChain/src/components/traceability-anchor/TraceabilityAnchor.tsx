"use client";

import { useLotAnchor } from "@/hooks/useLotAnchor";
import type { LotRecord } from "@/lib/lots/lot-storage";

export function TraceabilityAnchor({ record }: { record: LotRecord }) {
  const { anchor, isAnchoring, result } = useLotAnchor(record);

  return (
    <div className="mt-4 grid justify-items-start gap-2 border-t border-line pt-4">
      <button
        type="button"
        onClick={() => void anchor()}
        disabled={isAnchoring}
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-accent px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft disabled:cursor-wait disabled:opacity-60"
      >
        {isAnchoring ? "Registrando en Stellar…" : "Anclar huella del lote"}
      </button>
      <p className="mb-0 max-w-xl text-xs leading-5 text-gray-700">
        Se ancla la huella SHA-256 de la ficha pública, sus eventos y metadatos de certificados; no
        se registran nombres personales ni archivos. Cada cambio permite añadir una nueva huella sin
        borrar la anterior. La firma requiere una wallet autorizada y XLM de prueba.
      </p>
      {result && (
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-mono text-xs text-accent underline underline-offset-2"
        >
          Transacción {result.transactionHash} · {result.feeXlm} XLM
        </a>
      )}
    </div>
  );
}
