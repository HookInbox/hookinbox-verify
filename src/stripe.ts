import { createHmac } from 'crypto';
import { timingSafeEqual } from './timing-safe';

export interface StripeVerifyOptions {
  body: string | Buffer;
  signature: string;
  secret: string;
  tolerance?: number;
}

export interface StripeVerifyResult {
  valid: boolean;
  timestamp?: number;
  error?: string;
  details?: {
    timestampAge?: number;
    expectedSignature?: string;
    receivedSignature?: string;
  };
}

export function verifyStripe(options: StripeVerifyOptions): StripeVerifyResult {
  const { body, signature, secret, tolerance = 300 } = options;

  try {
    // Parse signature header
    const parts = signature.split(',');
    let timestamp: number | null = null;
    let receivedSignature: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        receivedSignature = value;
      }
    }

    if (!timestamp || !receivedSignature) {
      return {
        valid: false,
        error: 'Invalid signature format',
      };
    }

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    const age = now - timestamp;

    if (age > tolerance) {
      return {
        valid: false,
        timestamp,
        error: `Timestamp is ${age} seconds old (tolerance: ${tolerance}s)`,
        details: {
          timestampAge: age,
        },
      };
    }

    // Compute expected signature
    const bodyString = typeof body === 'string' ? body : body.toString('utf8');
    const signedPayload = `${timestamp}.${bodyString}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Compare signatures (timing-safe)
    const valid = timingSafeEqual(expectedSignature, receivedSignature);

    if (!valid) {
      return {
        valid: false,
        timestamp,
        error: 'Signature mismatch',
        details: {
          expectedSignature,
          receivedSignature,
        },
      };
    }

    return {
      valid: true,
      timestamp,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
