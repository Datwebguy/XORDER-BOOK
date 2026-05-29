"use client";

import { createChart, ColorType, LineSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { useCallback, useEffect, useRef } from "react";
import { usePoolSlot0 } from "../lib/hooks";
import { formatUsdPrice, market, quotePerBaseFromSqrtPriceX96 } from "../lib/market";

export function PriceChart() {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const historyRef = useRef<Array<{ time: UTCTimestamp; value: number }>>([]);

  const { slot0, error } = usePoolSlot0();
  const price = slot0 ? quotePerBaseFromSqrtPriceX96(slot0.sqrtPriceX96) : null;

  const setupChart = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      return;
    }

    const chart = createChart(node, {
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
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true }
    });

    const series = chart.addSeries(LineSeries, {
      color: "#26e6ff",
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true
    });

    chartRef.current = chart;
    seriesRef.current = series;

    if (historyRef.current.length > 0) {
      series.setData([...historyRef.current]);
      chart.timeScale().fitContent();
    }
  }, []);

  useEffect(() => {
    if (price === null) return;

    const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const history = historyRef.current;

    if (history.length > 0 && history[history.length - 1].time >= now) {
      history[history.length - 1].value = price;
    } else {
      history.push({ time: now, value: price });
    }

    if (history.length > 300) history.splice(0, history.length - 300);

    if (seriesRef.current) {
      seriesRef.current.setData([...history]);
      chartRef.current?.timeScale().fitContent();
    }
  }, [price]);

  return (
    <section className="panel chartPanel">
      <div className="panelHeader">
        <div>
          <p className="label">Live pool state</p>
          <h2>{market.symbol}</h2>
        </div>
        <div className="pricePill">{formatUsdPrice(price)}</div>
      </div>
      {price !== null ? (
        <div ref={setupChart} className="chart" />
      ) : (
        <div className="emptyState">{error || "Set NEXT_PUBLIC_XORDERS_POOL_ID to show live StateView pricing."}</div>
      )}
    </section>
  );
}
