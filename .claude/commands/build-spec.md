# /build-spec

Implement a specification using TDD.

## Usage

```
/build-spec @2025-11-29-stripe-integration
```

## Prerequisites

- Spec must exist in `.catalyst/specs/`
- `planning/requirements.md` must be complete
- No unresolved "Open Questions"

## Workflow

The **Forge-Master** agent orchestrates the Technologists.

### Phase 1: Task Breakdown (Forger)

Use `task-breakdown` skill:

1. Read `planning/requirements.md`
2. Break down into implementable tasks
3. Identify dependencies between tasks
4. Create `implementation/tasks.md`:

```markdown
# Implementation Tasks

## Task Groups

### Group 1: Database Setup (Alchemist)
- [ ] T-001: Create subscription schema
- [ ] T-002: Add migration for plans table
Dependencies: None

### Group 2: Backend API (Smith)
- [ ] T-003: Create Stripe service wrapper
- [ ] T-004: Implement subscription endpoints
Dependencies: Group 1

### Group 3: Frontend (Shaper)
- [ ] T-005: Create pricing page
- [ ] T-006: Build subscription management UI
Dependencies: Group 2
```

### Phase 2: Write Tests First (Enforcer)

Use `unit-test-writing` skill:

**CRITICAL**: Tests are written BEFORE implementation.

1. For each task, write failing tests:
   - Unit tests for business logic
   - Integration tests for APIs
   - Component tests for UI
2. Save tests in `implementation/tests/`
3. Verify all tests fail (red phase)

### Phase 3: Implementation

Execute task groups in dependency order:

**Database Tasks** (Alchemist):
- Use `schema-design` and `migration-creation` skills
- Run tests → should start passing

**Backend Tasks** (Smith):
- Use `api-development` and `service-implementation` skills
- Run tests after each task
- Fix until tests pass

**Frontend Tasks** (Shaper):
- Use `react-development` and `ui-component-building` skills
- Run component tests
- Fix until tests pass

### Phase 4: Progress Tracking

Update `implementation/progress.md`:

```markdown
# Implementation Progress

## Status: In Progress

## Completed
- [x] T-001: Subscription schema ✓
- [x] T-002: Migration applied ✓

## In Progress
- [ ] T-003: Stripe service (80%)

## Pending
- [ ] T-004: API endpoints
- [ ] T-005: Pricing page
- [ ] T-006: Subscription UI

## Test Results
- Unit: 12/15 passing
- Integration: 3/3 passing

## Notes
- Discovered need for webhook handling
- Added T-007: Stripe webhooks
```

## TDD Loop

For each task:
```
1. Write test → ❌ Fails (Red)
2. Write minimal code → ✅ Passes (Green)
3. Refactor → ✅ Still passes
4. Move to next task
```

## Output

```
✅ Build complete!

Spec: 2025-11-29-stripe-integration
Tasks: 7/7 completed
Tests: 45 passing, 0 failing

Files created/modified:
├── src/services/stripe.ts
├── src/api/subscriptions.ts
├── src/components/PricingPage.tsx
└── ... (15 more files)

Next: Run /validate-spec @2025-11-29-stripe-integration
```

