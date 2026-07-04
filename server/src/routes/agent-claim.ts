import { Router, Request, Response } from 'express';
import { ownerAuth } from '../middleware/owner-auth.js';
import { supabase } from '../services/supabase.js';

const router = Router();

// Returns the vault address for an agent so the owner can call emergencyWithdraw.
// Requires an owner signature (purpose "claim-agent") proving control of the address.
router.post('/', ownerAuth('claim-agent'), async (req: Request, res: Response) => {
  const owner = req.ownerAddress!;
  const { agentAddress } = req.body;
  if (!agentAddress || typeof agentAddress !== 'string') {
    return res.status(400).json({ error: 'agentAddress required.' });
  }
  try {
    const { data: agent, error } = await supabase
      .from('agents')
      .select('vault_address, owner_address, name, status')
      .eq('session_key_address', agentAddress.toLowerCase())
      .single();

    if (error || !agent) return res.status(404).json({ error: 'Agent not found.' });
    if (agent.owner_address.toLowerCase() !== owner) {
      return res.status(403).json({ error: 'You are not the owner of this agent.' });
    }

    res.json({
      vaultAddress: agent.vault_address, agentName: agent.name, status: agent.status,
      message: 'Call emergencyWithdraw() on this vault from your connected wallet.',
    });
  } catch {
    res.status(500).json({ error: 'Failed to process claim.' });
  }
});

export default router;
