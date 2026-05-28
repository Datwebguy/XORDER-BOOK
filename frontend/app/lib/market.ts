import type { Address } from "viem";

export const market = {
  symbol: "WOKB / USDT0",
  baseSymbol: "WOKB",
  quoteSymbol: "USDT0",
  token0Symbol: "USDT0",
  token1Symbol: "WOKB",
  token0: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736" as Address,
  token1: "0xe538905cf8410324e03a5a23c1c177a474d59b2b" as Address,
  token0Decimals: 6,
  token1Decimals: 18,
  fee: 3000,
  tickSpacing: 60
};

export function quotePerBaseFromSqrtPriceX96(sqrtPriceX96: bigint) {
  const rawToken1PerToken0 = Number((sqrtPriceX96 * sqrtPriceX96 * 1_000_000_000_000n) >> 192n) / 1_000_000_000_000;
  const token1PerToken0 = rawToken1PerToken0 * 10 ** (market.token0Decimals - market.token1Decimals);
  return 1 / token1PerToken0;
}

export function triggerPriceX96FromQuotePerBase(price: number) {
  const token1PerToken0 = 1 / price;
  const rawToken1PerToken0 = token1PerToken0 * 10 ** (market.token1Decimals - market.token0Decimals);
  return BigInt(Math.floor(rawToken1PerToken0 * 2 ** 96));
}

export function formatUsdPrice(value: number | null) {
  if (!value || !Number.isFinite(value)) return "No pool";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}
