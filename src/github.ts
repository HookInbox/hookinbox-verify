import { createHmac } from 'crypto';
import { timingSafeEqual } from './timing-safe';

export type GitHubVerifyResult =
  | { ok: true; kind: 'valid'; algorithm: 'sha1' | 'sha256'; expected: string }
  | { ok: false; kind: 'header_missing' }
  | { ok: false; kind: 'signature_malformed' }
  | { ok: false; kind: 'unsupported_algorithm'; algorithm: string }
  | { ok: false; kind: 'signature_mismatch'; expected: string; received: string };

export interface GitHubVerifyOptions {
  rawBodyBytes: Buffer | Uint8Array | string;
  signature256?: string | null; // x-hub-signature-256
  signature?: string | null;     // x-hub-signature (fallback)
  secret: string;
}

function hmacSha256Hex(secret: string, data: Buffer): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

function hmacSha1Hex(secret: string, data: Buffer): string {
  return createHmac('sha1', secret).update(data).digest('hex');
}

export function verifyGitHub({
  rawBodyBytes,
  signature256,
  signature,
  secret,
}: GitHubVerifyOptions): GitHubVerifyResult {
  if (!secret?.trim()) {
    return { ok: false, kind: 'signature_malformed' };
  }

  const hdr256 = signature256?.trim();
  const hdr1 = signature?.trim();
  const hdr = hdr256 || hdr1;

  if (!hdr) {
    return { ok: false, kind: 'header_missing' };
  }

  const [algo, sig] = hdr.split('=');
  if (!algo || !sig) {
    return { ok: false, kind: 'signature_malformed' };
  }

  const algorithm = algo.toLowerCase();
  if (algorithm !== 'sha256' && algorithm !== 'sha1') {
    return {
      ok: false,
      kind: 'unsupported_algorithm',
      algorithm,
    };
  }

  if (!/^[0-9a-f]+$/i.test(sig)) {
    return { ok: false, kind: 'signature_malformed' };
  }

  // Convert to Buffer if needed
  const bodyBuffer = typeof rawBodyBytes === 'string'
    ? Buffer.from(rawBodyBytes, 'utf8')
    : rawBodyBytes instanceof Uint8Array
    ? Buffer.from(rawBodyBytes)
    : rawBodyBytes;

  const expected = algorithm === 'sha256'
    ? hmacSha256Hex(secret, bodyBuffer)
    : hmacSha1Hex(secret, bodyBuffer);

  if (timingSafeEqual(expected, sig.toLowerCase())) {
    return {
      ok: true,
      kind: 'valid',
      algorithm: algorithm as 'sha1' | 'sha256',
      expected,
    };
  }

  return {
    ok: false,
    kind: 'signature_mismatch',
    expected,
    received: sig.toLowerCase(),
  };
}
