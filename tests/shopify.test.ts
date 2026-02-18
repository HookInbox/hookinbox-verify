import { createHmac } from 'crypto';
import { verifyShopify } from '../src/shopify';

describe('verifyShopify', () => {
  const secret = 'test_secret';
  const body = '{"id":12345,"email":"test@example.com"}';

  function generateValidSignature(body: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(body)
      .digest('base64');
  }

  describe('valid signatures', () => {
    it('should verify a valid signature', () => {
      const signature = generateValidSignature(body, secret);

      const result = verifyShopify({
        body,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept Buffer body', () => {
      const signature = generateValidSignature(body, secret);

      const result = verifyShopify({
        body: Buffer.from(body),
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('invalid signatures', () => {
    it('should reject signature with wrong secret', () => {
      const signature = generateValidSignature(body, 'wrong_secret');

      const result = verifyShopify({
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
      const signature = generateValidSignature(body, secret);

      const result = verifyShopify({
        body: '{"id":99999}',
        signature,
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Signature mismatch');
    });
  });

  describe('edge cases', () => {
    it('should handle empty body', () => {
      const emptyBody = '';
      const signature = generateValidSignature(emptyBody, secret);

      const result = verifyShopify({
        body: emptyBody,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });

    it('should handle special characters in body', () => {
      const specialBody = '{"name":"Café ☕","price":"$9.99"}';
      const signature = generateValidSignature(specialBody, secret);

      const result = verifyShopify({
        body: specialBody,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });
  });
});
