# /build-spec Workflow

> Implement a specification using **strict TDD**.

---

## Quick Reference

```
Command:      /build-spec @2026-01-11-supabase-auth
Orchestrator: Forge-Master (Opus)
Agents:       Forger → Enforcer → Alchemist → Contracts → [Smith × N + Shaper × M] → Integration
Output:       tasks.md (with Build DAG and progress)
```

---

## TDD Is Mandatory

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ⚠️  IMPLEMENTATION WITHOUT TESTS IS FORBIDDEN                           ║
║                                                                           ║
║   The build MUST follow this exact sequence:                              ║
║                                                                           ║
║   1. Forger    → Create tasks.md                                          ║
║   2. Enforcer  → Write ALL tests (must FAIL)         ← GATE 1: RED        ║
║   3. Verify    → Run tests, confirm RED              ← BLOCKING           ║
║   4. Builders  → Implement until GREEN               ← Only after gate    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /build-spec @2026-01-11-supabase-auth                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔨 FORGE-MASTER (Build Orchestrator)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     │
           ┌───────────────┐                              │
           │   PHASE 1     │                              │
           │   Forger      │                              │
           │  (Build DAG)  │                              │
           └───────────────┘                              │
                    │                                     │
                    ▼                                     │
           ┌───────────────┐                              │
           │   PHASE 2     │                              │
           │   Enforcer    │                              │
           │   (Tests)     │                              │
           └───────────────┘                              │
                    │                                     │
                    ▼                                     │
     ┌──────────────────────────────┐                     │
     │  🚧 GATE 1: RED VERIFICATION │                     │
     │  All tests must FAIL         │                     │
     └──────────────────────────────┘                     │
                    │                                     │
                    ▼                                     │
           ┌───────────────┐                              │
           │   PHASE 3     │                              │
           │   Alchemist   │                              │
           │  (Foundation) │                              │
           └───────────────┘                              │
                    │                                     │
                    ▼                                     │
     ┌──────────────────────────────┐                     │
     │  🚧 GATE 2: FOUNDATION       │                     │
     │  DB tests must PASS          │                     │
     └──────────────────────────────┘                     │
                    │                                     │
                    ▼                                     │
           ┌───────────────┐                              │
           │   PHASE 4     │                              │
           │    Smith      │                              │
           │  (Contracts)  │                              │
           └───────────────┘                              │
                    │                                     │
                    ▼                                     │
     ┌──────────────────────────────┐                     │
     │  🚧 GATE 3: CONTRACTS        │                     │
     │  Type-check must PASS        │                     │
     └──────────────────────────────┘                     │
                    │                                     │
                    ▼                                     │
     ┌──────────────────────────────────────────────┐     │
     │     PHASE 5: PARALLEL (DAG-Driven)           │     │
     │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │     │
     │  │ SMITH-1  │  │ SMITH-2  │  │ SHAPER-1 │   │     │
     │  │ api/auth │  │ api/post │  │ pages/   │   │     │
     │  └──────────┘  └──────────┘  │ profile  │   │     │
     │  ┌──────────┐  ┌──────────┐  └──────────┘   │     │
     │  │ SHAPER-2 │  │ SHAPER-3 │                 │     │
     │  │ pages/   │  │ pages/   │  scope-isolated │     │
     │  │ feed     │  │ settings │  parallel exec  │     │
     │  └──────────┘  └──────────┘                 │     │
     └──────────────────────────────────────────────┘     │
                    │                                     │
                    ▼                                     │
     ┌──────────────────────────────┐                     │
     │  🚧 GATE 4: PARALLEL DONE    │                     │
     │  All parallel tests PASS     │                     │
     └──────────────────────────────┘                     │
                    │                                     │
                    ▼                                     │
           ┌───────────────┐                              │
           │   PHASE 6     │                              │
           │   Enforcer    │                              │
           │ (Integration) │                              │
           └───────────────┘                              │
                    │                                     │
                    ▼                                     │
     ┌──────────────────────────────┐                     │
     │  🚧 GATE 5: GREEN VERIFY     │                     │
     │  ALL tests must PASS         │                     │
     └──────────────────────────────┘                     │
                    │                                     │
                    ▼                                     │
           ┌───────────────┐                              │
           │    OUTPUT     │◀─────────────────────────────┘
           └───────────────┘
