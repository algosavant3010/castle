import { Router, Request, Response } from 'express';
import { isAddress, getAddress } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { ownerAuth } from '../middleware/owner-auth.js';
import { publicClient } from '../services/chain.js';
import { supabase } from '../services/supabase.js';
import { encryptPrivateKey, generateAccessToken, hashToken } from '../services/crypto.js';
import { CastleWalletABI } from '../abis/CastleWallet.js';

const router = Router();

const PRESETS = ['marketplace', 'payments', 'custom'];
const SELECTOR_RE = /^0x[0-9a-fA-F]{8}$/;

/**
 * POST /api/agents/create
 *
 * Creates a Castle agent for a vault the caller owns. The session key is
 * generated and its private key encrypted (AES-256-GCM) entirely server-side;
 * the raw key never touches the browser. Returns the session key address (to be
 * registered on-chain by the owner) and the one-time access token.
 *
 * Requires an owner signature (purpose "create-agent").
 */
router.post('/create', ownerAuth('create-agent'), async (req: Request, res: Response) => {
  const owner = req.ownerAddress!;
  const {
    vaultAddress,
    name,
    preset,
    dailyCap,
    approvalThreshold = '0',
    expiryHours,
    allowedTarget,
    allowedFunctions = [],
  } = (req.body || {}) as Record<string, unknown>;

  // --- Validation ---
  if (typeof vaultAddress !== 'string' || !isAddress(vaultAddress)) {
    return res.status(400).json({ error: 'Invalid vault address.' });
  }
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 64) {
    return res.status(400).json({ error: 'Name is required (max 64 chars).' });
  }
  if (typeof preset !== 'string' || !PRESETS.includes(preset)) {
    return res.status(400).json({ error: 'Invalid preset.' });
  }
  const capNum = parseFloat(String(dailyCap));
  if (Number.isNaN(capNum) || capNum <= 0 || capNum > 1_000_000) {
    return res.status(400).json({ error: 'Daily cap must be a positive number.' });
  }
  const thresholdNum = parseFloat(String(approvalThreshold));
  if (Number.isNaN(thresholdNum) || thresholdNum < 0) {
    return res.status(400).json({ error: 'Approval threshold must be zero or positive.' });
  }
  const hours = parseInt(String(expiryHours), 10);
  if (Number.isNaN(hours) || hours < 1 || hours > 8760) {
    return res.status(400).json({ error: 'Expiry must be between 1 and 8760 hours.' });
  }
  if (allowedTarget !== undefined && allowedTarget !== null && allowedTarget !== '' &&
      (typeof allowedTarget !== 'string' || !isAddress(allowedTarget))) {
    return res.status(400).json({ error: 'Invalid allowed target address.' });
  }
  if (!Array.isArray(allowedFunctions) || allowedFunctions.some((s) => typeof s !== 'string' || !SELECTOR_RE.test(s))) {
    return res.status(400).json({ error: 'allowedFunctions must be an array of 4-byte selectors (0x + 8 hex).' });
  }

  try {
    // --- Verify the caller actually owns this vault on-chain (defense in depth) ---
    let onchainOwner: string;
    try {
      onchainOwner = await publicClient.readContract({
        address: getAddress(vaultAddress),
        abi: CastleWalletABI,
        functionName: 'owner',
      }) as string;
    } catch {
      return res.status(400).json({ error: 'Vault not found on-chain or not a Castle wallet.' });
    }
    if (getAddress(onchainOwner) !== getAddress(owner)) {
      return res.status(403).json({ error: 'You are not the owner of this vault.' });
    }

    // --- Generate + encrypt the session key server-side ---
    const privateKey = generatePrivateKey();
    const sessionKeyAddress = privateKeyToAccount(privateKey).address;
    const { encrypted, iv } = encryptPrivateKey(privateKey);

    // --- Issue the access token (only the hash is stored) ---
    const accessToken = generateAccessToken();
    const tokenHash = hashToken(accessToken);

    const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();

    // --- Persist vault + agent (service_role, bypasses RLS) ---
    const { error: vaultErr } = await supabase.from('vaults').upsert({
      address: vaultAddress.toLowerCase(),
      owner_address: owner,
      agent_name: name,
    }, { onConflict: 'address' });
    if (vaultErr) {
      console.error('[agents/create] vault upsert failed:', vaultErr.message);
      return res.status(500).json({ error: 'Failed to record vault.' });
    }

    const { error: agentErr } = await supabase.from('agents').insert({
      vault_address: vaultAddress.toLowerCase(),
      session_key_address: sessionKeyAddress.toLowerCase(),
      name,
      preset,
      daily_cap: String(dailyCap),
      approval_threshold: String(approvalThreshold),
      expiry_hours: String(hours),
      allowed_target: typeof allowedTarget === 'string' ? allowedTarget.toLowerCase() : null,
      allowed_functions: allowedFunctions,
      owner_address: owner,
      encrypted_private_key: encrypted,
      encryption_iv: iv,
      access_token_hash: tokenHash,
      token_shown: true,
      token_shown_at: new Date().toISOString(),
      status: 'active',
      expires_at: expiresAt,
    });
    if (agentErr) {
      console.error('[agents/create] agent insert failed:', agentErr.message);
      return res.status(500).json({ error: 'Failed to create agent.' });
    }

    // accessToken is returned exactly once and never stored in plaintext.
    return res.json({
      sessionKeyAddress,
      accessToken,
      vaultAddress: getAddress(vaultAddress),
      expiresAt,
    });
  } catch (err) {
    console.error('[agents/create] error:', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Failed to create agent.' });
  }
});

export default router;
