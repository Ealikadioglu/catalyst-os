# /build-spec

Implement a specification using **strict TDD**.

## Usage

```
/build-spec @2025-11-29-stripe-integration
```

## Prerequisites

- Spec must exist in `.catalyst/specs/`
- `planning/requirements.md` must be complete
- No unresolved "Open Questions"

---

## ⚠️ TDD IS MANDATORY - NO EXCEPTIONS

```
╔═══════════════════════════════════════════════════════════════════╗
║  🚫 IMPLEMENTATION WITHOUT TESTS IS FORBIDDEN                     ║
║                                                                    ║
║  The build MUST follow this exact sequence:                       ║
║                                                                    ║
║  1. Forger    → Create tasks                                      ║
║  2. Enforcer  → Write ALL tests (must FAIL)         ← GATE 1     ║
║  3. Verify    → Run tests, confirm RED              ← GATE 2     ║
║  4. Builders  → Implement until GREEN               ← Only after ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## ORCHESTRATION MODE

**IMPORTANT**: This command operates in orchestration mode. The main agent DELEGATES work to specialized sub-agents.

### Execution Order (STRICT - NO PARALLEL UNTIL GATE 2)

```
Phase 1: Forger (task breakdown)
              ↓
Phase 2: Enforcer (write ALL failing tests)
              ↓
         ┌────────────────────────────┐
         │  🚦 GATE: RED PHASE CHECK  │
         │  All tests must FAIL       │
         │  If any pass → STOP        │
         └────────────────────────────┘
              ↓ (only after gate passes)
Phase 3: [Alchemist + Smith + Shaper] (parallel implementation)
              ↓
         ┌────────────────────────────┐
         │  🚦 GATE: GREEN PHASE      │
         │  All tests must PASS       │
         └────────────────────────────┘
```

### ⚡ PARALLEL EXECUTION RULES

| Phase | Agents | Parallel? |
|-------|--------|-----------|
| Task Breakdown | Forger | No (must complete first) |
| Test Writing | Enforcer | No (must complete before impl) |
| Implementation | Smith + Shaper | ✅ Yes (after tests exist) |
| Implementation | Alchemist → Smith | Sequential if API needs DB |

**WRONG:**
```
forger → [enforcer + smith + shaper]  ← Tests parallel with code = NO TDD!
```

**CORRECT:**
```
forger → enforcer → GATE → [smith + shaper]  ← Tests BEFORE code
```

---

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

---

### Phase 2: Write Tests First (Enforcer) — 🔴 RED PHASE

**🚨 CRITICAL: This phase MUST complete before ANY implementation starts.**

Use `unit-test-writing` skill:

1. **For EVERY task in tasks.md**, write failing tests:
   - Unit tests for business logic
   - Integration tests for APIs
   - Component tests for UI

2. Save tests in `implementation/tests/`:
   ```
   implementation/tests/
   ├── unit/
   │   ├── stripe-service.test.ts
   │   └── subscription-api.test.ts
   ├── integration/
   │   └── stripe-webhook.test.ts
   └── component/
       ├── PricingPage.test.tsx
       └── SubscriptionUI.test.tsx
   ```

3. **Create test manifest** in `implementation/test-manifest.md`:
   ```markdown
   # Test Manifest
   
   ## Status: 🔴 RED PHASE (All tests failing)
   
   | Task | Test File | Status |
   |------|-----------|--------|
   | T-001 | unit/schema.test.ts | ❌ FAIL |
   | T-002 | unit/migration.test.ts | ❌ FAIL |
   | T-003 | unit/stripe-service.test.ts | ❌ FAIL |
   | T-004 | integration/subscription-api.test.ts | ❌ FAIL |
   | T-005 | component/PricingPage.test.tsx | ❌ FAIL |
   | T-006 | component/SubscriptionUI.test.tsx | ❌ FAIL |
   
   ## Verification
   - [ ] All tests written
   - [ ] All tests executed
   - [ ] All tests FAIL (red phase confirmed)
   ```

---

### 🚦 GATE 1: Red Phase Verification

**STOP! Before proceeding to implementation:**

```bash
# Run all tests - they MUST fail
npm test  # or appropriate test command

