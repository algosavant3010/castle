/**
 * Deployed contract addresses on Monad testnet.
 * All addresses read from environment variables (NEXT_PUBLIC_ prefix for client-side access).
 */

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export const CONTRACTS = {
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  escrow: (process.env.NEXT_PUBLIC_ESCROW_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  paymentRouter: (process.env.NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
} as const;

// True when all core contracts have non-zero addresses
export const CONTRACTS_DEPLOYED =
  CONTRACTS.factory !== ZERO_ADDRESS && CONTRACTS.escrow !== ZERO_ADDRESS;
