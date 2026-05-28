"use client";

import { createChart, ColorType, LineSeries, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useMemo, useRef } from "react";
import { usePoolSlot0 } from "../lib/hooks";
import { formatUsdPrice, market, quotePerBaseFromSqrtPriceX96 } from "../lib/market";

export function PriceChart() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { slot0, error } = usePoolSlot0();
  const price = slot0 ? quotePerBaseFromSqrtPriceX96(slot0.sqrtPriceX96) : null;

  const data = useMemo(() => {
    if (!price) return [];
    const now = Math.floor(Date.now() / 1000);
    return [{ time: now as UTCTimestamp, value: price }];
  }, [price]);

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, {
      autoSize: true,
      height: 390,
      layout: {
        background: { type: ColorType.Solid, color: "#080d16" },
        textColor: "rgba(255,255,255,0.62)"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" }
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: { borderColor: "rgba(255,255,255,0.08)" }
    });

    const series = chart.addSeries(LineSeries, {
      color: "#26e6ff",
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true
    });

    series.setData(data);
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [data]);

  return (
    <section className="panel chartPanel">
      <div className="panelHeader">
        <div>
          <p className="label">Live pool state</p>
          <h2>{market.symbol}</h2>
        </div>
        <div className="pricePill">{formatUsdPrice(price)}</div>
      </div>
      {price ? <div ref={ref} className="chart" /> : <div className="emptyState">{error || "Set NEXT_PUBLIC_XORDERS_POOL_ID to show live StateView pricing."}</div>}
    </section>
  );
}
