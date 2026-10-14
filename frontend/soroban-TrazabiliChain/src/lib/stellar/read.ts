import { Networks } from "@stellar/stellar-sdk";
import { Client as TraceabilityRegistryClient } from "@trazabilichain/traceability-registry";

const testnetRpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const contractId = process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID;

function getClient() {
  return new TraceabilityRegistryClient({
    contractId: getContractId(),
    networkPassphrase: Networks.TESTNET,
    rpcUrl: testnetRpcUrl,
  });
}

function getContractId() {
  if (!contractId) {
    throw new Error("Configura NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID con el contrato desplegado.");
  }
  return contractId;
}

export async function getLotEventCount(lotId: string) {
  const transaction = await getClient().event_count({ lot_id: lotId });
  return transaction.result;
}

export async function getLotEventHash(lotId: string, eventIndex: number) {
  const transaction = await getClient().event_hash({ lot_id: lotId, event_index: eventIndex });
  const hash = transaction.result;
  return hash ? hash.toString("hex") : null;
}
