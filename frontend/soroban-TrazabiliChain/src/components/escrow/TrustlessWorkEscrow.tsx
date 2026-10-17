"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useWorkDraft } from "@/hooks/useWorkDraft";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { buildSingleReleaseEscrow, submitSignedEscrow } from "@/lib/stellar/trustless-work";
import type { LotRecord } from "@/lib/lots/lot-storage";

type EscrowPhase = "idle" | "building" | "ready" | "signing" | "submitting" | "confirmed";

type EscrowFields = {
  amount: string;
  assetContractId: string;
  admin: string;
  approver: string;
  serviceProvider: string;
  platform: string;
  disputeResolver: string;
  receiver: string;
};

const initialFields: EscrowFields = {
  amount: "",
  assetContractId: "",
  admin: "",
  approver: "",
  serviceProvider: "",
  platform: "",
  disputeResolver: "",
  receiver: "",
};

const addressFields: Array<{
  key: Exclude<keyof EscrowFields, "amount" | "assetContractId">;
  label: string;
}> = [
  { key: "admin", label: "Administrador del escrow" },
  { key: "approver", label: "Wallet del comprador que aprueba" },
  { key: "serviceProvider", label: "Wallet del proveedor" },
  { key: "platform", label: "Wallet de plataforma" },
  { key: "disputeResolver", label: "Wallet que resuelve disputas" },
  { key: "receiver", label: "Wallet que recibe el pago" },
];

