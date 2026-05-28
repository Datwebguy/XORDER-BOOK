"use client";

import { Ban, ExternalLink, Loader2 } from "lucide-react";
import { encodeFunctionData } from "viem";
import { appConfig } from "../lib/config";
import { formatAmount, shortAddress } from "../lib/format";
import { useInjectedWallet } from "../lib/wallet";
import { xordersAbi } from "../lib/xordersAbi";
import { useXOrdersData } from "./XOrdersDataProvider";

export function OrdersPanel() {
  const { orders, isLoading, error, configured } = useXOrdersData();
  const wallet = useInjectedWallet();

  async function cancel(orderId: bigint) {
    await wallet.sendTransaction(
      appConfig.hookAddress,
      encodeFunctionData({ abi: xordersAbi, functionName: "cancelOrder", args: [orderId] })
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="label">Wallet orders</p>
          <h2>Active Orders</h2>
        </div>
        {isLoading && <Loader2 className="animate-spin text-cyan" size={18} />}
      </div>
      {!configured && <div className="emptyState">Deploy XOrdersHook, then set NEXT_PUBLIC_XORDERS_HOOK_ADDRESS and NEXT_PUBLIC_XORDERS_DEPLOY_BLOCK.</div>}
      {error && <div className="emptyState">{error}</div>}
      {configured && !error && orders.length === 0 && <div className="emptyState">No onchain orders found for the connected wallet.</div>}
      {orders.length > 0 && (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Amount</th>
                <th>Trigger X96</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id.toString()}>
                  <td>#{order.id.toString()}</td>
                  <td>{order.kind}</td>
                  <td>{shortAddress(order.owner)}</td>
                  <td>{formatAmount(order.amountIn)}</td>
                  <td>{order.triggerPriceX96.toString()}</td>
                  <td><span className={`status ${order.status.replace(/\s/g, "").toLowerCase()}`}>{order.status}</span></td>
                  <td>
                    <div className="rowActions">
                      <a className="iconButton" href={`${appConfig.explorerUrl}/address/${appConfig.hookAddress}`} target="_blank" rel="noreferrer" title="Open hook">
                        <ExternalLink size={15} />
                      </a>
                      <button title="Cancel order" disabled={!wallet.address || order.status === "Cancelled" || order.status === "Filled"} onClick={() => cancel(order.id)}>
                        <Ban size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
