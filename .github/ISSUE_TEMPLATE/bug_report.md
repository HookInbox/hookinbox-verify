---
name: Bug report
about: Report a bug or unexpected behavior
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
```typescript
// Code to reproduce the issue
import { verifyStripe } from '@hookinbox/verify';

const result = verifyStripe({
  body: '...',
  signature: '...',
  secret: '...',
});
```

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- Node.js version: [e.g., 20.10.0]
- Package version: [e.g., 1.0.0]
- Platform: [Stripe, GitHub, Shopify, etc.]
