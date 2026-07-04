export const BlitzWalletFactoryABI = [
  {
    type: "function",
    name: "deployWallet",
    inputs: [],
    outputs: [{ name: "wallet", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getWallets",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWalletCount",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllWallets",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalWalletCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "WalletDeployed",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "wallet", type: "address", indexed: true },
    ],
  },
] as const;
