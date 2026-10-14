"use client";

import { useContext } from "react";
import { StellarWalletContext } from "@/components/providers/StellarWalletProvider";

export function useStellarWallet() {
  const wallet = useContext(StellarWalletContext);
  if (!wallet) {
    throw new Error("useStellarWallet debe usarse dentro de StellarWalletProvider.");
  }

  return wallet;
}
