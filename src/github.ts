import { createHmac } from 'crypto';
import { timingSafeEqual } from './timing-safe';

export interface GitHubVerifyOptions {
  body: string | Buffer;
  signature: string;
  secret: string;
}

export interface GitHubVerifyResult {
  valid: boolean;
  algorithm?: 'sha1' | 'sha256';
  error?: string;
  details?: {
    expectedSignature?: string;
    receivedSignature?: string;
  };
}

export function verifyGitHub(options: GitHubVerifyOptions): GitHubVerifyResult {
  const { body, signature, secret } = options;

  try {
    // Parse signature (format: sha256=abc123 or sha1=abc123)
    const match = signature.match(/^(sha1|sha256)=([a-f0-9]+)$/);
    if (!match) {
      return {
        valid: false,
        error: 'Invalid signature format',
      };
    }

    const algorithm = match[1] as 'sha1' | 'sha256';
    const receivedSignature = match[2];

    // Compute expected signature
    const bodyString = typeof body === 'string' ? body : body.toString('utf8');
    const expectedSignature = createHmac(algorithm, secret)
      .update(bodyString)
      .digest('hex');

    // Compare signatures (timing-safe)
    const valid = timingSafeEqual(expectedSignature, receivedSignature);

    if (!valid) {
      return {
        valid: false,
        algorithm,
        error: 'Signature mismatch',
        details: {
          expectedSignature,
          receivedSignature,
        },
      };
    }

    return {
      valid: true,
      algorithm,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
