import { createHmac } from 'crypto';
import { verifyStripe } from '../src/stripe';

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

  describe('valid signatures', () => {
    it('should verify a valid signature', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateValidSignature(timestamp, body, secret);

      const result = verifyStripe({
        body,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
      expect(result.timestamp).toBe(timestamp);
      expect(result.error).toBeUndefined();
    });

    it('should accept Buffer body', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateValidSignature(timestamp, body, secret);

      const result = verifyStripe({
        body: Buffer.from(body),
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });

    it('should accept signature within tolerance', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 200; // 200 seconds ago
      const signature = generateValidSignature(timestamp, body, secret);

      const result = verifyStripe({
        body,
        signature,
        secret,
        tolerance: 300,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('invalid signatures', () => {
    it('should reject signature with wrong secret', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateValidSignature(timestamp, body, 'wrong_secret');

      const result = verifyStripe({
        body,
        signature,
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Signature mismatch');
      expect(result.details?.expectedSignature).toBeDefined();
      expect(result.details?.receivedSignature).toBeDefined();
    });

    it('should reject signature with modified body', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateValidSignature(timestamp, body, secret);

      const result = verifyStripe({
        body: '{"event":"modified"}',
        signature,
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Signature mismatch');
    });

    it('should reject signature outside tolerance', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const signature = generateValidSignature(timestamp, body, secret);

      const result = verifyStripe({
        body,
        signature,
        secret,
        tolerance: 300,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Timestamp is');
      expect(result.error).toContain('seconds old');
      expect(result.details?.timestampAge).toBe(400);
    });

    it('should reject invalid signature format', () => {
      const result = verifyStripe({
        body,
        signature: 'invalid-format',
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should reject signature without timestamp', () => {
      const result = verifyStripe({
        body,
        signature: 'v1=abc123',
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should reject signature without v1 signature', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const result = verifyStripe({
        body,
        signature: `t=${timestamp}`,
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });
  });

  describe('edge cases', () => {
    it('should handle empty body', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const emptyBody = '';
      const signature = generateValidSignature(timestamp, emptyBody, secret);

      const result = verifyStripe({
        body: emptyBody,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });

    it('should handle special characters in body', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const specialBody = '{"emoji":"🚀","unicode":"日本語"}';
      const signature = generateValidSignature(timestamp, specialBody, secret);

      const result = verifyStripe({
        body: specialBody,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });

    it('should use default tolerance of 300 seconds', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 350; // 350 seconds ago
      const signature = generateValidSignature(timestamp, body, secret);

      const result = verifyStripe({
        body,
        signature,
        secret,
        // No tolerance specified
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('tolerance: 300');
    });
  });
});
