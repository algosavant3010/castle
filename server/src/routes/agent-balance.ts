import { Router, Request, Response } from 'express';
import { formatEther, isAddress } from 'viem';
import { authMiddleware } from '../middleware/auth.js';
import { agentRateLimiter } from '../middleware/rate-limit.js';
import { logRequest } from '../middleware/logger.js';
import { publicClient } from '../services/chain.js';

const router = Router();

router.get('/:address', authMiddleware, agentRateLimiter, async (req: Request, res: Response) => {
  const start = Date.now();
  const address = req.params.address as string;
  if (!address || !isAddress(address)) {
    res.status(400).json({ error: 'Invalid address.' });
    logRequest(req, res, Date.now() - start);
    return;
  }
  try {
    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    res.json({ address, balance: formatEther(balance), balanceWei: balance.toString(), symbol: 'MON' });
    logRequest(req, res, Date.now() - start);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-balance]', message);
    res.status(500).json({ error: 'Failed to fetch balance' });
    logRequest(req, res, Date.now() - start);
  }
});

export default router;
