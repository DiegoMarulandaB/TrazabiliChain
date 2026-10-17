"use client";

import { ArrowSquareOut, SignOut, Wallet } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useStellarWallet } from "@/hooks/useStellarWallet";

export function WalletConnect() {
  const { address, connect, disconnect, isReady } = useStellarWallet();

  async function handleConnect() {
    try {
      const address = await connect();
      toast.success("Wallet de Stellar conectada.", {
        description: `${address.slice(0, 6)}…${address.slice(-5)}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo conectar la wallet.");
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect();
      toast.success("Wallet desconectada.");
    } catch {
      toast.error("No se pudo desconectar la wallet.");
    }
  }

  if (!address) {
    return (
      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={!isReady}
        data-tour-wallet-control
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition-colors hover:bg-paper disabled:cursor-wait disabled:opacity-60"
      >
        <Wallet size={17} aria-hidden="true" />
        <span>{isReady ? "Conectar wallet" : "Preparando wallet…"}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://stellar.expert/explorer/testnet/account/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-md border border-line bg-white px-3 font-mono text-xs text-ink hover:bg-paper focus-visible:outline-offset-2"
        aria-label={`Wallet conectada ${address}. Abrir cuenta en Stellar Expert, nueva pestaña`}
      >
        <span className="max-w-48 truncate">{address}</span>
        <ArrowSquareOut size={15} aria-hidden="true" />
      </a>
      <button
        type="button"
        onClick={() => void handleDisconnect()}
        className="inline-flex size-10 items-center justify-center rounded-md border border-line text-gray-700 hover:bg-white focus-visible:outline-offset-2"
        aria-label="Desconectar wallet"
        title="Desconectar wallet"
      >
        <SignOut size={17} aria-hidden="true" />
      </button>
      <span className="sr-only" aria-live="polite">
        Wallet de Stellar Testnet conectada.
      </span>
    </div>
  );
}
