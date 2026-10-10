"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  EnvelopeSimple,
  InstagramLogo,
  LinkedinLogo,
  LinkSimple,
  ShareNetwork,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { LotRecord } from "@/lib/lots/lot-storage";

const subscribeToOrigin = (notify: () => void) => {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
};

const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

function buildShareUrl(origin: string, id: string) {
  return `${origin}/lote/${encodeURIComponent(id)}`;
}

export function LotSharing({ record }: { record: LotRecord }) {
  const origin = useSyncExternalStore(subscribeToOrigin, getOrigin, getServerOrigin);
  const [shareStatus, setShareStatus] = useState("");
  const [showManualCopy, setShowManualCopy] = useState(false);
  const shareDetailsRef = useRef<HTMLDetailsElement>(null);
  const shareSummaryRef = useRef<HTMLElement>(null);
  const shareUrl = origin ? buildShareUrl(origin, record.id) : "";
  const shareText = `Consulta en TrazabiliChain: ${record.product}`;

  useEffect(() => {
    function closeWhenOutside(event: PointerEvent | FocusEvent) {
      const details = shareDetailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }

    document.addEventListener("pointerdown", closeWhenOutside);
    document.addEventListener("focusin", closeWhenOutside);
    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      document.removeEventListener("focusin", closeWhenOutside);
    };
  }, []);

  function closeShareMenu() {
    if (shareDetailsRef.current) {
      shareDetailsRef.current.open = false;
    }
  }

  function handleShareMenuKeyDown(event: React.KeyboardEvent<HTMLDetailsElement>) {
    if (event.key === "Escape" && shareDetailsRef.current?.open) {
      event.preventDefault();
      closeShareMenu();
      shareSummaryRef.current?.focus();
    }
  }

  async function copyShareUrl(destination?: "instagram") {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus(
        destination === "instagram"
          ? "Enlace copiado. Abre Instagram y pégalo donde quieras compartirlo."
          : "Enlace copiado. Pégalo en la publicación que quieras compartir.",
      );
      setShowManualCopy(false);
      closeShareMenu();
    } catch {
      setShowManualCopy(true);
      setShareStatus(
        "No se pudo copiar automáticamente. Copia el enlace desde el campo siguiente.",
      );
    }
  }

  if (!shareUrl) {
    return <p className="mb-0 text-xs text-muted">Preparando el enlace del QR…</p>;
  }

  const emailUrl = `mailto:?subject=${encodeURIComponent(`TrazabiliChain · ${record.product}`)}&body=${encodeURIComponent(`${shareText}: ${shareUrl}\n\nEnlace de demostración local.`)}`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="w-fit rounded-md border border-line bg-white p-2">
        <QRCodeSVG
          value={shareUrl}
          size={128}
          level="H"
          marginSize={2}
          title={`Código QR del lote ${record.product}`}
          aria-label={`Código QR con el enlace público de demostración para el lote ${record.product}`}
        />
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-sm font-semibold text-ink">QR de consulta</p>
        <p className="mb-3 break-all font-mono text-xs text-muted">ID: {record.id}</p>
        <details
          ref={shareDetailsRef}
          className="relative inline-block"
          onKeyDown={handleShareMenuKeyDown}
        >
          <summary
            ref={shareSummaryRef}
            aria-controls={`share-options-${record.id}`}
            className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
          >
            <ShareNetwork size={18} weight="regular" aria-hidden="true" />
            <span>Compartir</span>
          </summary>
          <div
            id={`share-options-${record.id}`}
            className="absolute left-0 top-full z-20 mt-2 grid w-[min(19rem,calc(100vw-3rem))] gap-1 rounded-md border border-line bg-white p-2 shadow-lg"
          >
            <a
              href={emailUrl}
              onClick={closeShareMenu}
              className="flex min-h-11 items-center gap-3 rounded px-3 text-sm font-medium text-ink hover:bg-paper focus-visible:outline-offset-[-2px]"
            >
              <EnvelopeSimple size={19} aria-hidden="true" />
              <span>Correo electrónico</span>
            </a>
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en X (abre en una pestaña nueva)"
              onClick={closeShareMenu}
              className="flex min-h-11 items-center gap-3 rounded px-3 text-sm font-medium text-ink hover:bg-paper focus-visible:outline-offset-[-2px]"
            >
              <XLogo size={19} aria-hidden="true" />
              <span>X</span>
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en LinkedIn (abre en una pestaña nueva)"
              onClick={closeShareMenu}
              className="flex min-h-11 items-center gap-3 rounded px-3 text-sm font-medium text-ink hover:bg-paper focus-visible:outline-offset-[-2px]"
            >
              <LinkedinLogo size={19} aria-hidden="true" />
              <span>LinkedIn</span>
            </a>
            <button
              type="button"
              onClick={() => copyShareUrl("instagram")}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-3 text-left text-sm font-medium text-ink hover:bg-paper focus-visible:outline-offset-[-2px]"
            >
              <InstagramLogo size={19} aria-hidden="true" />
              <span>Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => copyShareUrl()}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-3 text-left text-sm font-medium text-ink hover:bg-paper focus-visible:outline-offset-[-2px]"
            >
              <LinkSimple size={19} aria-hidden="true" />
              <span>Copiar enlace</span>
            </button>
          </div>
        </details>
        {showManualCopy && (
          <div className="mt-3 grid gap-1.5">
            <label htmlFor={`share-url-${record.id}`} className="text-xs font-medium text-ink">
              Enlace para copiar manualmente
            </label>
            <input
              id={`share-url-${record.id}`}
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="min-h-10 w-full rounded-md border border-line bg-white px-3 text-xs text-ink focus-visible:border-accent"
            />
          </div>
        )}
        <p className="mt-3 mb-0 text-xs leading-5 text-muted">
          El QR solo contiene el identificador aleatorio y el enlace, no los datos del lote. En esta
          demo el destino funciona únicamente en este navegador.
        </p>
        <p className="mt-2 mb-0 min-h-5 text-xs text-accent" role="status" aria-live="polite">
          {shareStatus}
        </p>
      </div>
    </div>
  );
}
