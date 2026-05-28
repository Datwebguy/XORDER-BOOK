"use client";

import { ArrowDownUp, ArrowUpRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { encodeFunctionData, parseUnits, type Address, type Hex } from "viem";
import { appConfig, isConfigured } from "../lib/config";
import { erc20Abi } from "../lib/erc20Abi";
import { market, triggerPriceX96FromQuotePerBase } from "../lib/market";
import { useInjectedWallet } from "../lib/wallet";
import { xordersAbi } from "../lib/xordersAbi";

type OrderKind = "0" | "1" | "2";

export function SwapPanel() {
  const [currency0] = useState(market.token0);
  const [currency1] = useState(market.token1);
  const [inputToken, setInputToken] = useState<Address>(market.token1);
  const [amount, setAmount] = useState("");
  const [triggerPrice, setTriggerPrice] = useState("80");
  const [kind, setKind] = useState<OrderKind>("0");
  const [zeroForOne, setZeroForOne] = useState(false);
  const [fee] = useState(String(market.fee));
  const [tickSpacing] = useState(String(market.tickSpacing));
  const [maxFillPercent, setMaxFillPercent] = useState("25");
  const [trailingPercent, setTrailingPercent] = useState("0");
  const [isPending, setIsPending] = useState(false);
  const [data, setData] = useState<Hex | null>(null);
  const wallet = useInjectedWallet();

  const inputDecimals = inputToken.toLowerCase() === market.token0.toLowerCase() ? market.token0Decimals : market.token1Decimals;
  const inputSymbol = inputToken.toLowerCase() === market.token0.toLowerCase() ? market.quoteSymbol : market.baseSymbol;
  const outputSymbol = inputToken.toLowerCase() === market.token0.toLowerCase() ? market.baseSymbol : market.quoteSymbol;
  const parsedAmount = amount ? parseUnits(amount, inputDecimals) : 0n;
  const triggerPriceX96 = triggerPrice ? triggerPriceX96FromQuotePerBase(Number(triggerPrice)) : 0n;
  const maxFillBps = Math.round(Number(maxFillPercent || "0") * 100);
  const trailingBps = Math.round(Number(trailingPercent || "0") * 100);
  const fillPercent = Math.min(Number(maxFillPercent || "0"), 100);

  function setSellToken(token: Address) {
    setInputToken(token);
    setZeroForOne(token.toLowerCase() === market.token0.toLowerCase());
  }

  async function approve() {
    setIsPending(true);
    try {
      const tx = await wallet.sendTransaction(
        inputToken as Address,
        encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [appConfig.hookAddress, parsedAmount]
        })
      );
      setData(tx);
    } finally {
      setIsPending(false);
    }
  }

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      const tx = await wallet.sendTransaction(
        appConfig.hookAddress,
        encodeFunctionData({
          abi: xordersAbi,
          functionName: "placeOrder",
          args: [
            {
              currency0,
              currency1,
              fee: Number(fee),
              tickSpacing: Number(tickSpacing),
              hooks: appConfig.hookAddress
            },
            Number(kind),
            zeroForOne,
            parsedAmount,
            triggerPriceX96,
            maxFillBps,
            trailingBps
          ]
        })
      );
      setData(tx);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="label">Live action</p>
          <h2>Place {market.symbol} XOrder</h2>
        </div>
        {isPending ? <Loader2 className="animate-spin text-cyan" size={18} /> : <ShieldCheck className="text-cyan" size={18} />}
      </div>
      {!isConfigured() && <div className="notice">Deploy and configure the hook before placing real orders.</div>}
      <form className="stack" onSubmit={placeOrder}>
        <div className="marketPair">
          <span>{market.quoteSymbol}</span>
          <strong>{market.symbol}</strong>
          <span>{market.baseSymbol}</span>
        </div>

        <div className="segmented">
          <button type="button" className={kind === "0" ? "active" : ""} onClick={() => setKind("0")}>
            Stop-Loss
          </button>
          <button type="button" className={kind === "1" ? "active" : ""} onClick={() => setKind("1")}>
            Take-Profit
          </button>
          <button
            type="button"
            className={kind === "2" ? "active" : ""}
            onClick={() => {
              setKind("2");
              if (Number(trailingPercent) === 0) setTrailingPercent("5");
            }}
          >
            Trailing
          </button>
        </div>

        <div className="sideSwitch">
          <button type="button" className={inputToken === market.token1 ? "active" : ""} onClick={() => setSellToken(market.token1)}>
            Sell {market.baseSymbol}
          </button>
          <button type="button" className={inputToken === market.token0 ? "active" : ""} onClick={() => setSellToken(market.token0)}>
            Sell {market.quoteSymbol}
          </button>
        </div>

        <label className="formLabel">
          Amount to escrow ({inputSymbol})
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="1.0" required />
        </label>
        <label className="formLabel">
          Trigger price ({market.quoteSymbol} per {market.baseSymbol})
          <input value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} inputMode="decimal" placeholder="80.00" required />
        </label>

        <div className="ticketPreview">
          <div>
            <span>Route</span>
            <strong>{inputSymbol} <ArrowDownUp size={13} /> {outputSymbol}</strong>
          </div>
          <div>
            <span>Max trigger slice</span>
            <strong>{fillPercent.toFixed(2)}%</strong>
          </div>
          <div>
            <span>Pool fee</span>
            <strong>{Number(fee) / 10000}%</strong>
          </div>
        </div>

        <div className="twoCol">
          <label className="formLabel">
            Max fill %
            <input value={maxFillPercent} onChange={(e) => setMaxFillPercent(e.target.value)} inputMode="decimal" />
          </label>
          <label className="formLabel">
            Trail %
            <input value={trailingPercent} onChange={(e) => setTrailingPercent(e.target.value)} inputMode="decimal" disabled={kind !== "2"} />
          </label>
        </div>
        <button className="secondaryButton" type="button" onClick={approve} disabled={!isConfigured() || isPending || !wallet.address || !inputToken || parsedAmount === 0n}>
          <CheckCircle2 size={17} />
          Approve Hook
        </button>
        <button className="primaryButton" disabled={!isConfigured() || isPending || !wallet.address}>
          <ArrowUpRight size={17} />
          Place Onchain Order
        </button>
      </form>
      {data && <div className="notice">Transaction submitted: {data.slice(0, 10)}...</div>}
      <a className="secondaryButton" href="https://app.uniswap.org/swap?chain=xlayer" target="_blank" rel="noreferrer">
        Open Uniswap Swap
      </a>
    </section>
  );
}
