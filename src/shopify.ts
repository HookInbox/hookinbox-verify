import { createHmac } from 'crypto';

function hmacSha256Base64(secret: string, data: Buffer): string {
  return createHmac('sha256', secret).update(data).digest('base64');
}

export type ShopifyVerifyResult =
  | { ok: true; kind: 'valid'; expected: string }
  | { ok: false; kind: 'header_missing' }
  | { ok: false; kind: 'signature_malformed' }
  | { ok: false; kind: 'signature_mismatch'; expected: string; received: string };

export interface ShopifyVerifyOptions {
  rawBodyBytes: Buffer | Uint8Array | string;
  hmacHeader?: string | null;
  secret: string;
}

/**
 * Verify Shopify webhook signature
 *
 * Shopify sends the HMAC in the X-Shopify-Hmac-SHA256 header as a Base64-encoded string
 */
export function verifyShopify({
  rawBodyBytes,
  hmacHeader,
  secret,
}: ShopifyVerifyOptions): ShopifyVerifyResult {
  if (!secret?.trim()) {
    return { ok: false, kind: 'signature_malformed' };
  }

  const hmac = hmacHeader?.trim();

  if (!hmac) {
    return { ok: false, kind: 'header_missing' };
  }

  // Shopify sends base64-encoded HMAC
  // Validate it looks like base64
  if (!/^[A-Za-z0-9+/]+=*$/.test(hmac)) {
    return { ok: false, kind: 'signature_malformed' };
  }

  // Convert to Buffer if needed
  const bodyBuffer = typeof rawBodyBytes === 'string'
    ? Buffer.from(rawBodyBytes, 'utf8')
    : rawBodyBytes instanceof Uint8Array
    ? Buffer.from(rawBodyBytes)
    : rawBodyBytes;

  const expected = hmacSha256Base64(secret, bodyBuffer);

  if (expected === hmac) {
    return {
      ok: true,
      kind: 'valid',
      expected,
    };
  }

  return {
    ok: false,
    kind: 'signature_mismatch',
    expected,
    received: hmac,
  };
}
