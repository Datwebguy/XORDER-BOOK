import { defineChain } from "viem";

export const xLayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: {
    decimals: 18,
    name: "OKB",
    symbol: "OKB"
  },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
    public: { http: ["https://xlayerrpc.okx.com"] }
  },
  blockExplorers: {
    default: {
      name: "OKX Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer"
    },
    oklink: {
      name: "OKLink",
      url: "https://www.oklink.com/xlayer"
    }
  }
});
