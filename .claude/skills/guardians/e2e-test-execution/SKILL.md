---
name: e2e-test-execution
description: >
  Execute end-to-end tests using browser automation. Use when validating
  complete user flows or running Playwright/Cypress tests.
agent: sentinel
---

# E2E Test Execution

Run end-to-end browser tests.

## When to Use

- Validating user flows
- Testing integrations
- Pre-deployment checks

## Playwright Example

```typescript
test('user can subscribe', async ({ page }) => {
  await page.goto('/pricing')
  await page.click('[data-testid="plan-pro"]')
  await page.fill('[data-testid="card-number"]', '4242...')
  await page.click('[data-testid="submit"]')
  
  await expect(page.locator('[data-testid="success"]'))
    .toBeVisible()
})
```

## Running Tests

```bash
npx playwright test
npx playwright test --headed
npx playwright test subscription.spec.ts
```

## Best Practices

- Use data-testid for selectors
- Wait properly (no arbitrary sleeps)
- Screenshot on failure
- Clean state between tests

## Checklist

- [ ] Happy paths tested
- [ ] Error scenarios covered
- [ ] Screenshots on failure
- [ ] Reasonable timeouts
