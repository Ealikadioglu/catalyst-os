# Testing Standards

Guidelines for writing and organizing tests.

## Philosophy

**TDD is mandatory** - Tests are written BEFORE implementation.

```
1. Write test → ❌ FAIL (Red)
2. Write minimal code → ✅ PASS (Green)
3. Refactor → ✅ PASS (Refactor)
```

## Test Types

### Unit Tests
- Test individual functions/components in isolation
- Mock external dependencies
- Fast execution
- High coverage

### Integration Tests
- Test multiple units together
- Real database (test instance)
- API endpoint testing
- Moderate coverage

### E2E Tests
- Test complete user flows
- Real browser automation
- Critical paths only
- Selective coverage

## Test Structure

### Arrange-Act-Assert
```typescript
it('should calculate total with discount', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 50 }]
  const discount = 0.1
  
  // Act
  const total = calculateTotal(items, discount)
  
  // Assert
  expect(total).toBe(135)
})
```

### Descriptive Names
```typescript
// Good
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {})
    it('should throw on duplicate email', () => {})
    it('should hash password before saving', () => {})
  })
})

// Bad
describe('tests', () => {
  it('test 1', () => {})  // ❌
  it('works', () => {})   // ❌
})
```

## Test Organization

### File Location
```
src/
├── services/
│   ├── user.ts
│   └── user.test.ts      # Co-located
└── __tests__/            # Or centralized
    └── services/
        └── user.test.ts
```

### Naming
- `*.test.ts` for unit tests
- `*.spec.ts` for integration tests
- `*.e2e.ts` for end-to-end tests

## Mocking Guidelines

### When to Mock
- External APIs
- Database (for unit tests)
- Time-dependent functions
- Random values

### When NOT to Mock
- Internal business logic
- Simple utility functions
- Integration test boundaries

### Mock Example
```typescript
import { vi } from 'vitest'

// Mock external service
vi.mock('@/services/stripe', () => ({
  createSubscription: vi.fn().mockResolvedValue({ id: 'sub_123' }),
}))

// Reset between tests
beforeEach(() => {
  vi.clearAllMocks()
})
```

## Fixtures and Factories

### Factory Pattern
```typescript
// factories/user.ts
export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    ...overrides,
  }
}
```

### Database Seeding
```typescript
// fixtures/seed.ts
export async function seedTestData(db: Database) {
  const users = await db.users.createMany([
    createUser({ email: 'admin@test.com' }),
    createUser({ email: 'user@test.com' }),
  ])
  return { users }
}
```

## Coverage Requirements

| Type | Target |
|------|--------|
| Unit Tests | 80% |
| Integration | Critical paths |
| E2E | Happy paths |

## Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- user.test.ts

# Run in watch mode
npm test -- --watch

# Run E2E
npm run test:e2e
```

## CI Integration

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm test -- --coverage
    - run: npm run test:e2e
```

---

*Update coverage targets and commands for your project.*

