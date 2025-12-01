---
name: api-development
description: >
  Build REST and GraphQL APIs. TRIGGERS: implementing backend endpoints,
  creating API routes, building GraphQL resolvers.
---

# API Development

Build backend APIs following project patterns.

## When to Use

- Creating REST endpoints
- Building GraphQL resolvers
- Implementing API routes

## Process

1. **Check existing patterns**
   - Route structure
   - Response format
   - Error handling

2. **Design endpoint**
   - HTTP method
   - URL pattern
   - Request/response schema

3. **Implement with TDD**
   - Test exists → implement
   - Verify test passes

4. **Add documentation**
   - Types/interfaces
   - Comments if needed

## REST Patterns

```typescript
// Response format
{ data: T, meta?: { pagination } }  // Success
{ error: { code, message } }         // Error
```

## Checklist

- [ ] Input validation
- [ ] Error handling
- [ ] Response typing
- [ ] Tests passing
