"use client";

import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getWalletNetworkLabel, stellarNetwork } from "@/lib/stellar/network";

type WalletKit = {
  getAddress: () => Promise<{ address: string }>;
  getNetwork: () => Promise<{ network: string; networkPassphrase: string }>;
  authModal: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  signTransaction: (
    xdr: string,
    options: { address: string; networkPassphrase: string },
  ) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
};

type StellarWalletContextValue = {
  address: string | null;
  networkPassphrase: string | null;
  isReady: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
};

export const StellarWalletContext = createContext<StellarWalletContextValue | null>(null);

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const kitRef = useRef<WalletKit | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      import("@creit.tech/stellar-wallets-kit/sdk"),
      import("@creit.tech/stellar-wallets-kit/modules/freighter"),
      import("@creit.tech/stellar-wallets-kit/modules/albedo"),
      import("@creit.tech/stellar-wallets-kit/modules/xbull"),
      import("@creit.tech/stellar-wallets-kit/modules/rabet"),
      import("@creit.tech/stellar-wallets-kit/types"),
    ])
      .then(async ([sdk, freighter, albedo, xbull, rabet, types]) => {
        sdk.StellarWalletsKit.init({
          modules: [
            new freighter.FreighterModule(),
            new albedo.AlbedoModule(),
            new xbull.xBullModule(),
            new rabet.RabetModule(),
          ],
          network:
            stellarNetwork.name === "testnet" ? types.Networks.TESTNET : types.Networks.PUBLIC,
          authModal: { hideUnsupportedWallets: true },
        });
        kitRef.current = sdk.StellarWalletsKit;

        try {
          const wallet = await sdk.StellarWalletsKit.getAddress();
          if (isMounted) {
            setAddress(wallet.address);
            const network = await sdk.StellarWalletsKit.getNetwork();
            setNetworkPassphrase(network.networkPassphrase);
          }
        } catch {
          if (isMounted) {
            setAddress(null);
            setNetworkPassphrase(null);
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
      void kitRef.current?.disconnect();
    };
  }, []);

  async function connect() {
    if (!kitRef.current) {
      throw new Error("La wallet todavía se está preparando. Inténtalo de nuevo.");
    }

    const wallet = await kitRef.current.authModal();
    setAddress(wallet.address);
    const network = await kitRef.current.getNetwork();
    setNetworkPassphrase(network.networkPassphrase);
    return wallet.address;
  }

  async function disconnect() {
    await kitRef.current?.disconnect();
    setAddress(null);
    setNetworkPassphrase(null);
  }

  async function signTransaction(xdr: string) {
    if (!kitRef.current || !address) {
      throw new Error("Conecta una wallet de Stellar antes de firmar.");
    }

    const walletNetwork = await kitRef.current.getNetwork();
    setNetworkPassphrase(walletNetwork.networkPassphrase);
    if (walletNetwork.networkPassphrase !== stellarNetwork.passphrase) {
      throw new Error(
        `La wallet está en ${getWalletNetworkLabel(walletNetwork.networkPassphrase)} y la aplicación usa ${stellarNetwork.label}. Cambia la red de la wallet antes de firmar.`,
      );
    }

    const { signedTxXdr, signerAddress } = await kitRef.current.signTransaction(xdr, {
      address,
      networkPassphrase: stellarNetwork.passphrase,
    });

    if (signerAddress && signerAddress !== address) {
      throw new Error("La wallet activa cambió durante la firma. Vuelve a conectar e inténtalo.");
    }

    return signedTxXdr;
  }

  return (
    <StellarWalletContext.Provider
      value={{ address, networkPassphrase, isReady, connect, disconnect, signTransaction }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}
