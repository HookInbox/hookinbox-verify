import { verifyStripe, parseStripeSignatureHeader } from '../src/stripe';
import { createHmac } from 'crypto';

describe('parseStripeSignatureHeader', () => {
  it('should parse valid signature header', () => {
    const result = parseStripeSignatureHeader('t=1234567890,v1=abc123');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.timestamp).toBe(1234567890);
      expect(result.v1).toEqual(['abc123']);
    }
  });

  it('should parse multiple v1 signatures', () => {
    const result = parseStripeSignatureHeader('t=123,v1=abc,v1=def');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.v1).toEqual(['abc', 'def']);
    }
  });

  it('should reject missing header', () => {
    const result = parseStripeSignatureHeader(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing_header');
    }
  });

  it('should reject missing timestamp', () => {
    const result = parseStripeSignatureHeader('v1=abc123');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing_t');
    }
  });

  it('should reject missing v1', () => {
    const result = parseStripeSignatureHeader('t=1234567890');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing_v1');
    }
  });

  it('should reject invalid timestamp', () => {
    const result = parseStripeSignatureHeader('t=invalid,v1=abc');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('bad_t');
    }
  });
});

describe('verifyStripe', () => {
  const secret = 'whsec_test_secret';
  const body = '{"event":"test"}';

  function generateValidSignature(timestamp: number, body: string, secret: string): string {
    const signedPayload = `${timestamp}.${body}`;
    const signature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  it('should verify valid signature', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateValidSignature(timestamp, body, secret);

    const result = verifyStripe({
      rawBodyBytes: body,
      stripeSignatureHeader: signature,
      signingSecret: secret,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe('valid');
      expect(result.timestamp).toBe(timestamp);
    }
  });

  it('should reject timestamp too old', () => {
    const timestamp = Math.floor(Date.now() / 1000) - 400;
    const signature = generateValidSignature(timestamp, body, secret);

    const result = verifyStripe({
      rawBodyBytes: body,
      stripeSignatureHeader: signature,
      signingSecret: secret,
      toleranceSec: 300,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.kind === 'timestamp_too_old') {
      expect(result.ageSec).toBeGreaterThan(300);
      expect(result.toleranceSec).toBe(300);
    }
  });

  it('should reject timestamp in future', () => {
    const timestamp = Math.floor(Date.now() / 1000) + 400;
    const signature = generateValidSignature(timestamp, body, secret);

    const result = verifyStripe({
      rawBodyBytes: body,
      stripeSignatureHeader: signature,
      signingSecret: secret,
      toleranceSec: 300,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('timestamp_in_future');
    }
  });

  it('should reject bad secret format', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateValidSignature(timestamp, body, 'bad_secret');

    const result = verifyStripe({
      rawBodyBytes: body,
      stripeSignatureHeader: signature,
      signingSecret: 'bad_secret', // doesn't start with whsec_
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('bad_secret_format');
    }
  });

  it('should reject signature mismatch', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateValidSignature(timestamp, body, 'whsec_wrong');

    const result = verifyStripe({
      rawBodyBytes: body,
      stripeSignatureHeader: signature,
      signingSecret: secret,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.kind === 'signature_mismatch') {
      expect(result.expectedHex).toBeDefined();
      expect(result.receivedV1).toBeDefined();
    }
  });
});