```

---

## Phase Details

### Phase 1: Task Breakdown (Forger) - Build DAG

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 TASK BREAKDOWN (Build DAG)                                  │
│  ─────────────────────────────                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ⚒️ FORGER                                                │   │
│  │                                                          │   │
│  │  1. Read spec.md requirements                            │   │
│  │  2. Break into atomic tasks                              │   │
│  │  3. Identify parallelizable work units                   │   │
│  │  4. Define scope boundaries per task                     │   │
│  │  5. Extract shared contracts                             │   │
│  │  6. Create tasks.md with Build DAG                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Output: tasks.md with Build DAG                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ # Tasks: Supabase Authentication                         │   │
│  │                                                          │   │
│  │ ## Build DAG                                             │   │
│  │                                                          │   │
│  │ ### Phase 1: Foundation (Sequential)                     │   │
│  │ | ID | Agent | Scope | Blocks |                          │   │
│  │ | db-schema | alchemist | prisma/* | api-*, ui-* |       │   │
│  │                                                          │   │
│  │ ### Phase 2: Contracts (Sequential)                      │   │
│  │ | ID | Agent | Scope | Depends On | Blocks |             │   │
│  │ | api-types | smith | src/types/* | db-schema | api-* |  │   │
│  │                                                          │   │
│  │ ### Phase 3: Parallel Backend (smith × 2)                │   │
│  │ | ID | Agent | Scope | Reads | Depends On |              │   │
│  │ | api-auth | smith-1 | src/api/auth/** | types | ... |   │   │
│  │ | api-session | smith-2 | src/api/session/** | ... |     │   │
│  │                                                          │   │
│  │ ### Phase 4: Parallel Frontend (shaper × 2)              │   │
│  │ | ID | Agent | Scope | Reads | Depends On |              │   │
│  │ | ui-login | shaper-1 | src/pages/login/** | ... |       │   │
│  │ | ui-signup | shaper-2 | src/pages/signup/** | ... |     │   │
│  │                                                          │   │
│  │ ### Phase 5: Integration                                 │   │
│  │ | ID | Agent | Scope | Depends On |                      │   │
│  │ | integration | enforcer | tests/integration/** | all |  │   │
│  │                                                          │   │
│  │ ## Progress                                              │   │
│  │ | ID | Status | Agent | Tests | Notes |                  │   │
│  │ |------|--------|-------|-------|                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Write Tests First (Enforcer) - RED PHASE

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 RED PHASE - WRITE FAILING TESTS                             │
│  ──────────────────────────────────                             │
│                                                                 │
│  ⚠️  CRITICAL: This phase MUST complete before ANY              │
│                implementation starts                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🛡️ ENFORCER                                              │   │
│  │                                                          │   │
│  │  For EVERY task, write failing tests:                    │   │
│  │                                                          │   │
│  │  T-001: User profiles schema                             │   │
│  │    └── tests/db/user-profiles.test.ts                    │   │
│  │                                                          │   │
│  │  T-002: Sessions table                                   │   │
│  │    └── tests/db/sessions.test.ts                         │   │
│  │                                                          │   │
│  │  T-003: Auth service                                     │   │
│  │    └── tests/services/auth.test.ts                       │   │
│  │                                                          │   │
│  │  T-004: API endpoints                                    │   │
│  │    └── tests/api/auth.test.ts                            │   │
│  │                                                          │   │
│  │  T-005: Middleware                                       │   │
│  │    └── tests/middleware/auth.test.ts                     │   │
│  │                                                          │   │
│  │  T-006-008: UI components                                │   │
│  │    └── tests/components/auth/*.test.tsx                  │   │
│  │                                                          │   │
│  │  Update tasks.md Progress section with test locations    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Gate 1: Red Phase Verification

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  🚧 GATE 1: RED PHASE VERIFICATION                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  STOP! Before proceeding to implementation:                               ║
║                                                                           ║
║  $ npm test                                                               ║
║                                                                           ║
║  Expected output:                                                         ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │  Tests: 0 passed, 45 failed                                         │  ║
║  │  Status: RED ❌                                                      │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  Gate Checklist:                                                          ║
║  [ ] Every task has at least one test                                     ║
║  [ ] All tests have been executed                                         ║
║  [ ] All tests FAIL (none pass)                                           ║
║                                                                           ║
║  ⚠️  If ANY test passes → STOP and investigate                            ║
║     Tests passing before code = wrong tests                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Phase 3-4: Foundation & Contracts (Sequential)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 FOUNDATION & CONTRACTS                                      │
│  ─────────────────────────                                      │
│                                                                 │
│  ⚠️  Only start AFTER Gate 1 (Red Phase) passes!                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  🧪 ALCHEMIST (Foundation)                              │    │
│  │     │                                                   │    │
│  │     └── db-schema: Database schema & migrations         │    │
│  │         SCOPE: prisma/*, src/db/*                       │    │
│  │              │                                          │    │
│  │              ▼ GATE 2: Foundation tests pass            │    │
│  │                                                         │    │
│  │  ⚔️ SMITH (Contracts)                                   │    │
│  │     │                                                   │    │
│  │     └── api-types: Shared types & interfaces            │    │
│  │         SCOPE: src/types/api.ts                         │    │
│  │         Defines contracts for parallel agents           │    │
│  │              │                                          │    │
│  │              ▼ GATE 3: Type-check passes                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 5: Parallel Implementation (DAG-Driven)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 PARALLEL IMPLEMENTATION (DAG-Driven)                        │
│  ───────────────────────────────────────                        │
│                                                                 │
│  ⚠️  Only start AFTER contracts phase completes!                │
│                                                                 │
│  Spawn ALL ready agents in ONE message with scope boundaries:   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PARALLEL BLOCK (Scope-Isolated)            │    │
│  │                                                         │    │
│  │  ⚔️ SMITH-1              ⚔️ SMITH-2                     │    │
│  │  └── api-auth            └── api-session                │    │
│  │      SCOPE: src/api/         SCOPE: src/api/            │    │
│  │             auth/**                 session/**          │    │
│  │      READS: src/types/**     READS: src/types/**        │    │
│  │                                                         │    │
│  │  🎨 SHAPER-1             🎨 SHAPER-2                    │    │
│  │  └── ui-login            └── ui-signup                  │    │
│  │      SCOPE: src/pages/       SCOPE: src/pages/          │    │
│  │             login/**                signup/**           │    │
│  │      READS: src/types/**     READS: src/types/**        │    │
│  │             src/components/         src/components/     │    │
│  │             shared/**               shared/**           │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ⚠️  CRITICAL: Each agent has EXCLUSIVE scope                   │
│     Agents must NOT modify files outside their scope            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 6: Integration (Sequential)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 INTEGRATION                                                 │
│  ─────────────                                                  │
│                                                                 │
│  ⚠️  Only start AFTER all parallel tasks complete!              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  🛡️ ENFORCER (Integration)                              │    │
│  │                                                         │    │
│  │  Run cross-boundary tests:                              │    │
│  │  └── tests/integration/**                               │    │
│  │                                                         │    │
│  │  Verify all components work together                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### TDD Loop (For Each Task)

```
┌─────────────────────────────────────────────────────────────────┐
│  🔄 TDD LOOP                                                    │
│  ───────────                                                    │
│                                                                 │
│  For EACH task, builders follow this cycle:                     │
│                                                                 │
│       ┌──────────────────────────────────────────────┐          │
│       │                                              │          │
│       │   1. Verify test exists and FAILS            │          │
│       │              │                               │          │
│       │              ▼                               │          │
│       │   2. Write MINIMAL code to make test pass    │          │
│       │              │                               │          │
│       │              ▼                               │          │
│       │   3. Run test → must PASS                    │          │
│       │              │                               │          │
│       │              ▼                               │          │
│       │   4. Refactor if needed                      │          │
│       │              │                               │          │
│       │              ▼                               │          │
│       │   5. Run test → must still PASS              │          │
│       │              │                               │          │
│       │              ▼                               │          │
│       │   6. Update tasks.md Progress                │          │
│       │                                              │          │
│       └──────────────────────────────────────────────┘          │
│                                                                 │
│  ❌ NEVER write code without a failing test first               │
│  ❌ NEVER write more code than needed to pass the test          │
│  ❌ NEVER modify files outside your SCOPE                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Gate 2: Green Phase Verification

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  🚧 GATE 2: GREEN PHASE VERIFICATION                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Before completing build:                                                 ║
║                                                                           ║
║  $ npm test                                                               ║
║                                                                           ║
║  Expected output:                                                         ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │  Tests: 45 passed, 0 failed                                         │  ║
║  │  Status: GREEN ✅                                                    │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Output

