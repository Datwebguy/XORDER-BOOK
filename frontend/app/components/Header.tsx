"use client";

import { Activity, Boxes, Github, Radio } from "lucide-react";
import { WalletButton } from "./WalletButton";

export function Header() {
  return (
    <header className="border-b border-white/10 bg-[#070908]/95">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-emerald-300/30 bg-emerald-300/10">
            <Boxes size={19} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-normal">XOrders</h1>
            <p className="text-xs text-white/48">Stop-loss and take-profit hooks on X Layer</p>
          </div>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          <a className="iconLink" href="https://developers.uniswap.org/docs/protocols/v4/concepts/hooks" target="_blank" rel="noreferrer">
            <Activity size={16} />
            Hooks
          </a>
          <a className="iconLink" href="https://www.okx.com/web3/explorer/xlayer" target="_blank" rel="noreferrer">
            <Radio size={16} />
            Explorer
          </a>
          <a className="iconLink" href="https://github.com/uniswapfoundation/v4-template" target="_blank" rel="noreferrer">
            <Github size={16} />
            v4
          </a>
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
