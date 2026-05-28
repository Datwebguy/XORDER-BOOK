import "./styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "XOrders | Stop-Loss and Take-Profit Hooks",
  description: "On-chain stop-loss and take-profit orders inside Uniswap v4 pools on X Layer."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
