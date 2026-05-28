"use client";

import { Activity, Github, Radio } from "lucide-react";
import { WalletButton } from "./WalletButton";

export function Header() {
  return (
    <header className="border-b border-white/10 bg-[#070908]/95">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <img className="h-9 w-9 rounded-md" src="/favicon-64.png" alt="XOrders" />
          <div className="min-w-0">
            <img className="h-5 w-auto" src="/brand/xorders-logo-header.png" alt="XOrders" />
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
