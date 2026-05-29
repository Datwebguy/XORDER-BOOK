"use client";

import { appConfig } from "../lib/config";
import { useXOrdersData } from "./XOrdersDataProvider";

function relativeTime(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function ActivityLog() {
  const { activities, configured } = useXOrdersData();

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="label">Hook events</p>
          <h2>Activity</h2>
        </div>
      </div>
      {!configured && <div className="emptyState">Activity appears here after the hook is deployed and configured.</div>}
      {configured && activities.length === 0 && <div className="emptyState">No XOrders events indexed yet.</div>}
      {activities.length > 0 && (
        <div className="timeline">
          {activities.slice(0, 12).map((item) => (
            <article key={item.id}>
              <span />
              <div>
                <strong>{item.type}</strong>
                <p>Order #{item.orderId.toString()}</p>
                <time>Block {item.blockNumber.toString()} · {relativeTime(item.indexedAt)}</time>
                <a href={`${appConfig.explorerUrl}/tx/${item.transactionHash}`} target="_blank" rel="noreferrer">
                  {item.transactionHash.slice(0, 10)}...
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
