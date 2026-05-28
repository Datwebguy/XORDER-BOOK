import Link from "next/link";
import { ArrowRight, ChartCandlestick, DatabaseZap, Layers3, Lock, Radio, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { appConfig } from "./lib/config";

const stats = [
  ["Chain", "X Layer 196"],
  ["Trigger", "afterSwap()"],
  ["PoolManager", `${appConfig.poolManager.slice(0, 6)}...${appConfig.poolManager.slice(-4)}`],
  ["Router", `${appConfig.universalRouter.slice(0, 6)}...${appConfig.universalRouter.slice(-4)}`]
];

const features = [
  {
    icon: ShieldCheck,
    title: "Pool-Native Triggers",
    body: "The hook watches real pool swaps and emits trigger events only when thresholds are crossed."
  },
  {
    icon: ChartCandlestick,
    title: "Stop-Loss + Take-Profit",
    body: "One hook supports both risk exits and profit exits for multiple wallet-owned orders."
  },
  {
    icon: DatabaseZap,
    title: "Indexable Events",
    body: "The app indexes onchain logs from your deployed hook. No fake backend state."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-white/10 bg-[#05070b]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md border border-cyan/30 bg-cyan/10">
              <Layers3 size={18} />
            </span>
            <span className="font-semibold">XOrders</span>
          </Link>
          <Button asChild size="sm">
            <Link href="/app">
              Launch App
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(124,92,255,0.24),transparent_30%),radial-gradient(circle_at_52%_45%,rgba(38,230,255,0.12),transparent_36%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_0.92fr]">
          <div>
            <Badge className="mb-6 border-cyan/20 bg-cyan/10 text-cyan">Live on X Layer Mainnet infrastructure</Badge>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] text-white md:text-7xl">
              XOrders
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
              On-chain stop-loss and take-profit orders directly inside Uniswap v4 pools on X Layer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/app">
                  Launch App
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href={appConfig.explorerUrl} target="_blank" rel="noreferrer">
                  X Layer Explorer
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#080d16] p-3 shadow-glow">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs uppercase text-white/42">Live terminal</p>
                <p className="font-semibold">OKB / USDT</p>
              </div>
              <Badge className="bg-success/10 text-success">X Layer</Badge>
            </div>
            <div className="grid h-[340px] place-items-center rounded-md border border-white/10 bg-[linear-gradient(180deg,rgba(124,92,255,0.08),rgba(38,230,255,0.03))]">
              <div className="w-full px-6">
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-white/52">Order trigger surface</p>
                    <p className="text-3xl font-semibold">afterSwap()</p>
                  </div>
                  <Radio className="text-cyan" />
                </div>
                <div className="grid items-end gap-1 [grid-template-columns:repeat(48,minmax(0,1fr))]">
                  {Array.from({ length: 48 }, (_, index) => (
                    <span
                      key={index}
                      className="rounded-sm bg-cyan/70"
                      style={{ height: `${28 + Math.abs(Math.sin(index / 4)) * 120}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-8 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label} className="bg-white/[0.035]">
            <CardContent className="p-4">
              <p className="text-xs uppercase text-white/42">{label}</p>
              <p className="mt-2 text-xl font-semibold text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-14 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="text-cyan" size={22} />
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-white/60">{feature.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <Card className="border-primary/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.14),rgba(38,230,255,0.06),rgba(255,255,255,0.03))]">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-10">
            <div>
              <Badge className="mb-4">Production Path</Badge>
              <h2 className="max-w-3xl text-3xl font-semibold text-white md:text-5xl">
                Real contracts, real events, real wallet actions.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/62">
                Configure the deployed hook address and deploy block, then the app reads order activity directly from X Layer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 self-end text-sm">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4"><Lock className="mb-5 text-success" size={20} />Escrowed</div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4"><Zap className="mb-5 text-cyan" size={20} />Triggered</div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
