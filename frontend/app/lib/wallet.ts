"use client";

import { useEffect, useState } from "react";
import type { Address, Hex } from "viem";

type EthereumProvider = {
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function useInjectedWallet() {
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  async function refresh() {
    if (!window.ethereum) return;
    const accounts = await window.ethereum.request<string[]>({ method: "eth_accounts" });
    const chain = await window.ethereum.request<string>({ method: "eth_chainId" });
    setAddress((accounts[0] as Address) || null);
    setChainId(Number.parseInt(chain, 16));
  }

  async function connect() {
    if (!window.ethereum) throw new Error("No injected wallet found");
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request<string[]>({ method: "eth_requestAccounts" });
      const chain = await window.ethereum.request<string>({ method: "eth_chainId" });
      setAddress((accounts[0] as Address) || null);
      setChainId(Number.parseInt(chain, 16));
    } finally {
      setIsConnecting(false);
    }
  }

  async function switchToXLayer() {
    if (!window.ethereum) throw new Error("No injected wallet found");
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0xc4",
          chainName: "X Layer",
          nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
          rpcUrls: ["https://rpc.xlayer.tech", "https://xlayerrpc.okx.com"],
          blockExplorerUrls: ["https://www.okx.com/web3/explorer/xlayer"]
        }
      ]
    });
    await refresh();
  }

  async function sendTransaction(to: Address, data: Hex) {
    if (!window.ethereum || !address) throw new Error("Connect wallet first");
    return window.ethereum.request<Hex>({
      method: "eth_sendTransaction",
      params: [{ from: address, to, data }]
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  return { address, chainId, isConnecting, connect, switchToXLayer, sendTransaction };
}
