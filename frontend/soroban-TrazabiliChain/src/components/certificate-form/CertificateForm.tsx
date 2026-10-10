"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  updateLotRecord,
  type DemoRole,
  type LotCertificate,
  type LotRecord,
} from "@/lib/lots/lot-storage";
import {
  hashEvidenceFile,
  removeEvidenceFile,
  saveEvidenceFile,
} from "@/lib/lots/evidence-storage";

const maximumFileSize = 10 * 1024 * 1024;
const acceptedEvidenceTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export function CertificateForm({
  records,
  actorName,
  actorRole,
  organization,
}: {
  records: LotRecord[];
  actorName: string;
  actorRole: DemoRole;
  organization: string;
}) {
  const [lotId, setLotId] = useState(records[0]?.id ?? "");
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submissionInProgress = useRef(false);

  async function submitCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) {
      return;
    }
    if (!file || !lotId) {
      setMessage("Selecciona un lote y el archivo que respalda el certificado.");
      return;
    }
    if (file.size > maximumFileSize) {
      setMessage("El archivo supera el límite local de 10 MB.");
      return;
    }
    if (!acceptedEvidenceTypes.has(file.type)) {
      setMessage("El archivo debe ser PDF, JPEG, PNG o WebP.");
      return;
    }
    if (validUntil && validUntil < issuedAt) {
      setMessage("La vigencia no puede terminar antes de la fecha de emisión.");
      return;
    }

    submissionInProgress.current = true;
    setIsSaving(true);
    setMessage("");
    const certificateId = window.crypto.randomUUID();

    try {
      const evidenceSha256 = await hashEvidenceFile(file);
      const selectedLot = records.find((record) => record.id === lotId);
      const duplicateCertificate = selectedLot?.certificates.some(
        (certificate) =>
          certificate.certificateNumber === certificateNumber.trim() &&
          certificate.evidenceSha256 === evidenceSha256,
      );
      if (duplicateCertificate) {
        setMessage("Este número de certificado y archivo ya están asociados a ese lote.");
        return;
      }

      const fileSaved = await saveEvidenceFile(certificateId, file);
      if (!fileSaved) {
        setMessage("No se pudo guardar el documento en este navegador.");
        return;
      }

      const certificate: LotCertificate = {
        id: certificateId,
        name: name.trim(),
        issuer: issuer.trim(),
        certificateNumber: certificateNumber.trim(),
        issuedAt,
        validUntil,
        evidenceFileName: file.name,
        evidenceSha256,
        recordedBy: actorName,
        recordedByRole: actorRole,
        recordedByOrganization: organization,
        recordedAt: new Date().toISOString(),
      };

      const saved = updateLotRecord(lotId, (record) => ({
        ...record,
        certificates: [...record.certificates, certificate],
      }));

      if (!saved) {
        await removeEvidenceFile(certificateId);
        setMessage("No se pudo asociar el certificado al lote.");
        return;
      }

      setMessage("Evidencia asociada. La identidad del emisor no ha sido verificada.");
      setName("");
      setIssuer("");
      setCertificateNumber("");
      setIssuedAt("");
      setValidUntil("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setMessage("No se pudo procesar el archivo en este navegador.");
    } finally {
      submissionInProgress.current = false;
      setIsSaving(false);
    }
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-muted">Primero registra un lote para asociar certificados.</p>
    );
  }

  return (
    <section aria-labelledby="certificate-form-title" className="max-w-2xl">
      <h2 id="certificate-form-title" className="font-display text-2xl font-medium text-ink">
        Asociar certificado
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Conserva emisor, fechas y huella SHA-256. El archivo permanece en el almacenamiento local de
        este navegador.
      </p>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submitCertificate}>
        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="certificate-lot" className="text-sm font-semibold text-ink">
            Lote asociado
          </label>
          <select
            id="certificate-lot"
            required
            value={lotId}
            onChange={(event) => setLotId(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {record.product} · {record.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-name" className="text-sm font-semibold text-ink">
            Nombre del certificado
          </label>
          <input
            id="certificate-name"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-issuer" className="text-sm font-semibold text-ink">
            Entidad emisora
          </label>
          <input
            id="certificate-issuer"
            required
            maxLength={120}
            value={issuer}
            onChange={(event) => setIssuer(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-number" className="text-sm font-semibold text-ink">
            Código o número
          </label>
          <input
            id="certificate-number"
            required
            maxLength={100}
            value={certificateNumber}
            onChange={(event) => setCertificateNumber(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-file" className="text-sm font-semibold text-ink">
            Archivo de evidencia (PDF o imagen, máximo 10 MB)
          </label>
          <input
            ref={fileInputRef}
            id="certificate-file"
            type="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="min-h-11 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-issued" className="text-sm font-semibold text-ink">
            Fecha de emisión
          </label>
          <input
            id="certificate-issued"
            type="date"
            required
            value={issuedAt}
            onChange={(event) => setIssuedAt(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-valid-until" className="text-sm font-semibold text-ink">
            Válido hasta (opcional)
          </label>
          <input
            id="certificate-valid-until"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <p className="m-0 self-center text-xs text-muted sm:col-span-2">
          Asociado por {actorName} · {organization}. El rol y emisor son declaraciones de demo, no
          identidades autenticadas.
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          {isSaving ? "Procesando evidencia…" : "Asociar certificado"}
        </button>
      </form>
      <p className="mt-3 min-h-5 text-sm text-accent" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
