"use client";

import { useEffect, useRef } from "react";
import { useLotAnchor } from "@/hooks/useLotAnchor";
import type { LotRecord } from "@/lib/lots/lot-storage";
import { stellarExplorerUrl, stellarNetwork } from "@/lib/stellar/network";

export function TraceabilityAnchor({
  record,
  allowAnchoring = false,
  notifyProducer = false,
}: {
  record: LotRecord;
  allowAnchoring?: boolean;
  notifyProducer?: boolean;
}) {
  const anchorContainerRef = useRef<HTMLDivElement>(null);
  const { anchor, anchorStatus, checkAnchor, isAnchoring, isCheckingAnchor, result } = useLotAnchor(
    record,
    { notifyProducer },
  );
  const recordStatus = anchorStatus?.record.id === record.id ? anchorStatus : null;
  const currentHashIsAnchored = recordStatus?.isCurrentHashAnchored === true;

  useEffect(() => {
    const container = anchorContainerRef.current;
    if (!allowAnchoring || !container) return;
    if (typeof IntersectionObserver === "undefined") {
      void checkAnchor();
      return;
    }

    let hasChecked = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasChecked) {
          hasChecked = true;
          observer.disconnect();
          void checkAnchor();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [allowAnchoring, checkAnchor]);

  return (
    <div
      ref={anchorContainerRef}
      className="mt-4 grid justify-items-start gap-2 border-t border-line pt-4"
    >
      {allowAnchoring && (
        <>
          {currentHashIsAnchored ? (
            <p className="mb-0 text-sm text-gray-700" role="status" aria-live="polite">
              {recordStatus.message}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void anchor()}
              disabled={isAnchoring || isCheckingAnchor}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft disabled:cursor-wait disabled:opacity-60"
            >
              {isAnchoring
                ? "Registrando en Stellar…"
                : isCheckingAnchor
                  ? "Comprobando anclaje…"
                  : "Anclar huella del lote"}
            </button>
          )}
          {recordStatus && !currentHashIsAnchored && (
            <p
              className={`mb-0 text-xs leading-5 ${recordStatus.isError ? "text-red-800" : "text-gray-700"}`}
              role={recordStatus.isError ? "alert" : "status"}
              aria-live={recordStatus.isError ? "assertive" : "polite"}
            >
              {recordStatus.message}
            </p>
          )}
          <p className="mb-0 max-w-xl text-xs leading-5 text-gray-700">
            Se ancla la huella SHA-256 de la ficha pública, sus eventos y metadatos de certificados
            en Stellar {stellarNetwork.label}; no se registran nombres personales ni archivos. Cada
            cambio permite añadir una nueva huella sin borrar la anterior. Orden recomendado:
            primero Productor; si no está disponible, el Actor de cadena o Certificador que aportó
            al lote; el Administrador queda como respaldo. La aplicación comprueba el estado y
            oculta esta acción cuando la huella actual ya está registrada. La firma requiere una
            wallet autorizada y XLM de prueba.
          </p>
        </>
      )}
      {result && (
        <a
          href={stellarExplorerUrl("tx", result.transactionHash)}
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
