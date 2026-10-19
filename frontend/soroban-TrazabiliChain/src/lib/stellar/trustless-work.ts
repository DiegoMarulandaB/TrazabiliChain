import { TransactionBuilder } from "@stellar/stellar-sdk";
import type { DeploySingleReleaseEscrowPayload } from "@trustless-work/escrow-js/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { stellarNetwork } from "@/lib/stellar/network";

type BuiltEscrow = {
  unsignedXdr: string;
  contractId: string;
  txHash: string;
  feeXlm: string;
};

type SubmittedEscrow = {
  txHash: string;
  ledger: number;
  contractId?: string;
  code?: string;
  message?: string;
};

async function callEscrowApi(body: Record<string, unknown>) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = (await supabase?.auth.getSession()) ?? {
    data: { session: null },
    error: null,
  };
  const accessToken = data.session?.access_token;
  if (error || !accessToken) {
    throw new Error("Tu sesión expiró. Inicia sesión de nuevo para continuar.");
  }

  const response = await fetch("/api/stellar/escrow", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "La integración de escrow no pudo completar la solicitud.";
    throw new Error(message);
  }

  return result;
}

export async function buildSingleReleaseEscrow(payload: DeploySingleReleaseEscrowPayload) {
  const result = (await callEscrowApi({ action: "build", payload })) as Omit<BuiltEscrow, "feeXlm">;
  const transaction = TransactionBuilder.fromXDR(result.unsignedXdr, stellarNetwork.passphrase);
  const feeXlm = (Number(BigInt(transaction.fee)) / 10_000_000).toFixed(7);
  return { ...result, feeXlm } satisfies BuiltEscrow;
}

export async function submitSignedEscrow(signedXdr: string) {
  return (await callEscrowApi({ action: "submit", signedXdr })) as SubmittedEscrow;
}
