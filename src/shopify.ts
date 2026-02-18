import { createHmac } from 'crypto';
import { timingSafeEqual } from './timing-safe';

export interface ShopifyVerifyOptions {
  body: string | Buffer;
  signature: string;
  secret: string;
}

export interface ShopifyVerifyResult {
  valid: boolean;
  error?: string;
  details?: {
    expectedSignature?: string;
    receivedSignature?: string;
  };
}

export function verifyShopify(options: ShopifyVerifyOptions): ShopifyVerifyResult {
  const { body, signature, secret } = options;

  try {
    const bodyString = typeof body === 'string' ? body : body.toString('utf8');
    
    // Shopify uses base64-encoded HMAC-SHA256
    const expectedSignature = createHmac('sha256', secret)
      .update(bodyString)
      .digest('base64');

    const valid = timingSafeEqual(expectedSignature, signature);

    if (!valid) {
      return {
        valid: false,
        error: 'Signature mismatch',
        details: {
          expectedSignature,
          receivedSignature: signature,
        },
      };
    }

    return {
      valid: true,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
