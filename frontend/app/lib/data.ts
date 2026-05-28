import type { UTCTimestamp } from "lightweight-charts";

export const emptyChartData = Array.from({ length: 48 }, (_, index) => ({
  time: (Math.floor(Date.now() / 1000) - (48 - index) * 900) as UTCTimestamp,
  value: 0
}));
