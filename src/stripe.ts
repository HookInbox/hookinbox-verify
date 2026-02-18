import { createHmac } from 'crypto';

export type StripeSigParse =
  | { ok: true; timestamp: number; v1: string[] }
  | { ok: false; reason: 'missing_header' | 'missing_t' | 'missing_v1' | 'bad_t' };

export function parseStripeSignatureHeader(h: string | null): StripeSigParse {
  if (!h) return { ok: false, reason: 'missing_header' };

  const parts = h.split(',').map((p) => p.trim()).filter(Boolean);
  let tStr: string | null = null;
  const v1: string[] = [];

  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq <= 0) continue;
    const k = p.slice(0, eq).trim();
    const v = p.slice(eq + 1).trim();
    if (k === 't') tStr = v;
    if (k === 'v1') v1.push(v);
  }

  if (!tStr) return { ok: false, reason: 'missing_t' };
  const timestamp = Number(tStr);
  if (!Number.isFinite(timestamp)) return { ok: false, reason: 'bad_t' };
  if (v1.length === 0) return { ok: false, reason: 'missing_v1' };

  return { ok: true, timestamp, v1 };
}

function hmacSha256Hex(secret: string, data: Buffer): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

export type StripeVerifyResult =
  | { ok: true; kind: 'valid'; expectedHex: string; timestamp: number; ageSec: number }
  | { ok: false; kind: 'missing_header' | 'missing_t' | 'missing_v1' | 'bad_t' | 'bad_secret_format' }
  | { ok: false; kind: 'timestamp_too_old'; ageSec: number; toleranceSec: number }
  | { ok: false; kind: 'timestamp_in_future'; ageSec: number; toleranceSec: number }
  | { ok: false; kind: 'signature_mismatch'; expectedHex: string; receivedV1: string[] };

export interface StripeVerifyOptions {
  rawBodyBytes: Buffer | Uint8Array | string;
  stripeSignatureHeader: string | null;
  signingSecret: string;
  nowMs?: number;
  toleranceSec?: number;
}

export function verifyStripe({
  rawBodyBytes,
  stripeSignatureHeader,
  signingSecret,
  nowMs = Date.now(),
  toleranceSec = 300,
}: StripeVerifyOptions): StripeVerifyResult {
  const parsed = parseStripeSignatureHeader(stripeSignatureHeader);
  if (!parsed.ok) {
    return { ok: false, kind: parsed.reason };
  }

  if (!signingSecret.startsWith('whsec_')) {
    return { ok: false, kind: 'bad_secret_format' };
  }

  const ageSec = Math.floor(nowMs / 1000) - parsed.timestamp;

  if (ageSec > toleranceSec) {
    return {
      ok: false,
      kind: 'timestamp_too_old',
      ageSec,
      toleranceSec,
    };
  }

  if (ageSec < -toleranceSec) {
    return {
      ok: false,
      kind: 'timestamp_in_future',
      ageSec,
      toleranceSec,
    };
  }

  // Convert to Buffer if needed
  const bodyBuffer = typeof rawBodyBytes === 'string'
    ? Buffer.from(rawBodyBytes, 'utf8')
    : rawBodyBytes instanceof Uint8Array
    ? Buffer.from(rawBodyBytes)
    : rawBodyBytes;

  // Build signed payload: ${t}.${rawBody}
  const signedPayload = Buffer.concat([
    Buffer.from(String(parsed.timestamp)),
    Buffer.from('.'),
    bodyBuffer,
  ]);

  const expectedHex = hmacSha256Hex(signingSecret, signedPayload);

  // Match any v1 signature
  const matched = parsed.v1.some((v) => v === expectedHex);

  if (matched) {
    return {
      ok: true,
      kind: 'valid',
      expectedHex,
      timestamp: parsed.timestamp,
      ageSec,
    };
  }

  return {
    ok: false,
    kind: 'signature_mismatch',
    expectedHex,
    receivedV1: parsed.v1,
  };
}
