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
        rawBodyBytes: body,
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.kind).toBe('valid');
        expect(result.algorithm).toBe('sha256');
        expect(result.expected).toBeDefined();
      }
    });

    it('should verify a valid SHA-1 signature', () => {
      const signature = generateValidSignature(body, secret, 'sha1');

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature: signature,
        secret,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.kind).toBe('valid');
        expect(result.algorithm).toBe('sha1');
      }
    });

    it('should prefer signature256 over signature', () => {
      const sig256 = generateValidSignature(body, secret, 'sha256');
      const sig1 = generateValidSignature(body, secret, 'sha1');

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: sig256,
        signature: sig1,
        secret,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.algorithm).toBe('sha256');
      }
    });

    it('should accept Buffer body', () => {
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: Buffer.from(body),
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(true);
    });

    it('should accept Uint8Array body', () => {
      const signature = generateValidSignature(body, secret, 'sha256');
      const encoder = new TextEncoder();

      const result = verifyGitHub({
        rawBodyBytes: encoder.encode(body),
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('invalid signatures', () => {
    it('should reject signature with wrong secret', () => {
      const signature = generateValidSignature(body, 'wrong_secret', 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(false);
      if (!result.ok && result.kind === 'signature_mismatch') {
        expect(result.expected).toBeDefined();
        expect(result.received).toBeDefined();
      }
    });

    it('should reject signature with modified body', () => {
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: '{"action":"closed"}',
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('signature_mismatch');
      }
    });

    it('should reject missing header', () => {
      const result = verifyGitHub({
        rawBodyBytes: body,
        secret,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('header_missing');
      }
    });

    it('should reject invalid signature format (no equals)', () => {
      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: 'invalid-format',
        secret,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('signature_malformed');
      }
    });

    it('should reject signature without algorithm prefix', () => {
      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: 'abc123def456',
        secret,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('signature_malformed');
      }
    });

    it('should reject unsupported algorithm', () => {
      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: 'md5=abc123def456',
        secret,
      });

      expect(result.ok).toBe(false);
      if (!result.ok && result.kind === 'unsupported_algorithm') {
        expect(result.algorithm).toBe('md5');
      }
    });

    it('should reject signature with invalid hex', () => {
      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: 'sha256=ZZZZZZ',
        secret,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('signature_malformed');
      }
    });

    it('should reject empty secret', () => {
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: signature,
        secret: '',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('signature_malformed');
      }
    });

    it('should reject whitespace-only secret', () => {
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: signature,
        secret: '   ',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('signature_malformed');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty body', () => {
      const emptyBody = '';
      const signature = generateValidSignature(emptyBody, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: emptyBody,
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(true);
    });

    it('should handle special characters in body', () => {
      const specialBody = '{"emoji":"🎉","unicode":"中文"}';
      const signature = generateValidSignature(specialBody, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: specialBody,
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(true);
    });

    it('should handle very large body', () => {
      const largeBody = '{"data":"' + 'a'.repeat(100000) + '"}';
      const signature = generateValidSignature(largeBody, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: largeBody,
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(true);
    });

    it('should handle null signature headers gracefully', () => {
      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: null,
        signature: null,
        secret,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('header_missing');
      }
    });

    it('should trim whitespace from signature headers', () => {
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: `  ${signature}  `,
        secret,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('algorithm detection', () => {
    it('should correctly detect sha256', () => {
      const signature = generateValidSignature(body, secret, 'sha256');

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.algorithm).toBe('sha256');
      }
    });

    it('should correctly detect sha1', () => {
      const signature = generateValidSignature(body, secret, 'sha1');

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature: signature,
        secret,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.algorithm).toBe('sha1');
      }
    });

    it('should handle uppercase algorithm prefix', () => {
      const hash = createHmac('sha256', secret).update(body).digest('hex');
      const signature = `SHA256=${hash}`;

      const result = verifyGitHub({
        rawBodyBytes: body,
        signature256: signature,
        secret,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.algorithm).toBe('sha256');
      }
    });
  });
});
