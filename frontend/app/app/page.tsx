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
    <main className="tradeApp">
      <Header />
      <XOrdersDataProvider>
        <section className="tradeShell">
          <aside className="leftRail">
            <PoolPanel />
            <StatsStrip />
          </aside>
          <section className="centerPane">
            <PriceChart />
            <OrdersPanel />
          </section>
          <aside className="rightRail">
            <SwapPanel />
            <ActivityLog />
          </aside>
        </section>
      </XOrdersDataProvider>
    </main>
  );
}