export function TrustlessWorkEscrow({
  records,
  draftUserId,
  product,
}: {
  records: LotRecord[];
  draftUserId: string | null;
  product: string;
}) {
  const { address, signTransaction } = useStellarWallet();
  const [fields, setFields] = useState(initialFields);
  const [selectedLotId, setSelectedLotId] = useState(records[0]?.id ?? "");
  const [phase, setPhase] = useState<EscrowPhase>("idle");
  const [build, setBuild] = useState<Awaited<ReturnType<typeof buildSingleReleaseEscrow>> | null>(
    null,
  );
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null);
  const [isPreparationConfirmationOpen, setIsPreparationConfirmationOpen] = useState(false);
  const preparationConfirmed = useRef(false);
  const escrowFormRef = useRef<HTMLFormElement>(null);

  const selectedLot = records.find((record) => record.id === selectedLotId);
  const escrowDraft = useWorkDraft({
    userId: draftUserId,
    role: "b2bBuyer",
    product,
    draftKey: "b2b-escrow",
    payload: { fields, selectedLotId },
    onRestore: (draft) => {
      if (draft.fields) setFields({ ...initialFields, ...draft.fields });
      if (draft.selectedLotId && records.some((record) => record.id === draft.selectedLotId)) {
        setSelectedLotId(draft.selectedLotId);
      }
    },
  });

  function updateField(field: keyof EscrowFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setBuild(null);
    setPhase("idle");
  }

  async function prepareEscrow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preparationConfirmed.current) {
      setIsPreparationConfirmationOpen(true);
      return;
    }
    preparationConfirmed.current = false;
    if (!address || !selectedLot) {
      toast.error("Conecta una wallet y selecciona un lote antes de preparar el escrow.");
      return;
    }

    const amount = Number(fields.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor que cero.");
      return;
    }

    const otherAddresses = [
      fields.approver,
      fields.serviceProvider,
      fields.platform,
      address,
      fields.disputeResolver,
      fields.receiver,
    ];
    if (!fields.admin || otherAddresses.includes(fields.admin)) {
      toast.error("El administrador debe ser una dirección distinta a los demás roles.");
      return;
    }
    const otherRoleAddresses = [
      fields.approver,
      fields.serviceProvider,
      fields.platform,
      address,
      fields.receiver,
    ];
    if (!fields.disputeResolver || otherRoleAddresses.includes(fields.disputeResolver)) {
      toast.error("Configura un resolvedor de disputas distinto a los demás roles.");
      return;
    }

    setPhase("building");
    setConfirmedTxHash(null);
    const toastId = toast.loading("Construyendo y simulando el escrow en Testnet…");

    try {
      const built = await buildSingleReleaseEscrow({
        signer: address,
        engagementId: selectedLot.id,
        title: `Compra de ${selectedLot.product}`.slice(0, 120),
        description: `Escrow de pago asociado al lote ${selectedLot.id}.`,
        amount,
        platformFee: 0,
        roles: {
          approvers: [fields.approver],
          serviceProviders: [fields.serviceProvider],
          platform: fields.platform,
          releaseSigners: [address],
          disputeResolvers: [fields.disputeResolver],
          receiver: fields.receiver,
          admin: fields.admin,
        },
        milestones: [
          { description: `Entrega y recepción del lote ${selectedLot.id}`, approvalsTarget: 1 },
        ],
        trustline: { contractId: fields.assetContractId, symbol: "USDC" },
      });
      setBuild(built);
      setPhase("ready");
      toast.success("Simulación lista. Revisa la tarifa y confirma la firma.", {
        id: toastId,
        description: `Tarifa estimada: ${built.feeXlm} XLM`,
      });
    } catch (error) {
      setPhase("idle");
      toast.error(error instanceof Error ? error.message : "No se pudo preparar el escrow.", {
        id: toastId,
      });
    }
  }

  async function signAndSubmit() {
    if (!build || !address) {
      return;
    }

    const toastId = toast.loading("Esperando la firma de la wallet…");
    setPhase("signing");
    try {
      const signedXdr = await signTransaction(build.unsignedXdr);
      setPhase("submitting");
      toast.loading("Enviando a Stellar y esperando confirmación…", { id: toastId });
      const result = await submitSignedEscrow(signedXdr);
      setConfirmedTxHash(result.txHash);
      setPhase("confirmed");
      setBuild(null);
      toast.success("Escrow confirmado en Stellar Testnet.", {
        id: toastId,
        description: `Ledger ${result.ledger} · ${build.feeXlm} XLM`,
      });
    } catch (error) {
      setPhase(build ? "ready" : "idle");
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el escrow.", {
        id: toastId,
      });
    }
  }

  return (
    <section className="mt-10 border-t border-line pt-8" aria-labelledby="escrow-title">
      <p className="mb-2 text-[11px] font-bold text-accent">PAGO OPCIONAL · TESTNET</p>
      <h2 id="escrow-title" className="mb-2 font-display text-2xl font-medium text-ink">
        Pago por hitos con Trustless Work
      </h2>
      <p className="mb-6 max-w-3xl text-sm leading-6 text-gray-700">
        Este flujo opcional usa un escrow existente de Stellar; no reemplaza el registro de
        trazabilidad ni demuestra que los datos del lote sean verdaderos. La wallet conectada firma
        y paga la tarifa de red.
      </p>

      {!selectedLot ? (
        <p className="mb-0 text-sm text-gray-700">
          Registra un lote para asociar un escrow de compra.
        </p>
      ) : (
        <>
          <form
            ref={escrowFormRef}
            className="grid min-w-0 gap-5"
            onSubmit={prepareEscrow}
            inert={!escrowDraft.isReady}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="escrow-lot" className="text-sm font-semibold text-ink">
                  Lote asociado
                </label>
                <select
                  id="escrow-lot"
                  value={selectedLotId}
                  onChange={(event) => setSelectedLotId(event.target.value)}
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
                <label htmlFor="escrow-amount" className="text-sm font-semibold text-ink">
                  Monto en USDC de prueba
                </label>
                <input
                  id="escrow-amount"
                  type="number"
                  min="0.0000001"
                  step="any"
                  required
                  value={fields.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="escrow-asset" className="text-sm font-semibold text-ink">
                  Dirección del contrato de activo (SAC) en Testnet
                </label>
                <input
                  id="escrow-asset"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  value={fields.assetContractId}
                  onChange={(event) => updateField("assetContractId", event.target.value.trim())}
                  className="min-h-11 rounded-md border border-line bg-white px-3 font-mono text-xs text-ink"
                  placeholder="C…"
                />
              </div>
            </div>

            <fieldset className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold text-ink">Roles del escrow</legend>
              {addressFields.map(({ key, label }) => (
                <div className="grid gap-1.5" key={key}>
                  <label htmlFor={`escrow-${key}`} className="text-xs font-semibold text-ink">
                    {label}
                  </label>
                  <input
                    id={`escrow-${key}`}
                    required
                    autoComplete="off"
                    spellCheck={false}
                    value={fields[key]}
                    onChange={(event) => updateField(key, event.target.value.trim())}
                    className="min-h-10 rounded-md border border-line bg-white px-3 font-mono text-xs text-ink"
                    placeholder="G…"
                  />
                </div>
              ))}
              <p className="mb-0 text-xs leading-5 text-gray-700 sm:col-span-2">
                La wallet conectada será quien inicia y firma el despliegue. El administrador debe
                ser distinto de los demás roles; el activo y cada dirección deben corresponder a
                Stellar Testnet. La wallet de plataforma se captura como dirección porque esta
                instalación no mantiene un directorio de wallets preconfiguradas para ofrecer una
                lista segura.
              </p>
            </fieldset>

            <button
              type="submit"
              disabled={phase === "building" || phase === "signing" || phase === "submitting"}
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-[#28504c] disabled:cursor-wait disabled:opacity-60"
            >
              {phase === "building" ? "Construyendo y simulando…" : "Preparar y simular escrow"}
            </button>
          </form>
          {!escrowDraft.isReady && (
            <p className="mt-3 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
              Restaurando el borrador de compra de tu cuenta…
            </p>
          )}
          <ConfirmDialog
            open={isPreparationConfirmationOpen}
            title="Revisa los datos antes de simular"
            description="Confirma el lote, el monto, el activo y las wallets de cada rol. La simulación consultará Stellar Testnet, pero no enviará el escrow hasta que firmes después."
            helperText="Conserva los primeros 8 caracteres del ID del lote que aparece en el QR para volver a localizarlo."
            isBusy={phase === "building"}
            onCancel={() => {
              preparationConfirmed.current = false;
              setIsPreparationConfirmationOpen(false);
            }}
            onConfirm={() => {
              preparationConfirmed.current = true;
              setIsPreparationConfirmationOpen(false);
              escrowFormRef.current?.requestSubmit();
            }}
          />

          {build && phase === "ready" && (
            <div className="mt-5 grid gap-3 border-l-2 border-accent bg-accent-soft/60 px-4 py-4">
              <p className="mb-0 text-sm font-semibold text-ink">Simulación completada</p>
              <p className="mb-0 break-all font-mono text-xs text-gray-700">
                Contrato previsto: {build.contractId}
              </p>
              <p className="mb-0 text-sm text-ink">
                Tarifa estimada que pagará la wallet: <strong>{build.feeXlm} XLM</strong>
              </p>
              <button
                type="button"
                onClick={() => void signAndSubmit()}
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746]"
              >
                Firmar y enviar
              </button>
            </div>
          )}

          {(phase === "signing" || phase === "submitting") && (
            <p className="mt-4 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
              {phase === "signing"
                ? "Firma solicitada a la wallet…"
                : "Esperando confirmación de Stellar…"}
            </p>
          )}

          {confirmedTxHash && (
            <p className="mt-4 mb-0 break-all text-sm text-accent" role="status">
              Escrow confirmado:{" "}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${confirmedTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {confirmedTxHash}
              </a>
            </p>
          )}
        </>
      )}
    </section>
  );
}
