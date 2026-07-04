import { monadTestnet } from 'viem/chains';

export const CHAIN = monadTestnet;
export const MONAD_TESTNET_ID = 10143 as const;
export const MONAD_TESTNET_RPC = (process.env.NEXT_PUBLIC_MONAD_RPC || 'https://testnet-rpc.monad.xyz') as string;
export const MONAD_TESTNET_EXPLORER = (process.env.NEXT_PUBLIC_MONAD_EXPLORER || 'https://testnet.monadvision.com') as string;

// Monad has 400ms block time - poll aggressively for live feel
export const BLOCK_TIME_MS = 400;
export const POLLING_INTERVAL_MS = 500;
