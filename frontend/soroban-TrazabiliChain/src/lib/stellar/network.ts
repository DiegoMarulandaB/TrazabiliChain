import { Networks } from "@stellar/stellar-sdk";

export type StellarNetworkName = "testnet" | "mainnet";

const configuredNetwork = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet")
  .trim()
  .toLowerCase();

if (configuredNetwork !== "testnet" && configuredNetwork !== "mainnet") {
  throw new Error("NEXT_PUBLIC_STELLAR_NETWORK debe ser testnet o mainnet.");
}

const name: StellarNetworkName = configuredNetwork;
const isTestnet = name === "testnet";
const configuredRpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL?.trim();

if (!isTestnet && !configuredRpcUrl) {
  throw new Error("Configura NEXT_PUBLIC_SOROBAN_RPC_URL para Stellar Mainnet.");
}

export const stellarNetwork = {
  name,
  label: isTestnet ? "Testnet" : "Mainnet",
  passphrase: isTestnet ? Networks.TESTNET : Networks.PUBLIC,
  explorerSegment: isTestnet ? "testnet" : "public",
  rpcUrl: configuredRpcUrl || "https://soroban-testnet.stellar.org",
};

export function stellarExplorerUrl(resource: "account" | "contract" | "tx", id: string) {
  return `https://stellar.expert/explorer/${stellarNetwork.explorerSegment}/${resource}/${encodeURIComponent(id)}`;
}

export function getWalletNetworkLabel(networkPassphrase: string) {
  if (networkPassphrase === Networks.TESTNET) return "Testnet";
  if (networkPassphrase === Networks.PUBLIC) return "Mainnet";
  return "otra red";
}
