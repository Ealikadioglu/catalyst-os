# Architecture

> Analysis Date: YYYY-MM-DD
> Update when: Major architectural changes, new patterns introduced

## Overview

Brief description of the system architecture (2-3 sentences).

---

## Conceptual Layers

```
┌─────────────────────────────────────┐
│           Presentation              │  ← UI, API routes
├─────────────────────────────────────┤
│           Application               │  ← Use cases, orchestration
├─────────────────────────────────────┤
│             Domain                  │  ← Business logic, entities
├─────────────────────────────────────┤
│          Infrastructure             │  ← DB, external services
└─────────────────────────────────────┘
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Presentation | `src/app/`, `src/api/` | HTTP handlers, UI components |
| Application | `src/services/` | Use case orchestration |
| Domain | `src/domain/`, `src/types/` | Business rules, entities |
| Infrastructure | `src/lib/`, `src/db/` | External integrations |

---

## Data Flow

### Request Lifecycle

```
HTTP Request
    ↓
Route Handler (`src/api/[route]/route.ts`)
    ↓
Middleware (auth, validation)
    ↓
Service (`src/services/*.ts`)
    ↓
Repository (`src/db/*.ts`)
    ↓
Database
    ↓
Response transformation
    ↓
HTTP Response
```

### State Management (Frontend)

| State Type | Solution | Location |
|------------|----------|----------|
| Server state | React Query / SWR | `src/hooks/queries/` |
| Client state | Zustand / Context | `src/stores/` |
| Form state | React Hook Form | Component-level |
| URL state | Next.js router | `searchParams` |

---

## Key Patterns

### Pattern: Repository

**Purpose**: Abstract database access
**Location**: `src/db/repositories/`

```typescript
// Example: src/db/repositories/user.ts
export const userRepository = {
  findById: (id: string) => db.user.findUnique({ where: { id } }),
  create: (data: CreateUserInput) => db.user.create({ data }),
};
```

### Pattern: Service Layer

**Purpose**: Business logic orchestration
**Location**: `src/services/`

```typescript
// Example: src/services/auth.ts
export async function login(email: string, password: string) {
  const user = await userRepository.findByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new AuthError('Invalid credentials');
  }
  return generateTokens(user);
}
```

### Pattern: [Add more patterns found]

---

## Entry Points

### HTTP API

| Entry Point | Location | Purpose |
|-------------|----------|---------|
| REST API | `src/app/api/` | Main API routes |
| Webhooks | `src/app/api/webhooks/` | External service callbacks |

### Background Jobs

| Entry Point | Location | Purpose |
|-------------|----------|---------|
| Cron jobs | `src/jobs/` | Scheduled tasks |
| Queue workers | `src/workers/` | Async processing |

### CLI

| Entry Point | Location | Purpose |
|-------------|----------|---------|
| Scripts | `scripts/` | Dev/admin utilities |

---

## Cross-Cutting Concerns

### Authentication

```
Request → Auth Middleware → Verify JWT → Attach user to context → Handler
```

- **Implementation**: `src/middleware/auth.ts`
- **Token storage**: httpOnly cookies
- **Session management**: JWT with refresh tokens

### Error Handling

```
Error thrown → Error boundary/middleware → Log → Format response → Client
```

- **Error types**: `src/lib/errors.ts`
- **Error middleware**: `src/middleware/error.ts`
- **Client format**: `{ error: { code, message, details? } }`

### Logging

- **Library**: [pino / winston / console]
- **Format**: JSON structured logs
- **Levels**: error, warn, info, debug
- **Location**: `src/lib/logger.ts`

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Database client | `src/lib/db.ts` |
| Auth middleware | `src/middleware/auth.ts` |
| API error handler | `src/middleware/error.ts` |
| Type definitions | `src/types/index.ts` |
| Environment config | `src/lib/env.ts` |

---

## Diagrams

### System Context (if applicable)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   API    │────▶│    DB    │
└──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
               ┌──────────┐
               │ External │
               │ Services │
               └──────────┘
```

---

*Last updated: YYYY-MM-DD*
