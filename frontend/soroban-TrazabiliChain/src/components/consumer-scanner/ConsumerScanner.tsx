"use client";

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

export function ConsumerScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");

  function stopScanning() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  }

  function openScannedValue(value: string) {
    const trimmedValue = value.trim();
    let pathname = "";

    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        trimmedValue,
      )
    ) {
      pathname = `/lote/${encodeURIComponent(trimmedValue)}`;
    } else {
      try {
        const scannedUrl = new URL(trimmedValue, window.location.origin);
        if (scannedUrl.origin !== window.location.origin) {
          setMessage("Este QR pertenece a otro dominio. Ábrelo en el dominio donde se generó.");
          return;
        }
        pathname = scannedUrl.pathname;
      } catch {
        setMessage("Escribe el identificador del lote o una URL de consulta válida.");
        return;
      }
    }

    if (!/^\/lote\/[a-z0-9-]+\/?$/i.test(pathname)) {
      setMessage("El QR no contiene un enlace válido de consulta de lote.");
      return;
    }

    stopScanning();
    router.push(pathname);
  }

  async function startScanning() {
    if (!videoRef.current) {
      return;
    }

    setMessage("Solicitando acceso a la cámara…");
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        videoRef.current,
        (result) => {
          if (result) {
            openScannedValue(result.getText());
          }
        },
      );
      setIsScanning(true);
      setMessage("Cámara activa. Enfoca el código QR del lote.");
    } catch {
      setIsScanning(false);
      setMessage(
        "No se pudo acceder a la cámara. Usa el identificador manual o permite el acceso.",
      );
    }
  }

  function submitIdentifier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openScannedValue(identifier);
  }

  useEffect(() => () => controlsRef.current?.stop(), []);

  return (
    <section aria-labelledby="consumer-scanner-title" className="max-w-2xl">
      <h2 id="consumer-scanner-title" className="font-display text-2xl font-medium text-ink">
        Consultar un lote
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Escanea el QR del producto con la cámara o escribe el identificador. El navegador pedirá
        permiso para usar la cámara.
      </p>

      {isScanning ? (
        <div className="mt-5 grid gap-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full rounded-md bg-ink object-cover"
            aria-label="Vista de la cámara para escanear un código QR"
          />
          <button
            type="button"
            onClick={stopScanning}
            className="min-h-11 w-fit cursor-pointer rounded-md border border-line px-4 text-sm font-semibold text-ink hover:bg-paper"
          >
            Detener cámara
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startScanning}
          className="mt-5 min-h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746]"
        >
          Activar cámara
        </button>
      )}

      <form className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={submitIdentifier}>
        <div className="grid gap-1.5">
          <label htmlFor="public-lot-id" className="text-sm font-semibold text-ink">
            Identificador o URL del QR
          </label>
          <input
            id="public-lot-id"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
            placeholder="UUID del lote"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 cursor-pointer self-end rounded-md border border-line px-4 text-sm font-semibold text-ink hover:bg-paper"
        >
          Consultar
        </button>
      </form>
      <p className="mt-3 min-h-5 text-sm text-accent" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
