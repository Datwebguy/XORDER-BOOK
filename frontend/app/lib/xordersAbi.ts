export const xordersAbi = [
  {
    type: "function",
    name: "placeOrder",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" }
        ]
      },
      { name: "kind", type: "uint8" },
      { name: "zeroForOne", type: "bool" },
      { name: "amountIn", type: "uint128" },
      { name: "triggerPriceX96", type: "uint160" },
      { name: "maxFillBps", type: "uint16" },
      { name: "trailingBps", type: "uint16" }
    ],
    outputs: [{ name: "orderId", type: "uint256" }]
  },
  {
    type: "function",
    name: "cancelOrder",
    stateMutability: "nonpayable",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "getOwnerOrderCount",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "count", type: "uint256" }]
  },
  {
    type: "event",
    name: "OrderPlaced",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "poolId", type: "bytes32", indexed: true },
      { name: "kind", type: "uint8", indexed: false },
      { name: "zeroForOne", type: "bool", indexed: false },
      { name: "inputToken", type: "address", indexed: false },
      { name: "outputToken", type: "address", indexed: false },
      { name: "amountIn", type: "uint128", indexed: false },
      { name: "triggerPriceX96", type: "uint160", indexed: false },
      { name: "maxFillBps", type: "uint16", indexed: false },
      { name: "trailingBps", type: "uint16", indexed: false }
    ]
  },
  {
    type: "event",
    name: "OrderTriggered",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "poolId", type: "bytes32", indexed: true },
      { name: "triggeredAmount", type: "uint128", indexed: false },
      { name: "observedPriceX96", type: "uint160", indexed: false }
    ]
  },
  {
    type: "event",
    name: "OrderFilled",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "filler", type: "address", indexed: true },
      { name: "inputAmount", type: "uint128", indexed: false },
      { name: "outputToken", type: "address", indexed: false },
      { name: "outputAmount", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "OrderCancelled",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "refundedAmount", type: "uint128", indexed: false }
    ]
  }
] as const;
