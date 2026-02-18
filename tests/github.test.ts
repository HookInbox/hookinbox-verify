import { createHmac } from 'crypto';
import { verifyGitHub } from '../src/github';

describe('verifyGitHub', () => {
  const secret = 'test_secret';
  const body = '{"action":"opened"}';

  function generateValidSignature(body: string, secret: string, algorithm: 'sha1' | 'sha256'): string {
    const signature = createHmac(algorithm, secret)
      .update(body)
      .digest('hex');
    return `${algorithm}=${signature}`;
  }

  describe('valid signatures', () => {
    it('should verify a valid SHA-256 signature', () => {
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        body,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
      expect(result.algorithm).toBe('sha256');
      expect(result.error).toBeUndefined();
    });

    it('should verify a valid SHA-1 signature', () => {
      const signature = generateValidSignature(body, secret, 'sha1');

      const result = verifyGitHub({
        body,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
      expect(result.algorithm).toBe('sha1');
    });

    it('should accept Buffer body', () => {
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        body: Buffer.from(body),
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('invalid signatures', () => {
    it('should reject signature with wrong secret', () => {
      const signature = generateValidSignature(body, 'wrong_secret', 'sha256');

      const result = verifyGitHub({
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
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        body: '{"action":"closed"}',
        signature,
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Signature mismatch');
    });

    it('should reject invalid signature format', () => {
      const result = verifyGitHub({
        body,
        signature: 'invalid-format',
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should reject signature without algorithm prefix', () => {
      const result = verifyGitHub({
        body,
        signature: 'abc123def456',
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should reject signature with invalid hex', () => {
      const result = verifyGitHub({
        body,
        signature: 'sha256=ZZZZZZ',
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });
  });

  describe('edge cases', () => {
    it('should handle empty body', () => {
      const emptyBody = '';
      const signature = generateValidSignature(emptyBody, secret, 'sha256');

      const result = verifyGitHub({
        body: emptyBody,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });

    it('should handle special characters in body', () => {
      const specialBody = '{"emoji":"🎉","unicode":"中文"}';
      const signature = generateValidSignature(specialBody, secret, 'sha256');

      const result = verifyGitHub({
        body: specialBody,
        signature,
        secret,
      });

      expect(result.valid).toBe(true);
    });
  });
});
