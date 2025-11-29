---
name: service-implementation
description: >
  Implement business logic and service layers. Use when building core
  business logic or creating service wrappers for external APIs.
agent: smith
---

# Service Implementation

Build business logic and service layers.

## When to Use

- Core business logic
- External API wrappers
- Domain operations

## Process

1. **Define interface**
   - Input types
   - Output types
   - Error types

2. **Implement with TDD**
   - Write tests first
   - Implement methods
   - Handle edge cases

3. **Add error handling**
   - Custom error types
   - Retry logic (external)

## Service Pattern

```typescript
class ExternalService {
  async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    // Retry logic for external calls
  }
}
```

## Checklist

- [ ] Clear interface
- [ ] Unit tests
- [ ] Error handling
- [ ] Type safety
