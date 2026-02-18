# Contributing to @hookinbox/verify

Thank you for your interest in contributing! This package helps developers debug webhook signatures across multiple platforms, and we welcome contributions of all kinds.

## 🎯 Ways to Contribute

- **Add new platform verifiers** (e.g., Clerk, Resend, Discord, Twilio)
- **Improve existing verifiers** (better error messages, edge cases)
- **Fix bugs** and improve performance
- **Improve documentation** (README, examples, JSDoc comments)
- **Add tests** (we need comprehensive test coverage!)
- **Report issues** (bugs, feature requests, documentation gaps)

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repo on GitHub, then:
git clone https://github.com/HookInbox/hookinbox-verify.git
cd hookinbox-verify
npm install
```

### 2. Make Your Changes
```bash
# Create a new branch
git checkout -b feature/add-discord-verifier

# Make your changes in src/
# Build to check for errors
npm run build
```

### 3. Test Locally
```bash
# Link the package locally
npm link

# In another project, test it
cd /path/to/test-project
npm link @hookinbox/verify

# Import and test your changes
import { verifyDiscord } from '@hookinbox/verify';
```

### 4. Submit a Pull Request
```bash
git add .
git commit -m "feat: add Discord webhook verifier"
git push origin feature/add-discord-verifier
```

Then open a pull request on GitHub!

## 🧪 Running Tests

We use Jest for testing. All contributions should include tests.

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Check code coverage
```bash
npm run test:coverage
```

**Coverage requirements:**
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Writing Tests

All verifier functions should have comprehensive tests covering:

1. **Valid signatures**
   - Correct signature with string body
   - Correct signature with Buffer body
   - Edge cases (empty body, special characters)

2. **Invalid signatures**
   - Wrong secret
   - Modified body
   - Invalid format
   - Missing required fields

3. **Platform-specific rules**
   - Timestamp tolerance (Stripe)
   - Algorithm detection (GitHub)
   - Base64 encoding (Shopify)

**Example test structure:**
```typescript
import { verifyPlatform } from '../src/platform';

describe('verifyPlatform', () => {
  const secret = 'test_secret';
  const body = '{"test":"data"}';

  describe('valid signatures', () => {
    it('should verify a valid signature', () => {
      // Test implementation
    });
  });

  describe('invalid signatures', () => {
    it('should reject signature with wrong secret', () => {
      // Test implementation
    });
  });

  describe('edge cases', () => {
    it('should handle empty body', () => {
      // Test implementation
    });
  });
});
```

### Test Files Location
```
tests/
├── timing-safe.test.ts
├── stripe.test.ts
├── github.test.ts
├── shopify.test.ts
└── your-platform.test.ts  ← Add your tests here
```

## 📝 Adding a New Platform Verifier

### Example: Adding Discord

**1. Create the verifier file:**

**File: `src/discord.ts`**
```typescript
import { createHmac } from 'crypto';
import { timingSafeEqual } from './timing-safe';

export interface DiscordVerifyOptions {
  body: string | Buffer;
  signature: string;
  timestamp: string;
  publicKey: string;
}

export interface DiscordVerifyResult {
  valid: boolean;
  error?: string;
  details?: {
    expectedSignature?: string;
    receivedSignature?: string;
  };
}

