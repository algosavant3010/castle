import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { agentRateLimiter } from '../middleware/rate-limit.js';
import { logRequest } from '../middleware/logger.js';
import { publicClient } from '../services/chain.js';

const router = Router();

router.get('/:hash', authMiddleware, agentRateLimiter, async (req: Request, res: Response) => {
  const start = Date.now();
  const hash = req.params.hash as string;
  if (!hash || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    res.status(400).json({ error: 'Invalid transaction hash.' });
    logRequest(req, res, Date.now() - start); return;
  }
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: hash as `0x${string}` });
    res.json({
      hash, status: receipt.status, success: receipt.status === 'success',
      blockNumber: Number(receipt.blockNumber), from: receipt.from, to: receipt.to,
      gasUsed: receipt.gasUsed.toString(),
      logs: receipt.logs.map(l => ({ address: l.address, topics: l.topics, data: l.data })),
    });
    logRequest(req, res, Date.now() - start);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown';
    console.error('[agent-tx]', message);
    if (message.includes('could not be found')) { res.status(404).json({ error: 'Transaction not found.' }); }
    else { res.status(500).json({ error: 'Failed to fetch tx' }); }
    logRequest(req, res, Date.now() - start);
  }
});

export default router;
