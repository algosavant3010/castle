export const MAX_MEMO_LENGTH = 256;
export const MAX_ABI_LENGTH = 50;
export const MAX_AMOUNT = 10_000;

export function validateAmount(amount: string): string | null {
  const num = parseFloat(amount);
  if (isNaN(num)) return 'Amount must be a valid number.';
  if (num <= 0) return 'Amount must be greater than 0.';
  if (num > MAX_AMOUNT) return `Amount exceeds maximum (${MAX_AMOUNT} MON).`;
  if (amount.includes('e') || amount.includes('E')) return 'Scientific notation not allowed.';
  const parts = amount.split('.');
  if (parts[1] && parts[1].length > 18) return 'Too many decimal places (max 18).';
  return null;
}

export function validateMemo(memo: string | undefined): string | null {
  if (!memo) return null;
  if (typeof memo !== 'string') return 'Memo must be a string.';
  if (memo.length > MAX_MEMO_LENGTH) return `Memo too long (max ${MAX_MEMO_LENGTH} chars).`;
  return null;
}

export function validateAbi(abi: unknown[]): string | null {
  if (abi.length > MAX_ABI_LENGTH) return `ABI too large (max ${MAX_ABI_LENGTH} entries).`;
  for (let i = 0; i < abi.length; i++) {
    if (typeof abi[i] !== 'object' || abi[i] === null) return `ABI entry at index ${i} must be an object.`;
  }
  return null;
}

export function validateFunctionName(name: string): string | null {
  if (name.length > 256) return 'Function name too long.';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return 'Invalid function name format.';
  return null;
}
