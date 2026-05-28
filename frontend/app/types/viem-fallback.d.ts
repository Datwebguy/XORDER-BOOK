declare module "viem" {
  export type Address = `0x${string}`;
  export type Hex = `0x${string}`;
  export type Log = {
    address: Address;
    data: Hex;
    topics: readonly Hex[];
    blockNumber?: bigint | null;
    transactionHash?: Hex | null;
    logIndex?: number | null;
  };

  export function defineChain<T>(chain: T): T;
  export function parseUnits(value: string, decimals: number): bigint;
  export function encodeFunctionData(args: {
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }): Hex;
  export function http(url?: string): unknown;
  export function createPublicClient(args: { transport: unknown }): {
    getBlockNumber(): Promise<bigint>;
    getLogs(args: { address: Address; fromBlock: bigint; toBlock: bigint }): Promise<Log[]>;
    readContract(args: {
      address: Address;
      abi: readonly unknown[];
      functionName: string;
      args?: readonly unknown[];
    }): Promise<readonly [bigint, number, number, number]>;
  };
  export function decodeEventLog(args: {
    abi: readonly unknown[];
    data: Hex;
    topics: readonly Hex[];
  }): {
    eventName: string;
    args: Record<string, unknown>;
  };
}
