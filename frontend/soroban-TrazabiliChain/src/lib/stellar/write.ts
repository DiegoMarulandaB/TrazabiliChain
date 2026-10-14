import { Networks, TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { Buffer } from "buffer";
import { Client as TraceabilityRegistryClient } from "@trazabilichain/traceability-registry";

const testnetRpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const contractId = process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID;

export type SignTransaction = (xdr: string) => Promise<string>;

function hasContractError(
  value: unknown,
): value is { isErr: () => boolean; unwrapErr: () => { message: string } } {
  return (
    typeof value === "object" &&
    value !== null &&
    "isErr" in value &&
    typeof value.isErr === "function" &&
    "unwrapErr" in value &&
    typeof value.unwrapErr === "function"
  );
}

async function simulateSignAndSubmit<T>(
  invocation: AssembledTransaction<T>,
  signTransaction: SignTransaction,
) {
  const server = new rpc.Server(testnetRpcUrl);
  await invocation.simulate({ useUpgradedAuth: true });

  const simulation = invocation.simulation;
  if (!simulation || rpc.Api.isSimulationError(simulation)) {
    throw new Error(simulation?.error ?? "Stellar no devolvió el resultado de la simulación.");
  }

  if (hasContractError(invocation.result) && invocation.result.isErr()) {
    throw new Error(invocation.result.unwrapErr().message);
  }

  const preparedXdr = invocation.toXDR();
  const fee = invocation.built?.fee;
  if (!fee) {
    throw new Error("La simulación no devolvió la tarifa estimada de Stellar.");
  }
  const feeXlm = (Number(BigInt(fee)) / 10_000_000).toFixed(7);
  const signedXdr = await signTransaction(preparedXdr);
  const signedTransaction = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const submission = await server.sendTransaction(signedTransaction);

  if (submission.status !== "PENDING") {
    throw new Error(
      submission.errorResult
        ? "Stellar rechazó la transacción."
        : "No se pudo enviar la transacción a Stellar.",
    );
  }

  const confirmation = await server.pollTransaction(submission.hash, {
    attempts: 12,
    sleepStrategy: () => 750,
  });
  if (confirmation.status === "FAILED") {
    throw new Error("La transacción fue incluida, pero Stellar la marcó como fallida.");
  }
  if (confirmation.status !== "SUCCESS") {
    throw new Error(
      "La transacción sigue pendiente. Consulta el hash en Stellar Expert en unos segundos.",
    );
  }

  return { transactionHash: confirmation.txHash, feeXlm };
}

export async function anchorLotHash(
  walletAddress: string,
  lotId: string,
  hash: string,
  signTransaction: SignTransaction,
) {
  if (!contractId) {
    throw new Error(
      "Configura NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID después de desplegar el contrato.",
    );
  }

  const server = new rpc.Server(testnetRpcUrl);
  try {
    await server.getAccount(walletAddress);
  } catch {
    throw new Error(
      "La wallet no tiene una cuenta financiada en Stellar Testnet. Solicita XLM de prueba y vuelve a intentar.",
    );
  }

  const client = new TraceabilityRegistryClient({
    contractId,
    networkPassphrase: Networks.TESTNET,
    publicKey: walletAddress,
    rpcUrl: testnetRpcUrl,
  });
  const invocation = await client.record_event(
    { actor: walletAddress, lot_id: lotId, event_hash: Buffer.from(hash, "hex") },
    { simulate: false },
  );
  return simulateSignAndSubmit(invocation, signTransaction);
}

export async function setTraceabilityActorAuthorization(
  adminAddress: string,
  actorAddress: string,
  authorized: boolean,
  signTransaction: SignTransaction,
) {
  if (!contractId) {
    throw new Error("Configura NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID con el contrato desplegado.");
  }

  const client = new TraceabilityRegistryClient({
    contractId,
    networkPassphrase: Networks.TESTNET,
    publicKey: adminAddress,
    rpcUrl: testnetRpcUrl,
  });
  const invocation = authorized
    ? await client.authorize_actor(
        { admin: adminAddress, actor: actorAddress },
        { simulate: false },
      )
    : await client.revoke_actor({ admin: adminAddress, actor: actorAddress }, { simulate: false });

  return simulateSignAndSubmit(invocation, signTransaction);
}
