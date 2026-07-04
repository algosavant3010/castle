import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.js';
import { alertNewIp } from '../services/telegram.js';

export function ipMonitor(req: Request, _res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.ip || req.socket.remoteAddress || 'unknown';
  const origin = (req.headers['origin'] || req.headers['referer'] || 'unknown') as string;
  const userAgent = (req.headers['user-agent'] || 'unknown') as string;
  req.clientMeta = { ip, origin, userAgent };
  next();
}

export async function checkNewIp(req: Request): Promise<void> {
  const agent = req.agentCredentials;
  const meta = req.clientMeta;
  if (!agent || !meta) return;

  try {
    const { data: existing } = await supabase
      .from('known_ips')
      .select('id, request_count')
      .eq('agent_address', agent.agentAddress.toLowerCase())
      .eq('ip_address', meta.ip)
      .single();

    if (existing) {
      await supabase.from('known_ips')
        .update({ last_seen: new Date().toISOString(), request_count: existing.request_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('known_ips').insert({
        agent_address: agent.agentAddress.toLowerCase(),
        ip_address: meta.ip,
      });

      if (agent.ownerAddress) {
        const { data: notification } = await supabase
          .from('notifications')
          .select('telegram_chat_id, notify_on_new_ip, telegram_verified')
          .eq('owner_address', agent.ownerAddress.toLowerCase())
          .single();

        if (notification?.telegram_chat_id && notification?.telegram_verified && notification?.notify_on_new_ip) {
          await alertNewIp(notification.telegram_chat_id, {
            agent: agent.agentAddress, ip: meta.ip, origin: meta.origin,
          });
        }
      }
    }
  } catch (err) {
    console.error('[IP Monitor]', err);
  }
}
