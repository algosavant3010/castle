import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';

export async function logRequest(req: Request, res: Response, responseTimeMs: number): Promise<void> {
  const agent = req.agentCredentials;
  const meta = req.clientMeta;
  if (!agent) return;

  try {
    await supabase.from('request_logs').insert({
      agent_address: agent.agentAddress.toLowerCase(),
      vault_address: agent.vaultAddress.toLowerCase(),
      endpoint: req.path || req.originalUrl,
      method: req.method,
      ip_address: meta?.ip || 'unknown',
      user_agent: meta?.userAgent?.slice(0, 500) || 'unknown',
      origin: meta?.origin || 'unknown',
      referer: ((req.headers['referer'] as string) || '').slice(0, 500),
      body_preview: req.body ? JSON.stringify(req.body).slice(0, 500) : null,
      response_status: res.statusCode,
      response_time_ms: Math.round(responseTimeMs),
    });
  } catch (err) {
    console.error('[Logger] Failed:', err);
  }
}
