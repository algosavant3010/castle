import { Request, Response, NextFunction } from 'express';
import { verifyOwnerAuth } from '../services/signature.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ownerAddress?: string;
    }
  }
}

/**
 * Express middleware factory. Requires a valid owner wallet signature in the
 * request body: { ownerAddress, authMessage, authSignature }. On success it sets
 * req.ownerAddress (lowercased). The `purpose` must match the signed message so
 * a signature for one action cannot be replayed for another.
 */
export function ownerAuth(purpose: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const body = (req.body || {}) as {
      ownerAddress?: unknown;
      authMessage?: unknown;
      authSignature?: unknown;
    };

    const result = await verifyOwnerAuth({
      address: body.ownerAddress,
      message: body.authMessage,
      signature: body.authSignature,
      purpose,
    });

    if (!result.ok) {
      return res.status(401).json({ error: result.error || 'Owner authentication required.' });
    }

    req.ownerAddress = (body.ownerAddress as string).toLowerCase();
    next();
  };
}
