# Coding Standards

Project-wide coding conventions and style guidelines.

## General Principles

### Code Style
- **Clarity over cleverness** - Write code that's easy to understand
- **Consistency** - Follow existing patterns in the codebase
- **Self-documenting** - Good names reduce need for comments
- **Small functions** - Single responsibility, easy to test

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `API_URL` |
| Functions | camelCase | `getUserById`, `validateInput` |
| Classes | PascalCase | `UserService`, `PaymentHandler` |
| Files | kebab-case | `user-service.ts`, `payment-handler.py` |
| Components | PascalCase | `UserProfile.tsx`, `Button.tsx` |

### File Organization

```
src/
├── components/     # UI components
├── hooks/          # Custom React hooks
├── services/       # Business logic
├── utils/          # Utility functions
├── types/          # Type definitions
└── api/            # API routes/handlers
```

## TypeScript/JavaScript

### Prefer
```typescript
// Type interfaces for objects
interface User {
  id: string
  name: string
  email: string
}

// Const over let
const user = getUser()

// Async/await over promises
const data = await fetchData()

// Optional chaining
const name = user?.profile?.name

// Nullish coalescing
const value = input ?? defaultValue
```

### Avoid
```typescript
// var keyword
var user = getUser()  // ❌

// any type
const data: any = {}  // ❌

// Nested callbacks
getData(result => {
  process(result, processed => {  // ❌
    save(processed)
  })
})
```

## Python

### Style
- Follow PEP 8
- Use type hints
- Docstrings for public functions

```python
def get_user_by_id(user_id: str) -> User | None:
    """
    Retrieve a user by their ID.
    
    Args:
        user_id: The unique identifier for the user
        
    Returns:
        User object if found, None otherwise
    """
    return db.users.find_one({"id": user_id})
```

## React Components

### Function Components
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant, children, onClick }: ButtonProps) {
  return (
    <button className={styles[variant]} onClick={onClick}>
      {children}
    </button>
  )
}
```

### Hooks Rules
- Only call at top level
- Only call from React functions
- Custom hooks start with `use`

## Error Handling

### Do
```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  logger.error('Operation failed', { error })
  throw new AppError('OPERATION_FAILED', 'Meaningful message')
}
```

### Don't
```typescript
try {
  const result = await riskyOperation()
} catch (e) {
  console.log(e)  // ❌ Silent failure
}
```

## Comments

### When to Comment
- Complex algorithms
- Non-obvious business logic
- Workarounds with context
- Public API documentation

### When NOT to Comment
```typescript
// Get the user  ❌ (obvious)
const user = getUser()

// Increment counter ❌ (obvious)
counter++
```

## Imports

### Order
1. External packages
2. Internal modules
3. Relative imports
4. Types/interfaces

```typescript
// External
import React from 'react'
import { useQuery } from '@tanstack/react-query'

// Internal
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

// Relative
import { formatDate } from './utils'

// Types
import type { User } from '@/types'
```

---

*Update this file to match your project's specific standards.*

