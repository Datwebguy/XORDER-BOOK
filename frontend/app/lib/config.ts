import type { Address, Hex } from "viem";

export const zeroAddress = "0x0000000000000000000000000000000000000000" as const;
export const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

function envAddress(value: string | undefined, fallback: Address): Address {
  return (value && value.startsWith("0x") ? value : fallback) as Address;
}

function envHex(value: string | undefined, fallback: Hex): Hex {
  return (value && value.startsWith("0x") ? value : fallback) as Hex;
}

export const appConfig = {
  chainId: 196,
  rpcUrl: "https://rpc.xlayer.tech",
  alternateRpcUrl: "https://xlayerrpc.okx.com",
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer",
  hookAddress: envAddress(process.env.NEXT_PUBLIC_XORDERS_HOOK_ADDRESS, zeroAddress),
  poolId: envHex(process.env.NEXT_PUBLIC_XORDERS_POOL_ID, zeroHash),
  deployBlock: BigInt(process.env.NEXT_PUBLIC_XORDERS_DEPLOY_BLOCK || "0"),
  poolManager: envAddress(process.env.NEXT_PUBLIC_POOL_MANAGER, "0x360e68faccca8ca495c1b759fd9eee466db9fb32"),
  positionManager: envAddress(process.env.NEXT_PUBLIC_POSITION_MANAGER, "0xcf1eafc6928dc385a342e7c6491d371d2871458b"),
  stateView: envAddress(process.env.NEXT_PUBLIC_STATE_VIEW, "0x76fd297e2d437cd7f76d50f01afe6160f86e9990"),
  universalRouter: envAddress(process.env.NEXT_PUBLIC_UNIVERSAL_ROUTER, "0xda00ae15d3a71466517129255255db7c0c0956d3")
};

export function isConfigured() {
  return appConfig.hookAddress !== zeroAddress && appConfig.deployBlock > 0n;
}
