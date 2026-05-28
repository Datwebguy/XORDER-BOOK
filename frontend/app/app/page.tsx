import { Header } from "../components/Header";
import { PoolPanel } from "../components/PoolPanel";
import { SwapPanel } from "../components/SwapPanel";
import { PriceChart } from "../components/PriceChart";
import { OrdersPanel } from "../components/OrdersPanel";
import { ActivityLog } from "../components/ActivityLog";
import { StatsStrip } from "../components/StatsStrip";
import { XOrdersDataProvider } from "../components/XOrdersDataProvider";

export default function TradingApp() {
  return (
    <main className="min-h-screen">
      <Header />
      <XOrdersDataProvider>
        <section className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 pb-8 pt-4 lg:grid-cols-[320px_minmax(0,1fr)_380px]">
          <aside className="space-y-4">
            <PoolPanel />
            <StatsStrip />
          </aside>
          <section className="space-y-4">
            <PriceChart />
            <OrdersPanel />
          </section>
          <aside className="space-y-4">
            <SwapPanel />
            <ActivityLog />
          </aside>
        </section>
      </XOrdersDataProvider>
    </main>
  );
}
