/**
 * Constant-time comparison to prevent timing attacks
 * Works with Uint8Array for better performance and compatibility
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

/**
 * Constant-time string comparison
 * Converts strings to Uint8Array for timing-safe comparison
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  
  return constantTimeEqual(aBytes, bBytes);
}

/**
 * Convert hex string to Uint8Array
 * @throws Error if hex string has invalid length or characters
 */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex length');
  }
  
  // Validate hex characters
  if (!/^[0-9a-f]*$/.test(clean)) {
    throw new Error('Invalid hex characters');
  }
  
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
