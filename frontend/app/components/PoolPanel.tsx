"use client";

import { ChevronDown, ExternalLink, Factory, ShieldCheck } from "lucide-react";
import { appConfig, isConfigured } from "../lib/config";
import { shortAddress } from "../lib/format";
import { market } from "../lib/market";

export function PoolPanel() {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="label">X Layer v4</p>
          <h2>{market.symbol}</h2>
        </div>
        <button className="iconButton" title="Pool configuration">
          <ChevronDown size={18} />
        </button>
      </div>
      <div className="poolCard">
        <div>
          <p className="label">XOrdersHook</p>
          <strong>{isConfigured() ? shortAddress(appConfig.hookAddress) : "Not deployed"}</strong>
        </div>
        <ShieldCheck className="text-cyan" size={22} />
      </div>
      <dl className="dataGrid">
        <div>
          <dt>PoolManager</dt>
          <dd>{shortAddress(appConfig.poolManager)}</dd>
        </div>
        <div>
          <dt>StateView</dt>
          <dd>{shortAddress(appConfig.stateView)}</dd>
        </div>
        <div>
          <dt>Deploy block</dt>
          <dd>{appConfig.deployBlock.toString()}</dd>
        </div>
        <div>
          <dt>Chain</dt>
          <dd>196</dd>
        </div>
        <div>
          <dt>Fee</dt>
          <dd>0.30%</dd>
        </div>
        <div>
          <dt>Tick spacing</dt>
          <dd>{market.tickSpacing}</dd>
        </div>
      </dl>
      <a className="primaryButton" href={appConfig.explorerUrl} target="_blank" rel="noreferrer">
        <ExternalLink size={17} />
        X Layer Explorer
      </a>
      <a className="secondaryButton" href="https://app.uniswap.org/pools?chain=xlayer" target="_blank" rel="noreferrer">
        <Factory size={17} />
        Manage v4 Pool
      </a>
    </section>
  );
}
