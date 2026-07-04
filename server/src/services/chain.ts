import { createPublicClient, createWalletClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../config.js';

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(config.monad.rpc),
});

export function createAgentWalletClient(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(config.monad.rpc),
  });
}
