import { verifyShopify } from '../src/shopify';
import { createHmac } from 'crypto';

describe('verifyShopify', () => {
  const secret = 'test_secret';
  const body = '{"id":12345}';

  function generateValidSignature(body: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(body)
      .digest('base64');
  }

  it('should verify valid signature', () => {
    const signature = generateValidSignature(body, secret);

    const result = verifyShopify({
      rawBodyBytes: body,
      hmacHeader: signature,
      secret,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe('valid');
      expect(result.expected).toBe(signature);
    }
  });

  it('should reject missing header', () => {
    const result = verifyShopify({
      rawBodyBytes: body,
      secret,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('header_missing');
    }
  });

  it('should reject malformed signature', () => {
    const result = verifyShopify({
      rawBodyBytes: body,
      hmacHeader: 'not-base64!!!',
      secret,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('signature_malformed');
    }
  });

  it('should reject signature mismatch', () => {
    const signature = generateValidSignature(body, 'wrong_secret');

    const result = verifyShopify({
      rawBodyBytes: body,
      hmacHeader: signature,
      secret,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.kind === 'signature_mismatch') {
      expect(result.expected).toBeDefined();
      expect(result.received).toBeDefined();
    }
  });
});
