"use client";

import { appConfig } from "../lib/config";
import { useXOrdersData } from "./XOrdersDataProvider";

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
                <p>Order #{item.orderId.toString()} at block {item.blockNumber.toString()}</p>
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
