# Conventions

> Analysis Date: YYYY-MM-DD
> Update when: New patterns established, tooling changes

## Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Constants | SCREAMING_SNAKE | `constants.ts` → `MAX_RETRIES` |
| Types | PascalCase | `types.ts` → `User`, `CreateUserInput` |
| API routes | kebab-case | `api/user-settings/route.ts` |
| Test files | Same as source + `.test` | `UserProfile.test.tsx` |

### Variables & Functions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `const userName = ...` |
| Functions | camelCase, verb prefix | `getUserById()`, `createOrder()` |
| Booleans | `is`/`has`/`should` prefix | `isLoading`, `hasError` |
| Event handlers | `handle` + event | `handleClick`, `handleSubmit` |
| Callbacks | `on` + event | `onClick`, `onSuccess` |

### React Components

| Type | Convention | Example |
|------|------------|---------|
| Component name | PascalCase | `UserProfile` |
| Props interface | `ComponentNameProps` | `UserProfileProps` |
| Context | `ContextName` + `Provider` | `AuthContext`, `AuthProvider` |
| Custom hooks | `use` + noun | `useUser`, `useAuth` |

### Database

| Type | Convention | Example |
|------|------------|---------|
| Tables | snake_case, plural | `users`, `order_items` |
| Columns | snake_case | `created_at`, `user_id` |
| Foreign keys | `referenced_table_id` | `user_id`, `order_id` |
| Indexes | `idx_table_columns` | `idx_users_email` |

---

## Code Organization

### Import Order

```typescript
// 1. External libraries
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal aliases (@/)
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';

// 3. Relative imports
import { UserAvatar } from './UserAvatar';
import type { UserProfileProps } from './types';
```

### File Structure (Components)

```
src/components/UserProfile/
├── index.ts              # Re-export
├── UserProfile.tsx       # Main component
├── UserProfile.test.tsx  # Tests
├── UserAvatar.tsx        # Sub-component
└── types.ts              # Types (if complex)
```

### Export Patterns

```typescript
// Named exports for utilities
export function formatDate(date: Date): string { ... }
export function formatCurrency(amount: number): string { ... }

// Default export for components
export default function UserProfile({ user }: UserProfileProps) { ... }

// Barrel exports in index.ts
export { UserProfile } from './UserProfile';
export { UserAvatar } from './UserAvatar';
export type { UserProfileProps } from './types';
```

---

## Formatting Standards

### General

| Rule | Standard |
|------|----------|
| Indentation | 2 spaces |
| Line length | 100 characters max |
| Quotes | Single quotes for JS/TS |
| Semicolons | [Yes / No] |
| Trailing commas | ES5 (objects, arrays) |

### TypeScript

```typescript
// Prefer interfaces for objects
interface User {
  id: string;
  name: string;
}

// Use type for unions, primitives
type Status = 'active' | 'inactive';
type UserId = string;

// Explicit return types on exports
export function getUser(id: string): Promise<User | null> { ... }
```

### React/JSX

```tsx
// Multi-line props (3+ props)
<Button
  variant="primary"
  size="lg"
  onClick={handleClick}
>
  Submit
</Button>

// Single line (1-2 props)
<Button variant="primary" onClick={handleClick}>Submit</Button>

// Self-closing tags
<Input placeholder="Enter name" />
```

---

## Error Handling

### Creating Errors

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}
```

### Throwing Errors

```typescript
// In services
if (!user) {
  throw new NotFoundError('User');
}

// In API routes
try {
  const result = await service.doSomething();
  return Response.json(result);
} catch (error) {
  return handleError(error);
}
```

### Error Response Format

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "details": {}
  }
}
```

---

## Testing Conventions

### File Naming

| Test Type | Location | Naming |
|-----------|----------|--------|
| Unit tests | Next to source | `*.test.ts` |
| Integration | `tests/integration/` | `*.integration.test.ts` |
| E2E | `tests/e2e/` | `*.e2e.test.ts` |

### Test Structure

```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'user-123';
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUser(userId);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user not found', async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUser('invalid')).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Mocking

```typescript
// Mock setup
jest.mock('@/lib/db');
const mockDb = db as jest.Mocked<typeof db>;

// Reset between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## Comments & Documentation

### Comment Budget

Framework rule (`.claude/rules/code-comments.md`), restated here so it travels with the project:

| Where | Budget |
|-------|--------|
| File / function docblock | **≤ 15 lines**, states *why*, links the spec (`.catalyst/specs/{slug}`) for everything else |
| Inline | Only for a non-obvious invariant, a workaround and its cause, or a security/tenant boundary |
| Decision records, alternatives considered, audit trails | **Never in code.** They live in the spec's `handoff.md` |
| Tests | Name says the behaviour; at most one line naming the invariant |
| Whole diff | Comments < 20% of production lines, < 10% of test lines |

Every comment is re-read by every future agent that opens the file. Write for the reader who has the spec archive one link away.

### When to Comment

```typescript
// DO: Explain WHY, not WHAT
// Using setTimeout to debounce rapid clicks and prevent duplicate submissions
const debouncedSubmit = debounce(handleSubmit, 300);

// DON'T: Obvious comments
// Get the user by ID
const user = await getUser(id);
```

### JSDoc for Public APIs

```typescript
/**
 * Creates a new user account
 * @param data - User registration data
 * @returns The created user (without password)
 * @throws {ValidationError} If email is already taken
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  ...
}
```

### TODO Format

```typescript
// TODO(username): Description of what needs to be done
// TODO: Short description for anonymous todos
// FIXME: Known bug that needs fixing
// HACK: Workaround that should be improved
```

---

## Git Conventions

### Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/user-auth` |
| Bug fix | `fix/description` | `fix/login-redirect` |
| Spec work | `spec/YYYY-MM-DD-slug` | `spec/2025-01-11-auth` |
| Task work | `task/YYYY-MM-DD-slug` | `task/2025-01-15-timeout` |

### Commit Messages

```
type(scope): description

type: feat, fix, docs, style, refactor, test, chore
scope: optional, component/area affected
description: imperative mood, lowercase, no period

Examples:
feat(auth): add password reset flow
fix(api): handle null user in profile endpoint
docs: update README with setup instructions
```

---

*Last updated: YYYY-MM-DD*
