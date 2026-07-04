import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.js';
import { hashToken, decryptPrivateKey } from '../services/crypto.js';
import { privateKeyToAccount } from 'viem/accounts';

export interface AgentCredentials {
  vaultAddress: `0x${string}`;
  privateKey: `0x${string}`;
  agentAddress: `0x${string}`;
  ownerAddress: string;
}

declare global {
  namespace Express {
    interface Request {
      agentCredentials?: AgentCredentials;
      clientMeta?: { ip: string; origin: string; userAgent: string };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header. Use: Bearer <access_token>' });
  }

  const token = authHeader.slice(7).trim();

  try {
    // New format: blitz_<hex>
    if (token.startsWith('blitz_')) {
      const tokenHash = hashToken(token);
      const { data: agent, error } = await supabase
        .from('agents')
        .select('vault_address, encrypted_private_key, encryption_iv, owner_address, session_key_address, status')
        .eq('access_token_hash', tokenHash)
        .single();

      if (error || !agent) {
        return res.status(401).json({ error: 'Invalid access token.' });
      }
      if (agent.status !== 'active') {
        return res.status(403).json({ error: `Agent is ${agent.status}. Cannot transact.` });
      }
      if (!agent.encrypted_private_key || !agent.encryption_iv) {
        return res.status(500).json({ error: 'Agent key not available.' });
      }

      const privateKey = decryptPrivateKey(agent.encrypted_private_key, agent.encryption_iv) as `0x${string}`;
      req.agentCredentials = {
        vaultAddress: agent.vault_address as `0x${string}`,
        privateKey,
        agentAddress: agent.session_key_address as `0x${string}`,
        ownerAddress: agent.owner_address,
      };
      return next();
    }

    // Legacy format: <vaultAddress>:<privateKey>
    const separatorIndex = token.indexOf(':', 2);
    if (separatorIndex === -1) {
      return res.status(401).json({ error: 'Invalid token format.' });
    }

    const vaultAddress = token.slice(0, separatorIndex) as `0x${string}`;
    const privateKey = token.slice(separatorIndex + 1) as `0x${string}`;

    if (!/^0x[a-fA-F0-9]{40}$/.test(vaultAddress)) {
      return res.status(401).json({ error: 'Invalid vault address in token.' });
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
      return res.status(401).json({ error: 'Invalid private key in token.' });
    }

    const account = privateKeyToAccount(privateKey);

    const { data: vault } = await supabase
      .from('vaults')
      .select('owner_address')
      .eq('address', vaultAddress.toLowerCase())
      .single();

    req.agentCredentials = {
      vaultAddress,
      privateKey,
      agentAddress: account.address,
      ownerAddress: vault?.owner_address || '',
    };
    next();
  } catch (err) {
    console.error('[Auth] Error:', err);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}
