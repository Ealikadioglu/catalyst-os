---
name: test-fixture-creation
description: >
  Create test fixtures, mocks, and test data. TRIGGERS: setting up test
  environments, creating reusable test data, building mock services.
---

# Test Fixture Creation

Create test fixtures and mock data.

## When to Use

- Setting up test environments
- Creating reusable test data
- Building mock services

## Factory Pattern

```typescript
export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    ...overrides,
  }
}

// Usage
const user = createUser({ email: 'test@example.com' })
```

## Mock Services

```typescript
export const mockStripeService = {
  createSubscription: vi.fn().mockResolvedValue({
    id: 'sub_123',
    status: 'active',
  }),
  
  reset() {
    this.createSubscription.mockClear()
  },
}
```

## Checklist

- [ ] Factories for entities
- [ ] Realistic fake data
- [ ] Service mocks
- [ ] Proper cleanup
