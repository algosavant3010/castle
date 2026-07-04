import { supabase } from '../services/supabase.js';
import { alertPatternDetected } from '../services/telegram.js';
import { getAgentName } from '../services/approval.js';
import { config } from '../config.js';

export interface PatternCheckResult {
  blocked: boolean;
  count: number;
  reason?: string;
}

export async function checkSigningPattern(
  agentAddress: string,
  ownerAddress: string,
  target: string,
  functionName: string,
  valueMon: string
): Promise<PatternCheckResult> {
  const windowStart = new Date(Date.now() - config.rateLimits.patternWindowMs).toISOString();

  try {
    const { data: existing } = await supabase
      .from('signing_patterns')
      .select('id, count')
      .eq('agent_address', agentAddress.toLowerCase())
      .eq('target', target.toLowerCase())
      .eq('function_name', functionName)
      .eq('value_mon', valueMon)
      .gte('window_start', windowStart)
      .order('window_start', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      const newCount = existing.count + 1;
      await supabase.from('signing_patterns')
        .update({ count: newCount, last_seen: new Date().toISOString() })
        .eq('id', existing.id);

      if (newCount > config.rateLimits.maxRepeatedCalls) {
        await supabase.from('signing_patterns').update({ flagged: true }).eq('id', existing.id);

        if (ownerAddress) {
          const { data: notif } = await supabase.from('notifications')
            .select('telegram_chat_id, notify_on_pattern, telegram_verified')
            .eq('owner_address', ownerAddress.toLowerCase()).single();
          if (notif?.telegram_chat_id && notif?.telegram_verified && notif?.notify_on_pattern) {
            const agentName = await getAgentName(agentAddress);
            await alertPatternDetected(notif.telegram_chat_id, {
              agent: agentAddress,
              agentName,
              pattern: `${functionName} on ${target.slice(0, 10)}... for ${valueMon} MON`,
              count: newCount,
            });
          }
        }
        return { blocked: true, count: newCount, reason: `Rate limited: ${newCount} identical calls in 5 min. Vary parameters or wait.` };
      }
      return { blocked: false, count: newCount };
    }

    await supabase.from('signing_patterns').insert({
      agent_address: agentAddress.toLowerCase(),
      target: target.toLowerCase(),
      function_name: functionName,
      value_mon: valueMon,
    });
    return { blocked: false, count: 1 };
  } catch (err) {
    console.error('[Pattern]', err);
    return { blocked: false, count: 0 };
  }
}
