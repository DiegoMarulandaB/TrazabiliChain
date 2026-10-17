"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { roleLabels } from "@/components/organization-members/OrganizationMembers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { useWorkDraft } from "@/hooks/useWorkDraft";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  formatLocalizedNumberInput,
  formatNumberForCurrency,
  getCurrencyDecimalSeparator,
  getCurrencyLocale,
  getCurrencySymbol,
  formatLotCharacteristics,
  parseLocalizedNumber,
  parseLotCharacteristics,
  type LotCharacteristicsData,
} from "@/lib/lots/lot-characteristics";
import { updateLotRecord, type DemoRole, type LotRecord } from "@/lib/lots/lot-storage";

type PendingAction = "edited" | "deleted";
const presentations = ["Grano entero", "Molido"];
const maximumProductImageSize = 2 * 1024 * 1024;
const acceptedProductImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function LotManagement({
  record,
  actorName,
  actorRole,
  draftUserId,
}: {
  record: LotRecord;
  actorName: string;
  actorRole: DemoRole;
  draftUserId: string | null;
}) {
  const [product, setProduct] = useState(record.product);
  const originalCharacteristics = useRef(parseLotCharacteristics(record.characteristics));
  const [characteristics, setCharacteristics] = useState<LotCharacteristicsData>(() =>
    parseLotCharacteristics(record.characteristics),
  );
  const [origin, setOrigin] = useState(record.origin);
  const [originDate, setOriginDate] = useState(record.originDate);
  const [organization, setOrganization] = useState(record.organization);
  const [removeProductImage, setRemoveProductImage] = useState(false);
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null);
  const [newProductImageDataUrl, setNewProductImageDataUrl] = useState("");
  const [productImageError, setProductImageError] = useState("");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const lotEditDraft = useWorkDraft({
    userId: draftUserId,
    role: actorRole,
    product: record.product,
    draftKey: `lot-edit-${record.id}`,
    payload: {
      product,
      characteristics,
      origin,
      originDate,
      organization,
      removeProductImage,
      reason,
    },
    onRestore: (draft) => {
      if (draft.product !== undefined) setProduct(draft.product);
      if (draft.characteristics !== undefined) setCharacteristics(draft.characteristics);
      if (draft.origin !== undefined) setOrigin(draft.origin);
      if (draft.originDate !== undefined) setOriginDate(draft.originDate);
      if (draft.organization !== undefined) setOrganization(draft.organization);
      if (draft.removeProductImage !== undefined) setRemoveProductImage(draft.removeProductImage);
      if (draft.reason !== undefined) setReason(draft.reason);
    },
  });

  async function confirmAction() {
    if (!pendingAction || !reason.trim() || !password) {
      setMessage("Escribe la contraseña y el motivo antes de continuar.");
      setIsDialogOpen(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("No se pudo verificar la contraseña con Supabase.");
      setIsDialogOpen(false);
      return;
    }

    setIsBusy(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        setMessage("Inicia sesión con una cuenta de correo para verificar la contraseña.");
        setIsDialogOpen(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password,
      });
      if (authError) {
        setMessage("La contraseña no coincide. No se realizaron cambios.");
        setIsDialogOpen(false);
        return;
      }

      const timestamp = new Date().toISOString();
      const isDelete = pendingAction === "deleted";
      const normalizedCharacteristics = formatLotCharacteristics(characteristics);
      const editedFields = [
        product !== record.product ? "producto" : "",
        normalizedCharacteristics !== formatLotCharacteristics(originalCharacteristics.current)
          ? "características del lote"
          : "",
        origin !== record.origin ? "ubicación" : "",
        originDate !== record.originDate ? "fecha del lote" : "",
        organization !== record.organization ? "organización responsable" : "",
        removeProductImage || newProductImageDataUrl ? "imagen del producto" : "",
      ].filter(Boolean);
      if (!isDelete && editedFields.length === 0) {
        setMessage("No hay cambios para guardar.");
        setIsDialogOpen(false);
        return;
      }
      if (
        !isDelete &&
        (!characteristics.variety.trim() ||
          !characteristics.presentation ||
          !characteristics.harvest.trim() ||
          !characteristics.quality.trim() ||
          !Number.isFinite(Number(characteristics.quantity)) ||
          Number(characteristics.quantity) <= 0)
      ) {
        setMessage("Completa variedad, presentación, cosecha y calidad antes de guardar.");
        setIsDialogOpen(false);
        return;
      }
      if (
        !isDelete &&
        characteristics.price.trim() &&
        (!Number.isFinite(parseLocalizedNumber(characteristics.price, characteristics.currency)) ||
          parseLocalizedNumber(characteristics.price, characteristics.currency) <= 0)
      ) {
        setMessage("El valor del producto debe ser un número mayor que cero.");
        setIsDialogOpen(false);
        return;
      }
      if (!isDelete && productImageError) {
        setMessage(productImageError);
        setIsDialogOpen(false);
        return;
      }

      const description = isDelete
        ? `Se retiró el lote ${record.product} (${record.id.slice(0, 8)}) del listado activo.`
        : `Se actualizaron: ${editedFields.join(", ")}.`;
      const saved = await updateLotRecord(record.id, (current) => {
        const updatedRecord: LotRecord = {
          ...current,
          ...(isDelete
            ? { isDeleted: true, isPublic: false }
            : {
                product: product.trim(),
                characteristics: normalizedCharacteristics,
                origin: origin.trim(),
                originDate,
                organization: organization.trim(),
                ...(newProductImageDataUrl ? { photoDataUrl: newProductImageDataUrl } : {}),
              }),
        };
        if (!isDelete && removeProductImage && !newProductImageDataUrl) {
          delete updatedRecord.photoDataUrl;
        }

        return {
          ...updatedRecord,
          auditHistory: [
            ...(current.auditHistory ?? []),
            {
              id: window.crypto.randomUUID(),
              action: pendingAction,
              at: timestamp,
              actor: actorName,
              role: actorRole,
              reason: reason.trim(),
              description,
            },
          ],
        };
      });

      if (!saved) {
        setMessage("No se pudo guardar el cambio en Supabase.");
        setIsDialogOpen(false);
        return;
      }

      setMessage(`${description} Motivo: ${reason.trim()}`);
      toast.success(isDelete ? "Lote retirado; el historial se conservó." : "Lote actualizado.");
      originalCharacteristics.current = parseLotCharacteristics(normalizedCharacteristics);
      setCharacteristics(originalCharacteristics.current);
      setReason("");
      setPassword("");
      setRemoveProductImage(false);
      setNewProductImageFile(null);
      setNewProductImageDataUrl("");
      setProductImageError("");
      setPendingAction(null);
      setIsDialogOpen(false);
    } catch {
      setMessage("No se pudo verificar la cuenta o guardar el cambio.");
      setIsDialogOpen(false);
    } finally {
      setIsBusy(false);
    }
  }

  function requestAction(action: PendingAction) {
    if (!reason.trim() || !password) {
      setMessage("Escribe la contraseña y el motivo antes de continuar.");
      return;
    }
    setPendingAction(action);
    setIsDialogOpen(true);
  }

  return (
    <section className="mt-4 border-t border-line pt-4" aria-label="Gestión e historial de cambios">
      {record.auditHistory && record.auditHistory.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-ink">Historial de cambios</h4>
          <ol className="grid gap-3">
            {record.auditHistory.map((entry) => (
              <li key={entry.id} className="border-l-2 border-accent pl-3 text-sm">
                <p className="mb-1 font-medium text-ink">
                  {entry.target === "evento"
                    ? entry.action === "deleted"
                      ? "Evento eliminado"
                      : "Evento editado"
                    : entry.target === "certificado"
                      ? entry.action === "deleted"
                        ? "Certificado eliminado"
                        : "Certificado editado"
                      : entry.action === "deleted"
                        ? "Lote retirado"
                        : "Lote editado"}{" "}
                  · {entry.description}
                </p>
                <p className="mb-1 text-xs text-gray-700">
                  <time dateTime={entry.at}>
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.at))}
                  </time>
                  {" · "}
                  {entry.actor} · {roleLabels[entry.role]}
                </p>
                <p className="mb-0 text-xs text-gray-700">Motivo: {entry.reason}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {record.isDeleted ? (
        <p className="mb-0 text-sm font-medium text-gray-700">
          Registro retirado; auditoría conservada.
        </p>
      ) : (
        <details className="group border-t border-line pt-3">
          <summary className="w-fit text-sm font-semibold text-accent underline underline-offset-4">
            Editar o retirar este lote
          </summary>
          <form
            className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2"
            onSubmit={(event) => event.preventDefault()}
            inert={!lotEditDraft.isReady}
          >
            <div className="grid min-w-0 gap-1.5">
              <label
                htmlFor={`edit-product-${record.id}`}
                className="text-xs font-semibold text-ink"
              >
                Producto
              </label>
              <textarea
                id={`edit-product-${record.id}`}
                rows={2}
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                className="min-h-10 min-w-0 resize-y rounded-md border border-line px-3 py-2 text-sm"
              />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <label htmlFor={`edit-date-${record.id}`} className="text-xs font-semibold text-ink">
                Fecha del lote
              </label>
              <input
                id={`edit-date-${record.id}`}
                type="date"
                value={originDate}
                onChange={(event) => setOriginDate(event.target.value)}
                className="date-input min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
              />
            </div>
            <fieldset className="grid min-w-0 gap-3 border-t border-line pt-3 sm:col-span-2 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold text-ink">
                Características del lote
              </legend>
              <div className="grid min-w-0 gap-1.5">
                <label
                  htmlFor={`edit-variety-${record.id}`}
                  className="text-xs font-semibold text-ink"
                >
                  Variedad
                </label>
                <textarea
                  id={`edit-variety-${record.id}`}
                  rows={2}
                  value={characteristics.variety}
                  onChange={(event) =>
                    setCharacteristics((current) => ({ ...current, variety: event.target.value }))
                  }
                  className="min-h-10 min-w-0 resize-y rounded-md border border-line px-3 py-2 text-sm"
                />
              </div>
              <div className="grid min-w-0 gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`edit-presentation-${record.id}`}
                  className="text-xs font-semibold text-ink"
                >
                  Presentación
                </label>
                <select
                  id={`edit-presentation-${record.id}`}
                  value={characteristics.presentation}
                  onChange={(event) =>
                    setCharacteristics((current) => ({
                      ...current,
                      presentation: event.target.value,
                    }))
                  }
                  className="min-h-10 min-w-0 rounded-md border border-line bg-white px-3 text-sm"
                >
                  <option value="">Selecciona la presentación</option>
                  {presentations.map((presentation) => (
                    <option key={presentation}>{presentation}</option>
                  ))}
                </select>
              </div>
              <div className="grid min-w-0 gap-1.5">
                <label
                  htmlFor={`edit-harvest-${record.id}`}
                  className="text-xs font-semibold text-ink"
                >
                  Cosecha
                </label>
                <input
                  id={`edit-harvest-${record.id}`}
                  value={characteristics.harvest}
                  onChange={(event) =>
                    setCharacteristics((current) => ({ ...current, harvest: event.target.value }))
                  }
                  className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
                />
              </div>
              <div className="grid min-w-0 gap-1.5">
                <label
                  htmlFor={`edit-quality-${record.id}`}
                  className="text-xs font-semibold text-ink"
                >
                  Calidad
                </label>
                <textarea
                  id={`edit-quality-${record.id}`}
                  rows={2}
                  value={characteristics.quality}
                  onChange={(event) =>
                    setCharacteristics((current) => ({ ...current, quality: event.target.value }))
                  }
                  className="min-h-10 min-w-0 resize-y rounded-md border border-line px-3 py-2 text-sm"
                />
              </div>
              <div className="grid min-w-0 gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`edit-price-${record.id}`}
                  className="text-xs font-semibold text-ink"
                >
                  Valor (opcional)
                </label>
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_6rem] gap-2">
                  <span
                    aria-hidden="true"
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-md border border-line bg-paper px-2 text-sm font-semibold text-ink"
                  >
                    {getCurrencySymbol(characteristics.currency)}
                  </span>
                  <input
                    id={`edit-price-${record.id}`}
                    type="text"
                    inputMode="decimal"
                    lang={getCurrencyLocale(characteristics.currency)}
                    value={characteristics.price}
                    placeholder={
                      getCurrencyDecimalSeparator(characteristics.currency) === ","
                        ? "100.000,00"
                        : "100,000.00"
                    }
                    onChange={(event) =>
                      setCharacteristics((current) => ({ ...current, price: event.target.value }))
                    }
                    onBlur={() =>
                      setCharacteristics((current) => ({
                        ...current,
                        price: formatLocalizedNumberInput(current.price, current.currency),
                      }))
                    }
                    className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
                  />
                  <select
                    id={`edit-currency-${record.id}`}
                    value={characteristics.currency}
                    onChange={(event) =>
                      setCharacteristics((current) => {
                        const nextCurrency = event.target.value;
                        const amount = parseLocalizedNumber(current.price, current.currency);
                        return {
                          ...current,
                          currency: nextCurrency,
                          ...(current.price.trim() && Number.isFinite(amount)
                            ? { price: formatNumberForCurrency(amount, nextCurrency) }
                            : {}),
                        };
                      })
                    }
                    aria-label="Divisa del precio"
                    className="min-h-10 min-w-0 rounded-md border border-line bg-white px-2 text-sm"
                  >
                    {["COP", "USD", "EUR", "MXN", "PEN", "BRL", "GBP", "JPY", "CAD", "AUD"].map(
                      (currency) => (
                        <option key={currency}>{currency}</option>
                      ),
                    )}
                  </select>
                </div>
                <div className="grid w-full max-w-sm min-w-0 grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-2">
                  <label
                    htmlFor={`edit-quantity-${record.id}`}
                    className="text-xs font-semibold text-ink"
                  >
                    Cantidad
                  </label>
                  <input
                    id={`edit-quantity-${record.id}`}
                    type="number"
                    min="0.001"
                    step="any"
                    inputMode="decimal"
                    lang={getCurrencyLocale(characteristics.currency)}
                    aria-label="Cantidad del producto"
                    value={characteristics.quantity}
                    onChange={(event) =>
                      setCharacteristics((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
                  />
                  <select
                    id={`edit-unit-${record.id}`}
                    value={characteristics.unit}
                    onChange={(event) =>
                      setCharacteristics((current) => ({ ...current, unit: event.target.value }))
                    }
                    aria-label="Unidad de venta"
                    className="min-h-10 min-w-0 rounded-md border border-line bg-white px-2 text-sm"
                  >
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="t">Tonelada (t)</option>
                    <option value="lb">Libra (lb)</option>
                  </select>
                </div>
              </div>
              <div className="grid min-w-0 gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`edit-other-details-${record.id}`}
                  className="text-xs font-semibold text-ink"
                >
                  Otros datos del producto
                </label>
                <textarea
                  id={`edit-other-details-${record.id}`}
                  rows={3}
                  value={characteristics.otherDetails}
                  onChange={(event) =>
                    setCharacteristics((current) => ({
                      ...current,
                      otherDetails: event.target.value,
                    }))
                  }
                  className="min-w-0 rounded-md border border-line px-3 py-2 text-sm"
                />
              </div>
            </fieldset>
            <div className="grid min-w-0 gap-3 sm:col-span-2">
              {record.photoDataUrl && !removeProductImage && !newProductImageDataUrl && (
                <Image
                  src={record.photoDataUrl}
                  alt={`Imagen actual del lote ${record.product}`}
                  width={800}
                  height={600}
                  unoptimized
                  className="aspect-4/3 w-full max-w-sm rounded-md border border-line object-cover"
                />
              )}
              {newProductImageDataUrl && (
                <Image
                  src={newProductImageDataUrl}
                  alt={`Vista previa de la nueva imagen del lote ${record.product}`}
                  width={800}
                  height={600}
                  unoptimized
                  className="aspect-4/3 w-full max-w-sm rounded-md border border-line object-cover"
                />
              )}
              <FileUploadField
                id={`edit-product-image-${record.id}`}
                label="Cambiar imagen del producto (opcional, máximo 2 MB)"
                accept="image/jpeg,image/png,image/webp"
                file={newProductImageFile}
                error={productImageError}
                onFileChange={(file) => {
                  if (!file) {
                    setNewProductImageFile(null);
                    setNewProductImageDataUrl("");
                    setProductImageError("");
                    return;
                  }
                  setNewProductImageFile(file);
                  setNewProductImageDataUrl("");
                  setRemoveProductImage(false);
                  if (
                    !acceptedProductImageTypes.has(file.type) ||
                    file.size > maximumProductImageSize
                  ) {
                    setProductImageError("Elige una imagen JPEG, PNG o WebP de hasta 2 MB.");
                    return;
                  }
                  setProductImageError("");
                  const reader = new FileReader();
                  reader.onload = () => {
                    setNewProductImageDataUrl(
                      typeof reader.result === "string" ? reader.result : "",
                    );
                  };
                  reader.onerror = () =>
                    setProductImageError("No se pudo leer la imagen seleccionada.");
                  reader.readAsDataURL(file);
                }}
              />
              {record.photoDataUrl && !newProductImageFile && (
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={removeProductImage}
                    onChange={(event) => setRemoveProductImage(event.target.checked)}
                    className="size-4 accent-accent"
                  />
                  Quitar imagen del producto al guardar
                </label>
              )}
            </div>
            <div className="grid min-w-0 gap-1.5 sm:col-span-2">
              <label
                htmlFor={`edit-origin-${record.id}`}
                className="text-xs font-semibold text-ink"
              >
                Ubicación
              </label>
              <textarea
                id={`edit-origin-${record.id}`}
                rows={2}
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                className="min-h-10 min-w-0 resize-y rounded-md border border-line px-3 py-2 text-sm"
              />
            </div>
            <div className="grid min-w-0 gap-1.5 sm:col-span-2">
              <label
                htmlFor={`edit-organization-${record.id}`}
                className="text-xs font-semibold text-ink"
              >
                Organización responsable
              </label>
              <textarea
                id={`edit-organization-${record.id}`}
                rows={2}
                value={organization}
                onChange={(event) => setOrganization(event.target.value)}
                className="min-h-10 min-w-0 resize-y rounded-md border border-line px-3 py-2 text-sm"
              />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <label
                htmlFor={`edit-reason-${record.id}`}
                className="text-xs font-semibold text-ink"
              >
                Motivo del cambio
              </label>
              <input
                id={`edit-reason-${record.id}`}
                required
                maxLength={300}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
              />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <label
                htmlFor={`edit-password-${record.id}`}
                className="text-xs font-semibold text-ink"
              >
                Contraseña de la cuenta
              </label>
              <input
                id={`edit-password-${record.id}`}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => requestAction("edited")}
                className="min-h-10 rounded-md bg-accent px-3 text-sm font-semibold text-white hover:bg-[#125746] disabled:opacity-50"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => requestAction("deleted")}
                className="min-h-10 rounded-md border border-red-700 px-3 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
              >
                Retirar lote
              </button>
            </div>
          </form>
          {!lotEditDraft.isReady && (
            <p className="mt-2 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
              Restaurando la edición de este lote…
            </p>
          )}
          {lotEditDraft.isReady && (
            <p className="mt-2 mb-0 text-xs text-gray-700">
              Por seguridad, la contraseña y los archivos de imagen no se sincronizan entre
              navegadores.
            </p>
          )}
        </details>
      )}
      {message && (
        <p className="mt-3 mb-0 text-sm text-accent" role="status">
          {message}
        </p>
      )}
      <ConfirmDialog
        open={isDialogOpen}
        title={
          pendingAction === "deleted" ? "Confirmar retiro del lote" : "Confirmar cambios del lote"
        }
        description={
          pendingAction === "deleted"
            ? "Se ocultará la ficha pública y el lote dejará el listado activo. El registro de auditoría se conservará."
            : "Se actualizarán los datos del lote y se añadirá una entrada al historial con la fecha, el responsable y el motivo."
        }
        helperText="Conserva los primeros 8 caracteres del ID del lote que aparece en el QR; ese prefijo sirve para buscarlo en otros perfiles."
        confirmLabel={pendingAction === "deleted" ? "Retirar lote" : "Guardar cambios"}
        isBusy={isBusy}
        onCancel={() => {
          setIsDialogOpen(false);
          setPendingAction(null);
        }}
        onConfirm={() => void confirmAction()}
      />
    </section>
  );
}
