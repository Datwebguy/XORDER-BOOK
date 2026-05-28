"use client";

import { Gauge, Layers, Radio } from "lucide-react";
import { useXLayerStatus } from "../lib/hooks";
import { useXOrdersData } from "./XOrdersDataProvider";

export function StatsStrip() {
  const block = useXLayerStatus();
  const { orders, activities } = useXOrdersData();
  const stats = [
    { icon: Gauge, label: "Current block", value: block.data?.toString() || "loading" },
    { icon: Layers, label: "Wallet orders", value: orders.length.toString() },
    { icon: Radio, label: "Hook events", value: activities.length.toString() }
  ];

  return (
    <section className="panel">
      <div className="stack">
        {stats.map((item) => (
          <div className="statRow" key={item.label}>
            <item.icon size={17} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
