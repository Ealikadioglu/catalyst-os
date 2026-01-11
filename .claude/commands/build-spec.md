# /build-spec

Implement a specification using **strict TDD**.

## Usage

```
/build-spec @2025-11-29-stripe-integration
```

## Prerequisites

- Spec must exist in `.catalyst/specs/`
- `spec.md` must be complete
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
├── spec.md           # Already exists from /catalyze-spec
├── research.md       # Already exists from /catalyze-spec
├── tasks.md          # Forger creates (this phase)
├── validation.md     # Arbiter creates (in /validate-spec)
├── handoff.md        # Arbiter creates (on completion)
└── assets/
```

### Execution Order (DAG-Based Parallel Execution)

```
Phase 1: Forger (task breakdown -> tasks.md with Build DAG)
              |
Phase 2: Enforcer (write ALL failing tests)
              |
         GATE 1: RED PHASE - All tests must FAIL
              |
Phase 3: Foundation (Alchemist - sequential)
              |
         GATE 2: Foundation tests pass
              |
Phase 4: Contracts (Smith - shared types, sequential)
              |
         GATE 3: Type-check passes
              |
Phase 5: Parallel Implementation (Smith × N + Shaper × M)
         [smith-1, smith-2, shaper-1, shaper-2, ...] <- scope-isolated
              |
         GATE 4: GREEN PHASE - All tests must PASS
              |
Phase 6: Integration (Enforcer - cross-boundary tests)
```

### PARALLEL EXECUTION RULES

| Phase | Agents | Parallel? |
|-------|--------|-----------|
| Task Breakdown | Forger | No (creates DAG first) |
| Test Writing | Enforcer | No (must complete before impl) |
| Foundation | Alchemist | No (DB schema first) |
| Contracts | Smith (single) | No (shared types before parallel) |
| Implementation | Smith × N + Shaper × M | **Yes - multiple instances** |
| Integration | Enforcer | No (after all parallel complete) |

**Multi-Instance Rules:**
- Each parallel agent has **exclusive scope** (files it can write)
- Each parallel agent has **read-only access** to shared types
- Scopes MUST NOT overlap between parallel agents
- Forge-Master spawns all ready agents in ONE message

**WRONG:**
```
forger -> [enforcer + smith + shaper]  <- Tests parallel with code = NO TDD!
```

**CORRECT:**
```
forger -> enforcer -> GATE -> alchemist -> contracts -> [smith-1 + smith-2 + shaper-1 + shaper-2]
```

---

## Workflow

The **Forge-Master** agent orchestrates the Technologists.

### Phase 1: Task Breakdown (Forger)

**Spawn Forger agent**:

```
"Break down spec.md into implementable tasks with Build DAG. Write to:
.catalyst/specs/{slug}/tasks.md

Include: phases, scope boundaries, dependencies, parallel opportunities."
```

Forger creates `tasks.md` with **Build DAG**:

```markdown
# Tasks: {Feature Name}

## Build DAG

### Phase 1: Foundation (Sequential)
| ID | Agent | Scope | Blocks | Est |
|----|-------|-------|--------|-----|
| db-schema | alchemist | prisma/*, src/db/* | api-*, ui-* | 1h |

### Phase 2: Contracts (Sequential)
| ID | Agent | Scope | Depends On | Blocks | Est |
|----|-------|-------|------------|--------|-----|
| api-types | smith | src/types/api.ts | db-schema | api-*, ui-* | 30m |

### Phase 3: Parallel Backend (smith × 2)
| ID | Agent | Scope | Reads | Depends On | Est |
|----|-------|-------|-------|------------|-----|
| api-auth | smith-1 | src/api/auth/** | src/types/** | api-types | 1.5h |
| api-billing | smith-2 | src/api/billing/** | src/types/** | api-types | 1.5h |

### Phase 4: Parallel Frontend (shaper × 2)
| ID | Agent | Scope | Reads | Depends On | Est |
|----|-------|-------|-------|------------|-----|
| ui-pricing | shaper-1 | src/pages/pricing/** | src/types/** | api-billing | 1h |
| ui-dashboard | shaper-2 | src/pages/dashboard/** | src/types/** | api-types | 1.5h |

### Phase 5: Integration (Sequential)
| ID | Agent | Scope | Depends On | Est |
|----|-------|-------|------------|-----|
| integration | enforcer | tests/integration/** | api-*, ui-* | 1h |

## Progress
| ID | Status | Agent | Tests | Notes |
|----|--------|-------|-------|-------|
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

### Phase 3-4: Foundation & Contracts (Sequential)

**Only start this phase AFTER Gate 1 (Red Phase) passes!**

**Spawn Alchemist** (foundation):

```
"Implement db-schema task.
SCOPE (write): prisma/*, src/db/*
Run tests after to verify progress."
```

**Spawn Smith** (contracts - after foundation completes):

```
"Implement api-types task.
SCOPE (write): src/types/api.ts
Defines shared types for all parallel agents."
```

---

### Phase 5: Parallel Implementation (DAG-Driven)

**Only start AFTER contracts phase completes!**

**Spawn ALL ready agents in ONE message with scope boundaries:**

```
Smith-1: "Implement api-auth task.
         SCOPE (write): src/api/auth/**, tests/api/auth/**
         READS (no modify): src/types/**
         Run tests after each change."

Smith-2: "Implement api-billing task.
         SCOPE (write): src/api/billing/**, tests/api/billing/**
         READS (no modify): src/types/**
         Run tests after each change."

Shaper-1: "Implement ui-pricing task.
          SCOPE (write): src/pages/pricing/**, src/components/pricing/**
          READS (no modify): src/types/**, src/components/shared/**
          Run tests after each change."

Shaper-2: "Implement ui-dashboard task.
          SCOPE (write): src/pages/dashboard/**, src/components/dashboard/**
          READS (no modify): src/types/**, src/components/shared/**
          Run tests after each change."
```

**CRITICAL**: Include scope in every agent prompt. Agents must NOT modify files outside their scope.

Each builder updates `tasks.md` Progress section as they complete tasks.

---

### Phase 6: Integration (Sequential)

**Only start AFTER all parallel tasks complete!**

**Spawn Enforcer**:

```
"Run integration tests for cross-boundary functionality.
SCOPE: tests/integration/**
Verify all components work together."
```

---

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
NEVER modify files outside your SCOPE
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

DAG Execution:
- Foundation: 1 task (alchemist)
- Contracts: 1 task (smith)
- Parallel: 4 tasks (smith-1, smith-2, shaper-1, shaper-2)
- Integration: 1 task (enforcer)

Tasks: 7/7 completed
Tests: 45 passing, 0 failing
Scope Violations: 0

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

### If Scope Violation Detected

```
PROBLEM: Agent modified files outside its scope
ACTION:  STOP that agent
         Revert out-of-scope changes (git checkout)
         Re-run task with stricter prompt
         Report violation to user
```

### If Parallel Agents Conflict

```
PROBLEM: Two agents wrote to same file
ACTION:  STOP build immediately
         Revert conflicting changes
         Return to Forger
         Re-structure DAG with non-overlapping scopes
```

### If Dependency Deadlock

```
PROBLEM: Circular dependency detected in DAG
ACTION:  STOP all execution
         Report to user
         Request Forger to restructure DAG
```
