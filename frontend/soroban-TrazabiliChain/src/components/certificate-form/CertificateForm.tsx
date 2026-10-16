"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormFieldError } from "@/components/ui/FormFieldError";
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
import { verifyCurrentPassword } from "@/lib/supabase/verify-current-password";

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
  const [editingCertificateId, setEditingCertificateId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const certificateFormRef = useRef<HTMLFormElement>(null);
  const submissionInProgress = useRef(false);
  const submissionConfirmed = useRef(false);
  const ownedCertificates = records.flatMap((record) =>
    record.certificates
      .filter(
        (certificate) =>
          certificate.recordedBy === actorName &&
          certificate.recordedByRole === actorRole &&
          certificate.recordedByOrganization === organization,
      )
      .map((certificate) => ({ recordId: record.id, certificate })),
  );
  const editingEntry = ownedCertificates.find(
    ({ certificate }) => certificate.id === editingCertificateId,
  );

  function reportError(message: string) {
    setMessage(message);
    toast.error(message);
  }

  function reportSuccess(message: string) {
    setMessage(message);
    toast.success(message);
  }

  function clearFieldError(field: string) {
    setMessage("");
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submitCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) {
      return;
    }
    const errors: Record<string, string> = {};
    if (!lotId) errors["certificate-lot"] = "Selecciona un lote.";
    if (!name.trim()) errors["certificate-name"] = "Escribe el nombre del certificado.";
    if (!issuer.trim()) errors["certificate-issuer"] = "Escribe la entidad emisora.";
    if (!certificateNumber.trim()) errors["certificate-number"] = "Escribe el código o número.";
    if (!issuedAt) errors["certificate-issued"] = "Selecciona la fecha de emisión.";
    if (!actorName.trim() || !organization.trim()) {
      errors["certificate-responsible"] = "Completa el actor y la organización en el perfil.";
    }
    if (!file && !editingEntry?.certificate.evidenceFileName) {
      errors["certificate-file"] =
        fieldErrors["certificate-file"] || "Selecciona el archivo de evidencia.";
    } else if (file && file.size > maximumFileSize) {
      errors["certificate-file"] = "El archivo supera el límite local de 10 MB.";
    } else if (file && !acceptedEvidenceTypes.has(file.type)) {
      errors["certificate-file"] = "El archivo debe ser PDF, JPEG, PNG o WebP.";
    }
    if (editingCertificateId && !editReason.trim()) {
      errors["certificate-edit-reason"] = "Escribe la razón de la modificación.";
    }
    if (editingCertificateId && !editPassword) {
      errors["certificate-edit-password"] = "Ingresa la contraseña de tu cuenta.";
    }
    if (validUntil && issuedAt && validUntil < issuedAt) {
      errors["certificate-valid-until"] = "La vigencia no puede terminar antes de la emisión.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      reportError("Completa los campos marcados antes de continuar.");
      document.getElementById(Object.keys(errors)[0])?.focus();
      return;
    }
    if (editingCertificateId && !editingEntry) {
      reportError(
        "Este certificado ya no está disponible para editar. Recarga la lista e inténtalo otra vez.",
      );
      return;
    }
    if (!file && !editingEntry?.certificate.evidenceFileName) {
      const fileError = "Selecciona el archivo de evidencia.";
      setFieldErrors({ "certificate-file": fileError });
      reportError(fileError);
      return;
    }
    if (!submissionConfirmed.current) {
      setIsConfirmationOpen(true);
      return;
    }
    submissionConfirmed.current = false;

    submissionInProgress.current = true;
    setIsSaving(true);
    setMessage("");
    const certificateId = window.crypto.randomUUID();

    try {
      if (editingCertificateId && editingEntry) {
        if (!(await verifyCurrentPassword(editPassword))) {
          reportError("La contraseña no coincide. No se modificó el certificado.");
          return;
        }

        const oldEvidenceId = editingEntry.certificate.evidenceId ?? editingEntry.certificate.id;
        const nextEvidenceId = file ? window.crypto.randomUUID() : oldEvidenceId;
        const evidenceSha256 = file ? await hashEvidenceFile(file) : undefined;
        const effectiveEvidenceHash = evidenceSha256 ?? editingEntry.certificate.evidenceSha256;
        const duplicateCertificate = records.some((record) =>
          record.certificates.some(
            (certificate) =>
              certificate.id !== editingCertificateId &&
              certificate.certificateNumber === certificateNumber.trim() &&
              certificate.evidenceSha256 === effectiveEvidenceHash,
          ),
        );
        if (duplicateCertificate) {
          reportError("Ya existe otro certificado con ese número y archivo para este perfil.");
          return;
        }
        if (file && !(await saveEvidenceFile(nextEvidenceId, file))) {
          reportError("No se pudo guardar el archivo actualizado.");
          return;
        }

        const updatedAt = new Date().toISOString();
        const saved = await updateLotRecord(editingEntry.recordId, (record) => ({
          ...record,
          certificates: record.certificates.map((certificate) =>
            certificate.id === editingCertificateId
              ? {
                  ...certificate,
                  name: name.trim(),
                  issuer: issuer.trim(),
                  certificateNumber: certificateNumber.trim(),
                  issuedAt,
                  validUntil,
                  ...(file && evidenceSha256
                    ? {
                        evidenceId: nextEvidenceId,
                        evidenceFileName: file.name,
                        evidenceSha256,
                      }
                    : {}),
                }
              : certificate,
          ),
          auditHistory: [
            ...(record.auditHistory ?? []),
            {
              id: window.crypto.randomUUID(),
              action: "edited" as const,
              target: "certificado" as const,
              at: updatedAt,
              actor: actorName,
              role: actorRole,
              reason: editReason.trim(),
              description: `Se actualizaron los datos del certificado ${certificateNumber.trim()}${file ? " y se reemplazó su archivo de evidencia" : ""}.`,
            },
          ],
        }));

        if (!saved) {
          if (file) await removeEvidenceFile(nextEvidenceId);
          reportError("No se pudo guardar el certificado actualizado.");
          return;
        }
        if (file && editingEntry.certificate.evidenceFileName) {
          await removeEvidenceFile(oldEvidenceId);
        }
        reportSuccess("Certificado actualizado y cambio registrado en la auditoría del lote.");
        setEditingCertificateId(null);
        setEditReason("");
        setEditPassword("");
        setName("");
        setIssuer("");
        setCertificateNumber("");
        setIssuedAt("");
        setValidUntil("");
        setFile(null);
        setFieldErrors({});
        return;
      }

      if (!file) {
        reportError("Selecciona el archivo de evidencia.");
        return;
      }
      const evidenceSha256 = await hashEvidenceFile(file);
      const selectedLot = records.find((record) => record.id === lotId);
      const duplicateCertificate = selectedLot?.certificates.some(
        (certificate) =>
          certificate.certificateNumber === certificateNumber.trim() &&
          certificate.evidenceSha256 === evidenceSha256,
      );
      if (duplicateCertificate) {
        reportError("Este número de certificado y archivo ya están asociados a ese lote.");
        return;
      }

      const fileSaved = await saveEvidenceFile(certificateId, file);
      if (!fileSaved) {
        reportError("No se pudo guardar el documento en este navegador.");
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

      const saved = await updateLotRecord(lotId, (record) => ({
        ...record,
        certificates: [...record.certificates, certificate],
      }));

      if (!saved) {
        await removeEvidenceFile(certificateId);
        reportError("No se pudo guardar el certificado en Supabase.");
        return;
      }

      reportSuccess("Evidencia asociada. La identidad del emisor no ha sido verificada.");
      setName("");
      setIssuer("");
      setCertificateNumber("");
      setIssuedAt("");
      setValidUntil("");
      setFile(null);
      setFieldErrors({});
    } catch {
      reportError("No se pudo procesar el archivo en este navegador.");
    } finally {
      submissionInProgress.current = false;
      setIsSaving(false);
    }
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-700">Primero registra un lote para asociar certificados.</p>
    );
  }

  function beginEditingCertificate(certificateId: string) {
    const match = ownedCertificates.find(({ certificate }) => certificate.id === certificateId);
    if (!match) return;
    setEditingCertificateId(certificateId);
    setLotId(match.recordId);
    setName(match.certificate.name);
    setIssuer(match.certificate.issuer);
    setCertificateNumber(match.certificate.certificateNumber);
    setIssuedAt(match.certificate.issuedAt);
    setValidUntil(match.certificate.validUntil);
    setFile(null);
    setEditReason("");
    setEditPassword("");
    setMessage("");
    setFieldErrors({});
  }

  function cancelEditingCertificate() {
    setEditingCertificateId(null);
    setName("");
    setIssuer("");
    setCertificateNumber("");
    setIssuedAt("");
    setValidUntil("");
    setFile(null);
    setEditReason("");
    setEditPassword("");
    setMessage("");
    setFieldErrors({});
  }

  return (
    <section aria-labelledby="certificate-form-title" className="max-w-2xl">
      <h2 id="certificate-form-title" className="font-display text-2xl font-medium text-ink">
        Asociar certificado
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-700">
        Conserva emisor, fechas y huella SHA-256. El archivo permanece en el almacenamiento local de
        este navegador.
      </p>
      <form
        ref={certificateFormRef}
        className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={submitCertificate}
      >
        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="certificate-lot" className="text-sm font-semibold text-ink">
            Lote asociado
          </label>
          <select
            id="certificate-lot"
            required
            disabled={Boolean(editingCertificateId)}
            aria-invalid={Boolean(fieldErrors["certificate-lot"])}
            aria-describedby={fieldErrors["certificate-lot"] ? "certificate-lot-error" : undefined}
            value={lotId}
            onChange={(event) => {
              setLotId(event.target.value);
              clearFieldError("certificate-lot");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {record.product} · {record.id.slice(0, 8)}
              </option>
            ))}
          </select>
          <FormFieldError id="certificate-lot-error" message={fieldErrors["certificate-lot"]} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-name" className="text-sm font-semibold text-ink">
            Nombre del certificado
          </label>
          <input
            id="certificate-name"
            required
            maxLength={120}
            aria-invalid={Boolean(fieldErrors["certificate-name"])}
            aria-describedby={
              fieldErrors["certificate-name"] ? "certificate-name-error" : undefined
            }
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError("certificate-name");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
          <FormFieldError id="certificate-name-error" message={fieldErrors["certificate-name"]} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-issuer" className="text-sm font-semibold text-ink">
            Entidad emisora
          </label>
          <input
            id="certificate-issuer"
            required
            maxLength={120}
            aria-invalid={Boolean(fieldErrors["certificate-issuer"])}
            aria-describedby={
              fieldErrors["certificate-issuer"] ? "certificate-issuer-error" : undefined
            }
            value={issuer}
            onChange={(event) => {
              setIssuer(event.target.value);
              clearFieldError("certificate-issuer");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
          <FormFieldError
            id="certificate-issuer-error"
            message={fieldErrors["certificate-issuer"]}
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
            aria-invalid={Boolean(fieldErrors["certificate-number"])}
            aria-describedby={
              fieldErrors["certificate-number"] ? "certificate-number-error" : undefined
            }
            value={certificateNumber}
            onChange={(event) => {
              setCertificateNumber(event.target.value);
              clearFieldError("certificate-number");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
          <FormFieldError
            id="certificate-number-error"
            message={fieldErrors["certificate-number"]}
          />
        </div>
        <div className="grid gap-1.5">
          <FileUploadField
            id="certificate-file"
            label="Archivo de evidencia (PDF o imagen, máximo 10 MB)"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp"
            file={file}
            error={fieldErrors["certificate-file"]}
            onFileChange={(file) => {
              if (!file) {
                setFile(null);
                clearFieldError("certificate-file");
                return;
              }
              if (file.size > maximumFileSize) {
                setFile(file);
                setFieldErrors((current) => ({
                  ...current,
                  "certificate-file": "El archivo supera el límite local de 10 MB.",
                }));
                return;
              }
              if (!acceptedEvidenceTypes.has(file.type)) {
                setFile(file);
                setFieldErrors((current) => ({
                  ...current,
                  "certificate-file": "El archivo debe ser PDF, JPEG, PNG o WebP.",
                }));
                return;
              }
              setFile(file);
              clearFieldError("certificate-file");
            }}
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
            aria-invalid={Boolean(fieldErrors["certificate-issued"])}
            aria-describedby={
              fieldErrors["certificate-issued"] ? "certificate-issued-error" : undefined
            }
            value={issuedAt}
            onChange={(event) => {
              setIssuedAt(event.target.value);
              clearFieldError("certificate-issued");
              clearFieldError("certificate-valid-until");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
          <FormFieldError
            id="certificate-issued-error"
            message={fieldErrors["certificate-issued"]}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="certificate-valid-until" className="text-sm font-semibold text-ink">
            Válido hasta (opcional)
          </label>
          <input
            id="certificate-valid-until"
            type="date"
            aria-invalid={Boolean(fieldErrors["certificate-valid-until"])}
            aria-describedby={
              fieldErrors["certificate-valid-until"] ? "certificate-valid-until-error" : undefined
            }
            value={validUntil}
            onChange={(event) => {
              setValidUntil(event.target.value);
              clearFieldError("certificate-valid-until");
            }}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
          <FormFieldError
            id="certificate-valid-until-error"
            message={fieldErrors["certificate-valid-until"]}
          />
        </div>
        <div
          id="certificate-responsible"
          tabIndex={-1}
          aria-describedby={
            fieldErrors["certificate-responsible"] ? "certificate-responsible-error" : undefined
          }
          className="grid gap-2 sm:col-span-2"
        >
          <p className="m-0 text-xs text-gray-700">
            Asociado por {actorName} · {organization}. El rol y emisor son declaraciones de demo, no
            identidades autenticadas.
          </p>
          <FormFieldError
            id="certificate-responsible-error"
            message={fieldErrors["certificate-responsible"]}
          />
        </div>
        {editingCertificateId && (
          <div className="grid min-w-0 gap-3 border-t border-line pt-4 sm:col-span-2 sm:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
              <label htmlFor="certificate-edit-reason" className="text-xs font-semibold text-ink">
                Razón de la modificación
              </label>
              <input
                id="certificate-edit-reason"
                value={editReason}
                onChange={(event) => {
                  setEditReason(event.target.value);
                  clearFieldError("certificate-edit-reason");
                }}
                aria-invalid={Boolean(fieldErrors["certificate-edit-reason"])}
                aria-describedby={
                  fieldErrors["certificate-edit-reason"]
                    ? "certificate-edit-reason-error"
                    : undefined
                }
                className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
              />
              <FormFieldError
                id="certificate-edit-reason-error"
                message={fieldErrors["certificate-edit-reason"]}
              />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <label htmlFor="certificate-edit-password" className="text-xs font-semibold text-ink">
                Contraseña de la cuenta
              </label>
              <input
                id="certificate-edit-password"
                type="password"
                autoComplete="current-password"
                value={editPassword}
                onChange={(event) => {
                  setEditPassword(event.target.value);
                  clearFieldError("certificate-edit-password");
                }}
                aria-invalid={Boolean(fieldErrors["certificate-edit-password"])}
                aria-describedby={
                  fieldErrors["certificate-edit-password"]
                    ? "certificate-edit-password-error"
                    : undefined
                }
                className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
              />
              <FormFieldError
                id="certificate-edit-password-error"
                message={fieldErrors["certificate-edit-password"]}
              />
            </div>
            <button
              type="button"
              onClick={cancelEditingCertificate}
              className="min-h-10 justify-self-start rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-paper sm:col-span-2"
            >
              Cancelar edición
            </button>
          </div>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          {isSaving
            ? "Procesando evidencia…"
            : editingCertificateId
              ? "Guardar cambios"
              : "Asociar certificado"}
        </button>
      </form>
      {ownedCertificates.length > 0 && (
        <details className="mt-6 border-t border-line pt-4">
          <summary className="w-fit cursor-pointer text-sm font-semibold text-accent underline underline-offset-4">
            Editar mis certificados
          </summary>
          <ul className="mt-3 grid gap-2">
            {ownedCertificates.map(({ recordId, certificate }) => (
              <li
                key={certificate.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-line p-3"
              >
                <span className="min-w-0 text-sm text-ink">
                  {certificate.name} · {records.find((record) => record.id === recordId)?.product} ·{" "}
                  {certificate.certificateNumber}
                </span>
                <button
                  type="button"
                  onClick={() => beginEditingCertificate(certificate.id)}
                  className="min-h-10 cursor-pointer rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-paper"
                >
                  Editar
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <ConfirmDialog
        open={isConfirmationOpen}
        title={
          editingCertificateId
            ? "Confirmar modificación del certificado"
            : "Revisa el certificado antes de asociarlo"
        }
        description={
          editingCertificateId
            ? "Verifica los cambios; se guardarán con razón y contraseña en la auditoría del lote."
            : "Comprueba el lote, emisor, fechas, número y archivo de evidencia. El certificado quedará asociado al historial."
        }
        confirmLabel={editingCertificateId ? "Guardar cambios" : "Asociar certificado"}
        isBusy={isSaving}
        onCancel={() => {
          submissionConfirmed.current = false;
          setIsConfirmationOpen(false);
        }}
        onConfirm={() => {
          submissionConfirmed.current = true;
          setIsConfirmationOpen(false);
          certificateFormRef.current?.requestSubmit();
        }}
      />
      <p className="mt-3 min-h-5 text-sm text-accent" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
