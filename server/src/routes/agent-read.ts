import { Router, Request, Response } from 'express';
import { encodeFunctionData, decodeFunctionResult, isAddress } from 'viem';
import { authMiddleware } from '../middleware/auth.js';
import { agentRateLimiter } from '../middleware/rate-limit.js';
import { logRequest } from '../middleware/logger.js';
import { validateAbi, validateFunctionName } from '../middleware/validate.js';
import { publicClient } from '../services/chain.js';

const router = Router();

router.post('/', authMiddleware, agentRateLimiter, async (req: Request, res: Response) => {
  const start = Date.now();
  const { target, abi, functionName, args } = req.body;

  if (!target || !isAddress(target)) { res.status(400).json({ error: "Invalid 'target'." }); logRequest(req, res, Date.now() - start); return; }
  if (!abi || !Array.isArray(abi)) { res.status(400).json({ error: "Invalid 'abi'." }); logRequest(req, res, Date.now() - start); return; }
  const abiErr = validateAbi(abi); if (abiErr) { res.status(400).json({ error: abiErr }); logRequest(req, res, Date.now() - start); return; }
  if (!functionName) { res.status(400).json({ error: "Missing 'functionName'." }); logRequest(req, res, Date.now() - start); return; }
  const fnErr = validateFunctionName(functionName); if (fnErr) { res.status(400).json({ error: fnErr }); logRequest(req, res, Date.now() - start); return; }

  try {
    const calldata = encodeFunctionData({ abi, functionName, args: (args || []) as readonly unknown[] });
    const result = await publicClient.call({ to: target as `0x${string}`, data: calldata });
    if (!result.data) { res.status(400).json({ error: 'Contract returned no data.' }); logRequest(req, res, Date.now() - start); return; }

    const decoded = decodeFunctionResult({ abi, functionName, data: result.data });
    const serialized = JSON.parse(JSON.stringify(decoded, (_, v) => typeof v === 'bigint' ? v.toString() : v));
    res.json({ target, functionName, result: serialized });
    logRequest(req, res, Date.now() - start);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-read]', message);
    res.status(500).json({ error: 'Read failed' });
    logRequest(req, res, Date.now() - start);
  }
});

export default router;
