"use client";

import { Loader2 } from "lucide-react";
import { useInjectedWallet } from "../lib/wallet";
import { shortAddress } from "../lib/format";

export function WalletButton() {
  const wallet = useInjectedWallet();

  if (wallet.address && wallet.chainId !== 196) {
    return (
      <button className="secondaryButton compactButton" onClick={wallet.switchToXLayer}>
        Switch to X Layer
      </button>
    );
  }

  if (wallet.address) {
    return <button className="secondaryButton compactButton">{shortAddress(wallet.address)}</button>;
  }

  return (
    <button className="primaryButton compactButton" onClick={wallet.connect} disabled={wallet.isConnecting}>
      {wallet.isConnecting && <Loader2 className="animate-spin" size={15} />}
      Connect Wallet
    </button>
  );
}