```
✅ Build complete!

Spec: 2026-01-11-supabase-auth

TDD Compliance: VERIFIED
├── Red Phase:   45 tests written, all failed
└── Green Phase: 45 tests passing

DAG Execution:
├── Foundation:  1 task (alchemist)
├── Contracts:   1 task (smith)
├── Parallel:    4 tasks (smith-1, smith-2, shaper-1, shaper-2)
└── Integration: 1 task (enforcer)

Tasks: 7/7 completed
Tests: 45 passing, 0 failing
Scope Violations: 0

Updated: .catalyst/specs/2026-01-11-supabase-auth/tasks.md

➡️  Next: Run /validate-spec @2026-01-11-supabase-auth
```

---

## Agents Involved

| Agent | Role | Model | Phase | Execution |
|-------|------|-------|-------|-----------|
| **Forge-Master** | Orchestrator | Opus | All | Coordinates |
| **Forger** | Task Breakdown (DAG) | Sonnet | 1 | Sequential |
| **Enforcer** | Test Writer | Sonnet | 2, 6 | Sequential (blocking) |
| **Alchemist** | Database | Sonnet | 3 | Sequential (foundation) |
| **Smith** | Backend/Contracts | Sonnet | 4, 5 | Sequential then Parallel × N |
| **Shaper** | Frontend | Sonnet | 5 | Parallel × M |