export function verifyDiscord(options: DiscordVerifyOptions): DiscordVerifyResult {
  const { body, signature, timestamp, publicKey } = options;

  try {
    // Discord uses Ed25519 signature verification
    // Implementation here...
    
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
```

**2. Export it in `src/index.ts`:**
```typescript
export { verifyDiscord } from './discord';
export type { DiscordVerifyOptions, DiscordVerifyResult } from './discord';
```

**3. Document it in README.md:**
```markdown
### Discord

\`\`\`typescript
import { verifyDiscord } from '@hookinbox/verify';

const result = verifyDiscord({
  body: rawBody,
  signature: req.headers['x-signature-ed25519'],
  timestamp: req.headers['x-signature-timestamp'],
  publicKey: 'your-public-key',
});
\`\`\`
```

**4. Add your name to contributors:**

We'll add you to the README and package.json contributors list!

## 🎨 Code Style Guidelines

### TypeScript

- Use **TypeScript** for all new code
- Export clear interfaces for options and results
- Use meaningful variable names
- Add JSDoc comments for public APIs

### File Structure
```typescript
// 1. Imports
import { createHmac } from 'crypto';
import { timingSafeEqual } from './timing-safe';

// 2. Types/Interfaces
export interface PlatformVerifyOptions {
  // ...
}

export interface PlatformVerifyResult {
  valid: boolean;
  error?: string;
  details?: Record<string, any>;
}

// 3. Main function
export function verifyPlatform(options: PlatformVerifyOptions): PlatformVerifyResult {
  try {
    // Implementation
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
```

### Error Handling

Always return descriptive errors:
```typescript
// ❌ Bad
return { valid: false, error: 'Invalid signature' };

// ✅ Good
return {
  valid: false,
  error: 'Signature mismatch: expected sha256 but received sha1',
  details: {
    expectedAlgorithm: 'sha256',
    receivedAlgorithm: 'sha1',
  },
};
```

### Timing Safety

Always use `timingSafeEqual()` for signature comparisons:
```typescript
// ❌ Bad - vulnerable to timing attacks
if (expected === received) { ... }

// ✅ Good - constant-time comparison
if (timingSafeEqual(expected, received)) { ... }
```

## 🧪 Testing (Coming Soon)

We're setting up Jest for testing. In the meantime:

1. **Manual testing**: Test with real webhook payloads
2. **Edge cases**: Test invalid signatures, malformed headers, wrong algorithms
3. **Documentation**: Document your test cases in the PR description

## 📋 Pull Request Checklist

Before submitting your PR, make sure:

- [ ] Code builds without errors (`npm run build`)
- [ ] TypeScript types are correct
- [ ] README.md is updated with usage example
- [ ] `src/index.ts` exports your new verifier
- [ ] You've tested it with real webhook payloads
- [ ] Error messages are clear and helpful
- [ ] You used `timingSafeEqual()` for signature comparisons
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `chore:` for maintenance

## 🎁 Platform Ideas (Help Wanted!)

We'd love help adding verifiers for these platforms:

### Payment & Billing
- [ ] **Lemon Squeezy** - Payment platform
- [ ] **Paddle** - Subscription billing
- [ ] **Chargebee** - Subscription management

### Communication
- [ ] **Twilio** - SMS/Voice webhooks
- [ ] **SendGrid** - Email webhooks
- [ ] **Resend** - Email API
- [ ] **Postmark** - Transactional email
- [ ] **Discord** - Bot webhooks

### Auth & Identity
- [ ] **Clerk** - Authentication platform
- [ ] **Auth0** - Identity platform
- [ ] **WorkOS** - Enterprise SSO

### Developer Tools
- [ ] **Vercel** - Deployment webhooks
- [ ] **Railway** - Deployment webhooks
- [ ] **Linear** - Project management
- [ ] **Sentry** - Error tracking

### Ecommerce
- [ ] **WooCommerce** - WordPress ecommerce
- [ ] **BigCommerce** - Ecommerce platform
- [ ] **Printful** - Print-on-demand

### Other
- [ ] **Calendly** - Scheduling webhooks
- [ ] **Typeform** - Form webhooks
- [ ] **Airtable** - Database webhooks
- [ ] **Notion** - Workspace webhooks

**Pick one and submit a PR!** 🚀

## 💬 Questions?

- **GitHub Issues**: https://github.com/hookinbox/verify/issues
- **Twitter**: [@hookinbox](https://twitter.com/hookinbox)
- **Email**: leonardo@hookinbox.dev

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution helps developers debug webhooks faster. Thank you for making this tool better!

---

**Built with ❤️ by the HookInbox community**
