"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { setTraceabilityActorAuthorization } from "@/lib/stellar/write";

export function TraceabilityActorAccess() {
  const { address, signTransaction } = useStellarWallet();
  const [actorAddress, setActorAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    void updateAuthorization(true);
  }

  return (
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="traceability-actors-title">
      <h3 id="traceability-actors-title" className="mb-2 text-lg font-semibold text-ink">
        Acceso de escritura al contrato
      </h3>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-gray-700">
        Solo la wallet administradora configurada en `__constructor` puede autorizar o revocar
        actores. Cada cambio se simula, muestra su tarifa y requiere firma en la wallet.
      </p>
      <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]" onSubmit={authorizeActor}>
        <div className="grid gap-1.5">
          <label htmlFor="traceability-actor-address" className="text-sm font-semibold text-ink">
            Wallet Stellar del actor
          </label>
          <input
            id="traceability-actor-address"
            required
            autoComplete="off"
            spellCheck={false}
            value={actorAddress}
            onChange={(event) => setActorAddress(event.target.value.trim())}
            className="min-h-11 rounded-md border border-line bg-white px-3 font-mono text-xs text-ink"
            placeholder="G…"
          />
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
          onClick={() => void updateAuthorization(false)}
          className="min-h-11 self-end rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Revocar
        </button>
      </form>
    </section>
  );
}
