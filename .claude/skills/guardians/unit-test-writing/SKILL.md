---
name: unit-test-writing
description: >
  Write unit tests following TDD principles. TRIGGERS: before any implementation,
  TDD red phase, adding test coverage. Tests MUST be written BEFORE code.
---

# Unit Test Writing

Write unit tests following TDD.

## When to Use

- Before implementing features (TDD)
- Adding coverage to existing code

## TDD Process

```
1. Write test → ❌ FAIL (Red)
2. Write minimal code → ✅ PASS (Green)
3. Refactor → ✅ PASS
```

## Test Pattern

```typescript
describe('createSubscription', () => {
  it('should create with valid plan', async () => {
    const result = await createSubscription({
      userId: 'user-1',
      planId: 'plan-pro',
    })
    expect(result.status).toBe('active')
  })
  
  it('should throw on invalid plan', async () => {
    await expect(
      createSubscription({ userId: 'user-1', planId: 'invalid' })
    ).rejects.toThrow('Invalid plan')
  })
})
```

## What to Test

- Happy path
- Error cases
- Edge cases
- Boundary values

## Checklist

- [ ] Tests written BEFORE code
- [ ] Descriptive test names
- [ ] One assertion per test
- [ ] Edge cases covered