# Expected output:
# Tests: 0 passed, 45 failed
# Status: RED ✓
```

**Gate Checklist:**
- [ ] Every task has at least one test
- [ ] All tests have been executed
- [ ] All tests FAIL (none pass)
- [ ] Test manifest updated with FAIL status

**If ANY test passes → STOP and investigate:**
- Is the test testing the right thing?
- Is there pre-existing code being tested?
- Rewrite test to ensure it tests NEW functionality

---

### Phase 3: Implementation — 🟢 GREEN PHASE

**Only start this phase AFTER Gate 1 passes!**

Execute task groups in dependency order:

**Database Tasks** (Alchemist):
- Use `schema-design` and `migration-creation` skills
- After each task: run tests → some should start passing
- Continue until all DB tests pass

**Backend Tasks** (Smith):
- Use `api-development` and `service-implementation` skills
- TDD Loop for each task:
  1. Run test → ❌ Fails
  2. Write minimal code
  3. Run test → ✅ Passes
  4. Refactor if needed
  5. Run test → ✅ Still passes

**Frontend Tasks** (Shaper):
- Use `react-development` and `ui-component-building` skills
- Same TDD loop as backend

### Implementation Rules

```
┌─────────────────────────────────────────────────────────────┐
│  FOR EACH TASK:                                             │
│                                                             │
│  1. Verify test exists and FAILS                           │
│  2. Write MINIMAL code to make test pass                   │
│  3. Run test → must PASS                                   │
│  4. Refactor if needed                                     │
│  5. Run test → must still PASS                             │
│  6. Commit: "feat(T-XXX): description"                     │
│                                                             │
│  🚫 NEVER write code without a failing test first          │
│  🚫 NEVER write more code than needed to pass the test     │
└─────────────────────────────────────────────────────────────┘
```

---

### 🚦 GATE 2: Green Phase Verification

**Before completing build:**

```bash
# Run all tests - they MUST pass
npm test

# Expected output:
# Tests: 45 passed, 0 failed
# Status: GREEN ✓
```

**Gate Checklist:**
- [ ] All tests pass
- [ ] No skipped tests
- [ ] Test coverage meets minimum (if configured)
- [ ] Test manifest updated with PASS status

---

### Phase 4: Progress Tracking

Update `implementation/progress.md`:

```markdown
# Implementation Progress

## Status: ✅ Complete

## TDD Compliance
- Red Phase: ✓ All 45 tests failed initially
- Green Phase: ✓ All 45 tests pass now
- Refactor: ✓ Code cleaned up, tests still pass

## Completed Tasks
- [x] T-001: Subscription schema ✓ (3 tests)
- [x] T-002: Migration applied ✓ (2 tests)
- [x] T-003: Stripe service ✓ (8 tests)
- [x] T-004: API endpoints ✓ (12 tests)
- [x] T-005: Pricing page ✓ (10 tests)
- [x] T-006: Subscription UI ✓ (10 tests)

## Test Results
- Unit: 25/25 passing
- Integration: 8/8 passing
- Component: 12/12 passing
- Total: 45/45 passing

## TDD Log
| Time | Action | Tests |
|------|--------|-------|
| 10:00 | Enforcer wrote all tests | 0/45 |
| 10:30 | Gate 1 passed (all red) | 0/45 |
| 11:00 | Alchemist completed DB | 5/45 |
| 12:00 | Smith completed API | 25/45 |
| 13:00 | Shaper completed UI | 45/45 |
| 13:30 | Gate 2 passed (all green) | 45/45 |
```

---

## Output

```
✅ Build complete!

Spec: 2025-11-29-stripe-integration

TDD Compliance: ✅ VERIFIED
├── Red Phase: 45 tests written, all failed ✓
├── Green Phase: 45 tests passing ✓
└── No tests skipped ✓

Tasks: 7/7 completed
Tests: 45 passing, 0 failing

Files created/modified:
├── src/services/stripe.ts
├── src/api/subscriptions.ts
├── src/components/PricingPage.tsx
└── ... (15 more files)

Next: Run /validate-spec @2025-11-29-stripe-integration
```

---

## Failure Modes

### ❌ If Gate 1 Fails (tests pass before implementation)

```
PROBLEM: Some tests pass before code exists
ACTION:  Stop and fix tests - they're testing wrong things
```

### ❌ If Implementation Starts Without Tests

```
PROBLEM: Builder agent started without tests
ACTION:  STOP immediately
         Delete any code written
         Return to Phase 2
         Write tests first
```

### ❌ If Tests Are Skipped

```
PROBLEM: Task implemented without corresponding test
ACTION:  STOP implementation
         Write missing test (should fail against partial impl)
         Complete implementation
```
