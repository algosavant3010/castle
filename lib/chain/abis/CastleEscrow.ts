export const CastleEscrowABI = [
  {
    type: "function",
    name: "taskCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createTask",
    inputs: [
      { name: "specURI", type: "string" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "taskId", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "acceptTask",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitWork",
    inputs: [
      { name: "taskId", type: "uint256" },
      { name: "resultURI", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "releaseFunds",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "raiseDispute",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reclaim",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getTask",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [
      { name: "buyer", type: "address" },
      { name: "worker", type: "address" },
      { name: "reward", type: "uint256" },
      { name: "specURI", type: "string" },
      { name: "resultURI", type: "string" },
      { name: "status", type: "uint8" },
      { name: "createdAt", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "TaskCreated",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "reward", type: "uint256", indexed: false },
      { name: "specURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TaskAccepted",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "worker", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "WorkSubmitted",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "resultURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FundsReleased",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "worker", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TaskDisputed",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "raiser", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "TaskCancelled",
    inputs: [{ name: "taskId", type: "uint256", indexed: true }],
  },
] as const;
