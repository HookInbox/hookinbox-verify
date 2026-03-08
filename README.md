# @hookinbox/verify

[![npm version](https://img.shields.io/npm/v/@hookinbox/verify)](https://www.npmjs.com/package/@hookinbox/verify)
[![Tests](https://github.com/HookInbox/hookinbox-verify/actions/workflows/test.yml/badge.svg)](https://github.com/HookInbox/hookinbox-verify/actions)
[![license](https://img.shields.io/badge/license-MIT-green)](https://github.com/HookInbox/hookinbox-verify/blob/main/LICENSE)

Webhook signature verification for Stripe, GitHub, Shopify, and more.

Most platform SDKs validate signatures but throw generic errors like:

“Invalid signature”

This library returns structured failure reasons (timestamp too old, body modified, wrong algorithm, etc.) to make debugging easier.

```javascript
const result = verifyStripe(...)

if (!result.ok) {
  console.log(result.kind)
}
// "timestamp_too_old"
// "signature_mismatch"
// "missing_header"
```

## Why @hookinbox/verify?

**Why use this instead of platform SDKs?**
- ✅ **Zero dependencies** - No bloat, just verification
- ✅ **Detailed diagnostics** - Know exactly why verification failed
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Multi-platform** - One package for all platforms
- ✅ **Well-tested** - 80%+ code coverage
- ✅ **Lightweight** - < 5KB minified

**Common issues we help debug:**
- Timestamp too old/future (with exact age)
- Wrong secret key used
- Body modified by middleware
- SHA-1 vs SHA-256 confusion
- Base64 encoding issues

## Installation
```bash
npm install @hookinbox/verify
```

## Usage

### Stripe
```typescript
import { verifyStripe } from '@hookinbox/verify';

const result = verifyStripe({
  rawBodyBytes: rawBody, // string | Buffer | Uint8Array
  stripeSignatureHeader: req.headers['stripe-signature'],
  signingSecret: 'whsec_...', // must start with whsec_
  toleranceSec: 300, // optional, default 300
});

if (result.ok) {
  console.log('✅ Valid signature');
  console.log('Timestamp:', result.timestamp);
  console.log('Age:', result.ageSec, 'seconds');
} else {
  console.error('❌ Error:', result.kind);
  
  if (result.kind === 'timestamp_too_old') {
    console.error(`Timestamp is ${result.ageSec}s old (max: ${result.toleranceSec}s)`);
  }
  
  if (result.kind === 'signature_mismatch') {
    console.error('Expected:', result.expectedHex);
    console.error('Received:', result.receivedV1);
  }
}
```

### GitHub
```typescript
import { verifyGitHub } from '@hookinbox/verify';

const result = verifyGitHub({
  rawBodyBytes: rawBody,
  signature256: req.headers['x-hub-signature-256'], // preferred
  signature: req.headers['x-hub-signature'],         // fallback (sha1)
  secret: 'your-secret',
});

if (result.ok) {
  console.log('✅ Valid signature');
  console.log('Algorithm:', result.algorithm);
} else {
  console.error('❌ Error:', result.kind);
}
```

### Shopify
```typescript
import { verifyShopify } from '@hookinbox/verify';

const result = verifyShopify({
  rawBodyBytes: rawBody,
  hmacHeader: req.headers['x-shopify-hmac-sha256'],
  secret: 'your-secret',
});

if (result.ok) {
  console.log('✅ Valid signature');
} else {
  console.error('❌ Error:', result.kind);
}
```

## Utilities

The package also exports timing-safe comparison utilities:

### Timing-Safe String Comparison
```typescript
import { timingSafeEqual } from '@hookinbox/verify';

const isValid = timingSafeEqual(expectedSignature, receivedSignature);
```

### Timing-Safe Byte Comparison
```typescript
import { constantTimeEqual } from '@hookinbox/verify';

const a = new Uint8Array([1, 2, 3]);
const b = new Uint8Array([1, 2, 3]);
const isEqual = constantTimeEqual(a, b); // true
```

### Hex Utilities
```typescript
import { hexToBytes, bytesToHex } from '@hookinbox/verify';

// Convert hex string to bytes
const bytes = hexToBytes('deadbeef');
// Uint8Array([0xDE, 0xAD, 0xBE, 0xEF])

// Convert bytes to hex string
const hex = bytesToHex(bytes);
// 'deadbeef'
```

## Security

All signature comparisons use **constant-time comparison** to prevent timing attacks. This means the comparison time doesn't leak information about how many characters match.

**Why this matters:**
- Standard `===` comparison short-circuits on first mismatch
- Attackers can measure response times to guess secrets
- Our `timingSafeEqual` always compares all bytes

## Features

- ✅ Zero dependencies
- ✅ TypeScript support
- ✅ Detailed error messages
- ✅ Timing-safe comparisons
- ✅ Works in Node.js, Edge, Cloudflare Workers

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Check coverage
npm run test:coverage
```

### Building
```bash
npm run build
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Looking for ideas?** Check out platforms we'd love to support:
- Clerk, Resend, Discord, Twilio, SendGrid
- Lemon Squeezy, Paddle, Chargebee
- Vercel, Railway, Linear

## Testing

Comprehensive test suite with 80%+ coverage:
- ✅ Valid signature verification
- ✅ Invalid signature detection
- ✅ Edge cases (empty body, special chars, etc.)
- ✅ Timing-safe comparisons
- ✅ Platform-specific rules

## License

MIT © [HookInbox](https://hookinbox.dev)

## Related

- [HookInbox](https://hookinbox.dev) - Debug webhooks with live capture & verification
- [Contributing Guide](CONTRIBUTING.md) - Help us add more platforms!

---

**Maintained by the HookInbox project.**
