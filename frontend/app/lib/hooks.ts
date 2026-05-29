"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, decodeEventLog, http, type Address, type Log } from "viem";
import { appConfig, isConfigured, zeroHash } from "./config";
import { stateViewAbi } from "./stateViewAbi";
import { xordersAbi } from "./xordersAbi";

export type IndexedOrder = {
  id: bigint;
  owner: Address;
  poolId: string;
  kind: "Stop-Loss" | "Take-Profit" | "Trailing Stop";
  amountIn: bigint;
  remainingIn: bigint;
  inputToken?: Address;
  outputToken?: Address;
  triggerPriceX96: bigint;
  status: "Open" | "Triggered" | "Partially Filled" | "Filled" | "Cancelled";
  updatedBlock: bigint;
};

export type IndexedActivity = {
  id: string;
  type: string;
  orderId: bigint;
  blockNumber: bigint;
  transactionHash: string;
  indexedAt: number;
};

const kindNames = ["Stop-Loss", "Take-Profit", "Trailing Stop"] as const;
const publicClient = createPublicClient({ transport: http(appConfig.rpcUrl) });
const LOG_BLOCK_CHUNK = 90n;
const MAX_BLOCKS_PER_SCAN = 540n;
const EVENT_POLL_MS = 30_000;
const LOG_CHUNK_DELAY_MS = 450;

export function useXLayerStatus() {
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const block = await publicClient.getBlockNumber();
      if (active) setBlockNumber(block);
    }

    load();
    const timer = window.setInterval(load, 12_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return { data: blockNumber };
}

export function usePoolSlot0() {
  const [slot0, setSlot0] = useState<{
    sqrtPriceX96: bigint;
    tick: number;
    protocolFee: number;
    lpFee: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (appConfig.poolId === zeroHash) {
        setSlot0(null);
        return;
      }

      try {
        const result = await publicClient.readContract({
          address: appConfig.stateView,
          abi: stateViewAbi,
          functionName: "getSlot0",
          args: [appConfig.poolId]
        });
        if (!active) return;
        setSlot0({
          sqrtPriceX96: result[0],
          tick: result[1],
          protocolFee: result[2],
          lpFee: result[3]
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to read pool state");
      }
    }

    load();
    const timer = window.setInterval(load, 12_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return { slot0, error };
}

export function useXOrdersEvents() {
  const [owner, setOwner] = useState<Address | undefined>();
  const [orders, setOrders] = useState<IndexedOrder[]>([]);
  const [activities, setActivities] = useState<IndexedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logsRef = useRef<Log[]>([]);
  const lastScannedBlockRef = useRef<bigint | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!isConfigured()) {
        setOrders([]);
        setActivities([]);
        return;
      }

      setIsLoading(true);
        try {
        const latest = await publicClient.getBlockNumber();
        const fromBlock = lastScannedBlockRef.current === null ? appConfig.deployBlock : lastScannedBlockRef.current + 1n;
        if (fromBlock > latest) {
          setIsLoading(false);
          return;
        }

        const scanToBlock = fromBlock + MAX_BLOCKS_PER_SCAN - 1n > latest ? latest : fromBlock + MAX_BLOCKS_PER_SCAN - 1n;
        const newLogs = await getHookLogs(fromBlock, scanToBlock);

        if (!active) return;
        const mergedLogs = dedupeLogs([...logsRef.current, ...newLogs]);
        const parsed = reduceLogs(mergedLogs, owner);
        logsRef.current = mergedLogs;
        lastScannedBlockRef.current = scanToBlock;
        setOrders(parsed.orders);
        setActivities(parsed.activities);
        setError(null);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Unable to load hook logs";
        setError(message.includes("rate limit") || message.includes("block range") ? "X Layer RPC is limiting log reads. Retrying automatically in smaller batches." : message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    const timer = window.setInterval(load, EVENT_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [owner]);

  useEffect(() => {
    async function loadOwner() {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request<string[]>({ method: "eth_accounts" });
      setOwner((accounts[0] as Address) || undefined);
    }

    loadOwner();

    const handleAccountsChanged = (accounts: unknown) => {
      const addrs = accounts as string[];
      setOwner((addrs[0] as Address) || undefined);
      lastScannedBlockRef.current = null;
      logsRef.current = [];
    };

    window.ethereum?.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return useMemo(
    () => ({ orders, activities, isLoading, error, configured: isConfigured() }),
    [orders, activities, isLoading, error]
  );
}

function dedupeLogs(logs: Log[]) {
  const seen = new Set<string>();
  const result: Log[] = [];

  for (const log of logs) {
    const key = `${log.transactionHash}-${log.logIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(log);
  }

  return result;
}

async function getHookLogs(fromBlock: bigint, toBlock: bigint) {
  const logs: Log[] = [];
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    const chunkEnd = cursor + LOG_BLOCK_CHUNK - 1n > toBlock ? toBlock : cursor + LOG_BLOCK_CHUNK - 1n;
    const chunk = await publicClient.getLogs({
      address: appConfig.hookAddress,
      fromBlock: cursor,
      toBlock: chunkEnd
    });
    logs.push(...chunk);
    cursor = chunkEnd + 1n;
    if (cursor <= toBlock) await sleep(LOG_CHUNK_DELAY_MS);
  }

  return logs;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function reduceLogs(logs: Log[], owner?: Address) {
  const orders = new Map<string, IndexedOrder>();
  const activities: IndexedActivity[] = [];

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({ abi: xordersAbi, data: log.data, topics: log.topics });
      const args = decoded.args as Record<string, unknown>;
      const orderId = args.orderId as bigint;

      activities.unshift({
        id: `${log.transactionHash}-${log.logIndex}`,
        type: decoded.eventName,
        orderId,
        blockNumber: log.blockNumber ?? 0n,
        transactionHash: log.transactionHash ?? "",
        indexedAt: Date.now()
      });

      if (decoded.eventName === "OrderPlaced") {
        const orderOwner = args.owner as Address;
        if (owner && orderOwner.toLowerCase() !== owner.toLowerCase()) continue;
        orders.set(orderId.toString(), {
          id: orderId,
          owner: orderOwner,
          poolId: args.poolId as string,
          kind: kindNames[Number(args.kind as bigint)] ?? "Stop-Loss",
          amountIn: args.amountIn as bigint,
          remainingIn: args.amountIn as bigint,
          inputToken: args.inputToken as Address | undefined,
          outputToken: args.outputToken as Address | undefined,
          triggerPriceX96: args.triggerPriceX96 as bigint,
          status: "Open",
          updatedBlock: log.blockNumber ?? 0n
        });
      }

      const existing = orders.get(orderId.toString());
      if (!existing) continue;

      if (decoded.eventName === "OrderTriggered") existing.status = "Triggered";
      if (decoded.eventName === "OrderFilled") {
        const inputAmount = args.inputAmount as bigint;
        existing.remainingIn = inputAmount >= existing.remainingIn ? 0n : existing.remainingIn - inputAmount;
        existing.status = existing.remainingIn === 0n ? "Filled" : "Partially Filled";
      }
      if (decoded.eventName === "OrderCancelled") existing.status = "Cancelled";
      existing.updatedBlock = log.blockNumber ?? existing.updatedBlock;
    } catch {
      continue;
    }
  }

  return { orders: Array.from(orders.values()).sort((a, b) => Number(b.updatedBlock - a.updatedBlock)), activities };
}
