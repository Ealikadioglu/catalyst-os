# /build-spec

Implement a specification using **strict TDD**.

## Usage

```
/build-spec @2025-11-29-stripe-integration
```

## Prerequisites

- Spec must exist in `.catalyst/specs/`
- `SPEC.md` must be complete
- No unresolved "Open Questions"

---

## TDD IS MANDATORY - NO EXCEPTIONS

```
  IMPLEMENTATION WITHOUT TESTS IS FORBIDDEN

  The build MUST follow this exact sequence:

  1. Forger    -> Create tasks.md
  2. Enforcer  -> Write ALL tests (must FAIL)         <- GATE 1
  3. Verify    -> Run tests, confirm RED              <- GATE 2
  4. Builders  -> Implement until GREEN               <- Only after
```

---

## ORCHESTRATION MODE

**IMPORTANT**: This command operates in orchestration mode. The main agent DELEGATES work to specialized sub-agents.

### Output Location

All outputs go to the spec folder. See AGENTS.md "Documentation Output Policy".

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── SPEC.md           # Already exists from /catalyze-spec
├── research.md       # Already exists from /catalyze-spec
├── tasks.md          # Forger creates (this phase)
├── validation.md     # Arbiter creates (in /validate-spec)
├── HANDOFF.md        # Arbiter creates (on completion)
└── assets/
```

### Execution Order (STRICT - NO PARALLEL UNTIL GATE 2)

```
Phase 1: Forger (task breakdown -> tasks.md)
              |
Phase 2: Enforcer (write ALL failing tests)
              |
         GATE: RED PHASE CHECK
         All tests must FAIL
         If any pass -> STOP
              |
              v (only after gate passes)
Phase 3: [Alchemist + Smith + Shaper] (parallel implementation)
              |
         GATE: GREEN PHASE
         All tests must PASS
```

### PARALLEL EXECUTION RULES

| Phase | Agents | Parallel? |
|-------|--------|-----------|
| Task Breakdown | Forger | No (must complete first) |
| Test Writing | Enforcer | No (must complete before impl) |
| Implementation | Smith + Shaper | Yes (after tests exist) |
| Implementation | Alchemist -> Smith | Sequential if API needs DB |

**WRONG:**
```
forger -> [enforcer + smith + shaper]  <- Tests parallel with code = NO TDD!
```

**CORRECT:**
```
forger -> enforcer -> GATE -> [smith + shaper]  <- Tests BEFORE code
```

---

## Workflow

The **Forge-Master** agent orchestrates the Technologists.

### Phase 1: Task Breakdown (Forger)

**Spawn Forger agent**:

```
"Break down SPEC.md into implementable tasks. Write to:
.catalyst/specs/{slug}/tasks.md"
```

Forger creates `tasks.md`:

```markdown
# Tasks: {Feature Name}

## Task Breakdown

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

## Progress
| Task | Status | Tests | Notes |
|------|--------|-------|-------|
```

---

### Phase 2: Write Tests First (Enforcer) - RED PHASE

**CRITICAL: This phase MUST complete before ANY implementation starts.**

**Spawn Enforcer agent**:

```
"Write failing tests for ALL tasks in tasks.md.
Tests go in project test folders (src/__tests__/, tests/, etc.).
Update tasks.md Progress section with test file locations."
```

Enforcer will:
1. For EVERY task, write failing tests in project test folders
2. Update `tasks.md` Progress section with test locations
3. Run tests to confirm all FAIL

---

### GATE 1: Red Phase Verification

**STOP! Before proceeding to implementation:**

```bash
# Run all tests - they MUST fail
npm test  # or appropriate test command

# Expected output:
# Tests: 0 passed, 45 failed
# Status: RED
```

**Gate Checklist:**
- [ ] Every task has at least one test
- [ ] All tests have been executed
- [ ] All tests FAIL (none pass)

**If ANY test passes -> STOP and investigate**

---

### Phase 3: Implementation - GREEN PHASE

**Only start this phase AFTER Gate 1 passes!**

**Spawn builders in parallel** (where dependencies allow):

```
Alchemist: "Implement T-001, T-002. Run tests after each to verify progress."
Smith: "Implement T-003, T-004 (after DB tasks complete)."
Shaper: "Implement T-005, T-006 (after API tasks complete)."
```

Each builder updates `tasks.md` Progress section as they complete tasks.

### Implementation Rules

```
FOR EACH TASK:

1. Verify test exists and FAILS
2. Write MINIMAL code to make test pass
3. Run test -> must PASS
4. Refactor if needed
5. Run test -> must still PASS
6. Update tasks.md Progress

NEVER write code without a failing test first
NEVER write more code than needed to pass the test
```

---

### GATE 2: Green Phase Verification

**Before completing build:**

```bash
# Run all tests - they MUST pass
npm test

# Expected output:
# Tests: 45 passed, 0 failed
# Status: GREEN
```

---

## Output

```
Build complete!

Spec: 2025-11-29-stripe-integration

TDD Compliance: VERIFIED
- Red Phase: 45 tests written, all failed
- Green Phase: 45 tests passing

Tasks: 7/7 completed
Tests: 45 passing, 0 failing

Updated: .catalyst/specs/2025-11-29-stripe-integration/tasks.md

Next: Run /validate-spec @2025-11-29-stripe-integration
```

---

## Failure Modes

### If Gate 1 Fails (tests pass before implementation)

```
PROBLEM: Some tests pass before code exists
ACTION:  Stop and fix tests - they're testing wrong things
```

### If Implementation Starts Without Tests

```
PROBLEM: Builder agent started without tests
ACTION:  STOP immediately
         Delete any code written
         Return to Phase 2
         Write tests first
```