---

## Execution Rules

```
DAG-BASED PARALLEL EXECUTION

Forger ──▶ Enforcer ──▶ GATE 1 ──▶ Alchemist ──▶ GATE 2 ──▶ Contracts ──▶ GATE 3
  │           │           │            │           │            │           │
Build DAG   tests      verify      foundation   verify      shared       verify
            written    all FAIL    DB schema    DB pass     types       types OK
                                                              │
                                                              ▼
                              ┌─────────────────────────────────────────────────┐
                              │  PARALLEL (scope-isolated)                      │
                              │  [smith-1 + smith-2 + shaper-1 + shaper-2 + ...]│
                              └─────────────────────────────────────────────────┘
                                                              │
                                                              ▼
                                          GATE 4 ──▶ Enforcer ──▶ GATE 5
                                            │      integration      │
                                         parallel                all tests
                                         tests OK                  PASS


❌ WRONG: forger → [enforcer + smith + shaper]
   (Tests parallel with code = NO TDD!)

❌ WRONG: forger → enforcer → [alchemist + smith + shaper]
   (No contracts = type drift in parallel!)

✅ CORRECT: forger → enforcer → GATE → alchemist → contracts → [smith × N + shaper × M]
   (Tests first, contracts before parallel, scope-isolated execution)
```

---

## Failure Modes

### Gate 1 Fails (tests pass before implementation)

```
⚠️  PROBLEM: Some tests pass before code exists
    ACTION:  Stop and fix tests - they're testing wrong things
```

### Implementation Starts Without Tests

```
⚠️  PROBLEM: Builder agent started without tests
    ACTION:  STOP immediately
             Delete any code written
             Return to Phase 2
             Write tests first
```

### Scope Violation Detected

```
⚠️  PROBLEM: Agent modified files outside its scope
    ACTION:  STOP that agent
             Revert out-of-scope changes (git checkout)
             Re-run task with stricter prompt
             Report violation to user
```

### Parallel Agents Conflict

```
⚠️  PROBLEM: Two agents wrote to same file
    ACTION:  STOP build immediately
             Revert conflicting changes
             Return to Forger
             Re-structure DAG with non-overlapping scopes
```

### Dependency Deadlock

```
⚠️  PROBLEM: Circular dependency detected in DAG
    ACTION:  STOP all execution
             Report to user
             Request Forger to restructure DAG
```
