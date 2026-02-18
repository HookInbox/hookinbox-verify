# @hookinbox/verify

[![npm version](https://img.shields.io/npm/v/@hookinbox/verify)](https://www.npmjs.com/package/@hookinbox/verify)
[![Tests](https://github.com/HookInbox/hookinbox-verify/actions/workflows/test.yml/badge.svg)](https://github.com/HookInbox/hookinbox-verify/actions)
[![Coverage](https://img.shields.io/codecov/c/github/HookInbox/hookinbox-verify)](https://codecov.io/gh/HookInbox/hookinbox-verify)
[![License](https://img.shields.io/npm/l/@HookInbox/hookinbox-verify)](https://github.com/HookInbox/hookinbox-verify/blob/main/LICENSE)

Zero-dependency webhook signature verification for Stripe, GitHub, Shopify, and more.

## Why @hookinbox/verify?

**Better than platform SDKs:**
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
  body: rawBody,
  signature: req.headers['stripe-signature'],
  secret: 'whsec_...',
  tolerance: 300, // optional
});

if (result.valid) {
  console.log('✅ Valid signature');
} else {
  console.error('❌ Invalid:', result.error);
}
```

### GitHub
```typescript
import { verifyGitHub } from '@hookinbox/verify';

const result = verifyGitHub({
  body: rawBody,
  signature: req.headers['x-hub-signature-256'],
  secret: 'your-secret',
});
```

### Shopify
```typescript
import { verifyShopify } from '@hookinbox/verify';

const result = verifyShopify({
  body: rawBody,
  signature: req.headers['x-shopify-hmac-sha256'],
  secret: 'your-secret',
});
```

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

**Built with ❤️ by the HookInbox community**
