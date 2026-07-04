import { Router, Request, Response } from 'express';
import { formatEther } from 'viem';
import { authMiddleware } from '../middleware/auth.js';
import { agentRateLimiter } from '../middleware/rate-limit.js';
import { checkNewIp } from '../middleware/ip-monitor.js';
import { logRequest } from '../middleware/logger.js';
import { publicClient } from '../services/chain.js';
import { CastleWalletABI } from '../abis/CastleWallet.js';

const router = Router();

router.get('/', authMiddleware, agentRateLimiter, async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const creds = req.agentCredentials!;
    checkNewIp(req);

    const balance = await publicClient.getBalance({ address: creds.vaultAddress });
    const policy = await publicClient.readContract({
      address: creds.vaultAddress, abi: CastleWalletABI,
      functionName: 'getSessionPolicy', args: [creds.agentAddress],
    }) as [bigint, bigint, bigint, bigint, `0x${string}`, `0x${string}`[], boolean];

    const [expiry, dailyCap, spentToday, windowStart, allowedTarget, allowedFns, active] = policy;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, Number(expiry) - now);

    let status: string = 'active';
    if (!active) status = 'frozen';
    else if (now >= Number(expiry)) status = 'expired';
    else if (spentToday >= dailyCap) status = 'over_budget';

    res.json({
      status,
      vault: { address: creds.vaultAddress, balance: formatEther(balance), balanceWei: balance.toString() },
      session: {
        agentAddress: creds.agentAddress, active, expiry: Number(expiry),
        expiresIn: timeRemaining,
        expiresInHuman: timeRemaining > 0 ? `${Math.floor(timeRemaining / 3600)}h ${Math.floor((timeRemaining % 3600) / 60)}m` : 'expired',
      },
      policy: {
        dailyCap: formatEther(dailyCap), dailyCapWei: dailyCap.toString(),
        spentToday: formatEther(spentToday), spentTodayWei: spentToday.toString(),
        remaining: formatEther(dailyCap - spentToday),
        windowStart: Number(windowStart), allowedTarget, allowedFunctions: allowedFns,
      },
    });
    logRequest(req, res, Date.now() - start);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-info]', message);
    res.status(500).json({ error: 'Failed to fetch info' });
    logRequest(req, res, Date.now() - start);
  }
});

export default router;
