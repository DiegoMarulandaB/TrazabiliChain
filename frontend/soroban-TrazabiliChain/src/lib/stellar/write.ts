import { Address, Networks, TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { Buffer } from "buffer";
import { Client as TraceabilityRegistryClient } from "@trazabilichain/traceability-registry";
import { formatStellarAddress } from "@/lib/stellar/format-address";

const testnetRpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const contractId = process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID;

export type SignTransaction = (xdr: string) => Promise<string>;

function explainSorobanError(message: string) {
  if (/unauthorized|(?:host)?error\s*\(\s*contract\s*,\s*#?1\s*\)/i.test(message)) {
    return "El contrato rechazó la huella: esta wallet no es la administradora ni está autorizada para escribir. Conecta la wallet administradora en el perfil Administrador de organización y autoriza esta dirección. Si no tienes acceso a esa cuenta, un administrador debe desplegar un contrato de Testnet nuevo con la wallet de demo como administrador.";
  }

  return message;
}

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
  try {
    await invocation.simulate({ useUpgradedAuth: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(explainSorobanError(message));
  }

  const simulation = invocation.simulation;
  if (!simulation || rpc.Api.isSimulationError(simulation)) {
    throw new Error(
      explainSorobanError(
        simulation?.error ?? "Stellar no devolvió el resultado de la simulación.",
      ),
    );
  }

  if (hasContractError(invocation.result) && invocation.result.isErr()) {
    throw new Error(explainSorobanError(invocation.result.unwrapErr().message));
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

export async function getTraceabilityContractAdmin() {
  if (!contractId) {
    throw new Error("Configura NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID con el contrato desplegado.");
  }

  const server = new rpc.Server(testnetRpcUrl);
  try {
    const instance = await server.getContractInstance(contractId);
    const adminEntry = instance.storage()?.find((entry) => {
      const keyParts = entry.key().vec();
      return keyParts?.[0]?.sym()?.toString() === "Admin";
    });
    const adminValue = adminEntry?.val().address();
    if (!adminValue) throw new Error("El contrato no contiene una dirección administradora.");
    return Address.fromScAddress(adminValue).toString();
  } catch {
    throw new Error("No se pudo leer la wallet administradora del contrato en Testnet.");
  }
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

  const contractAdmin = await getTraceabilityContractAdmin();

  if (adminAddress !== contractAdmin) {
    throw new Error(
      `La wallet conectada (${formatStellarAddress(adminAddress)}) no es la administradora de este contrato. Conecta ${formatStellarAddress(contractAdmin)} en Freighter. El campo “Wallet Stellar del actor” es para la dirección que quieres autorizar, no para la administradora.`,
    );
  }

  if (actorAddress === contractAdmin) {
    throw new Error(
      "La dirección del campo de actor coincide con la administradora. Ingresa la wallet del actor que quieres autorizar.",
    );
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
