import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export function generateSessionKey() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return {
    privateKey,
    address: account.address,
  };
}
