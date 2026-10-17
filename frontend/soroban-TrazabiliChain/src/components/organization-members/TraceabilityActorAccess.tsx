"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useWorkDraft } from "@/hooks/useWorkDraft";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { setTraceabilityActorAuthorization } from "@/lib/stellar/write";

export function TraceabilityActorAccess({
  draftUserId,
  product,
}: {
  draftUserId: string | null;
  product: string;
}) {
  const { address, signTransaction } = useStellarWallet();
  const [actorAddress, setActorAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAuthorization, setPendingAuthorization] = useState<boolean | null>(null);
  const actorDraft = useWorkDraft({
    userId: draftUserId,
    role: "organizationAdmin",
    product,
    draftKey: "authorized-actor-address",
    payload: { actorAddress },
    onRestore: (draft) => {
      if (draft.actorAddress !== undefined) setActorAddress(draft.actorAddress);
    },
  });

  async function updateAuthorization(authorized: boolean) {
    if (!address) {
      toast.error("Conecta la wallet administradora del contrato.");
      return;
    }
    if (!actorAddress.trim()) {
      toast.error("Ingresa una dirección Stellar para actualizar.");
      return;
    }

    const toastId = toast.loading(
      authorized ? "Autorizando wallet en Stellar…" : "Revocando wallet en Stellar…",
    );
    setIsSubmitting(true);
    try {
      const result = await setTraceabilityActorAuthorization(
        address,
        actorAddress.trim(),
        authorized,
        signTransaction,
      );
      toast.success(
        authorized ? "Wallet autorizada en el contrato." : "Acceso revocado en el contrato.",
        {
          id: toastId,
          description: `Tarifa de red: ${result.feeXlm} XLM`,
        },
      );
      setActorAddress("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el acceso.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function authorizeActor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAuthorization(true);
  }

  return (
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="traceability-actors-title">
      <h3 id="traceability-actors-title" className="mb-2 text-lg font-semibold text-ink">
        Acceso de escritura al contrato
      </h3>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-gray-700">
        La wallet conectada en Freighter debe ser la administradora configurada en `__constructor`.
        En el campo siguiente escribe la dirección del actor que quieres autorizar o revocar, no la
        dirección administradora. El contrato verificará el permiso antes de solicitar una firma.
      </p>
      {address && (
        <p className="mb-4 break-all font-mono text-xs text-gray-700" role="status">
          Wallet conectada: {address}
        </p>
      )}
      <form
        className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
        onSubmit={authorizeActor}
        inert={!actorDraft.isReady}
      >
        <div className="grid gap-1.5">
          <label htmlFor="traceability-actor-address" className="text-sm font-semibold text-ink">
            Dirección del actor que quieres autorizar o revocar
          </label>
          <input
            id="traceability-actor-address"
            required
            autoComplete="off"
            spellCheck={false}
            value={actorAddress}
            onChange={(event) => setActorAddress(event.target.value.trim())}
            aria-describedby="traceability-actor-address-help"
            className="min-h-11 rounded-md border border-line bg-white px-3 font-mono text-xs text-ink"
            placeholder="G…"
          />
          <p id="traceability-actor-address-help" className="mb-0 text-xs leading-5 text-gray-700">
            Si quieres autorizar tu wallet de trabajo, conecta primero la wallet administradora y
            escribe aquí la dirección pública de esa wallet de trabajo.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 self-end rounded-md bg-accent px-3 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-wait disabled:opacity-60"
        >
          Autorizar
        </button>
        <button
          type="button"
          disabled={isSubmitting || !actorAddress.trim()}
          onClick={() => setPendingAuthorization(false)}
          className="min-h-11 self-end rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Revocar
        </button>
      </form>
      {!actorDraft.isReady && (
        <p className="mt-2 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
          Restaurando el formulario de acceso…
        </p>
      )}
      <ConfirmDialog
        open={pendingAuthorization !== null}
        title={pendingAuthorization ? "Confirmar autorización" : "Confirmar revocación"}
        description={`Verifica que la wallet ${actorAddress.trim()} sea correcta. Esta acción solicitará una firma y pagará la tarifa de red.`}
        helperText="Si esta acción corresponde a un lote, conserva los primeros 8 caracteres de su ID del QR; no ingreses la URL completa."
        confirmLabel={pendingAuthorization ? "Autorizar" : "Revocar"}
        isBusy={isSubmitting}
        onCancel={() => setPendingAuthorization(null)}
        onConfirm={() => {
          if (pendingAuthorization !== null) {
            const authorized = pendingAuthorization;
            setPendingAuthorization(null);
            void updateAuthorization(authorized);
          }
        }}
      />
    </section>
  );
}
