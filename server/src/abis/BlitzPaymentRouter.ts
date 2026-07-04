export const BlitzPaymentRouterABI = [
  { type: "function", name: "send", inputs: [{ name: "to", type: "address" }], outputs: [], stateMutability: "payable" },
  { type: "function", name: "sendWithMemo", inputs: [{ name: "to", type: "address" }, { name: "memo", type: "string" }], outputs: [], stateMutability: "payable" },
  { type: "event", name: "PaymentRouted", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "PaymentRoutedWithMemo", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }, { name: "memo", type: "string", indexed: false }] },
] as const;
