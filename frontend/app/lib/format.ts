export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(value: bigint, decimals = 18) {
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = value % scale;
  const trimmed = fraction.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

export function formatTime(timestamp?: number) {
  if (!timestamp) return "pending";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  }).format(timestamp * 1000);
}
