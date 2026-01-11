# /build-task Workflow

> Execute focused tasks on existing codebases. Brownfield compatible.

---

## Quick Reference

```
Command:      /build-task "description"
              /build-task @optional-spec "description"
Orchestrator: Main Agent
Agents:       Enforcer (assessment) → Builder (implementation)
Output:       .catalyst/tasks/YYYY-MM-DD-{slug}.md
```

---

## When to Use

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMMAND SELECTION GUIDE                             │
└─────────────────────────────────────────────────────────────────────────────┘

  /catalyze-spec                    /build-task                    /patch
  ─────────────────                 ─────────────────              ─────────
  New features                      Modifications                  Quick fixes
  Major additions                   Stakeholder requests           Typos
  Architectural changes             Refactoring                    Config tweaks
  Needs research                    Post-completion changes

  Full lifecycle                    Test-first assessment          Minimal
  ~hours to days                    ~1-4 hours                     ~minutes

  Greenfield                        Brownfield compatible          Any project
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  /build-task "change session timeout to 30 days"                            │
│  /build-task @2026-01-11-supabase-auth "change session timeout"             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 0: CONTEXT GATHERING             │
              │  ──────────────────────────             │
              │                                         │
              │  1. Check for @spec reference           │
              │     • Yes → Read spec for context       │
              │     • No → Analyze codebase directly    │
              │                                         │
              │  2. Auto-detect related specs           │
              │     • Search .catalyst/specs/           │
              │     • Add reference if found            │
              │                                         │
              │  3. Create task file                    │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 1: TEST ASSESSMENT               │
              │  ────────────────────────               │
              │                                         │
              │  🛡️ ENFORCER analyzes:                  │
              │                                         │
              │  • Find related test files              │
              │  • Assess coverage of change area       │
              │  • Determine test strategy              │
              └─────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
           ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
           │   COVERED    │   │    MODIFY    │   │     NEW      │
           │              │   │              │   │              │
           │ Tests exist  │   │ Tests exist  │   │ No tests     │
           │ and cover    │   │ but need     │   │ cover this   │
           │ this change  │   │ updating     │   │ area         │
           │              │   │              │   │              │
           │ Skip to      │   │ Update tests │   │ Write tests  │
           │ Phase 3      │   │ first        │   │ first        │
           └──────────────┘   └──────────────┘   └──────────────┘
                    │                  │                  │
                    │         ┌───────┴───────┐          │
                    │         ▼               ▼          │
                    │  ┌─────────────────────────────┐   │
                    │  │  PHASE 2: TESTS (TDD)       │   │
                    │  │  ────────────────────       │   │
                    │  │                             │   │
                    │  │  Enforcer writes/updates    │   │
                    │  │  tests that must FAIL       │   │
                    │  │  before implementation      │   │
                    │  └─────────────────────────────┘   │
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 3: IMPLEMENTATION                │
              │  ───────────────────────                │
              │                                         │
              │  Appropriate builder implements:        │
              │                                         │
              │  • Smith → Backend changes              │
              │  • Shaper → Frontend changes            │
              │  • Alchemist → Database changes         │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 4: VERIFY & COMMIT               │
              │  ────────────────────────               │
              │                                         │
              │  • Run tests (must pass)                │
              │  • Run lint (no errors)                 │
              │  • Update task file → COMPLETE          │
              │  • Commit with task reference           │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │              OUTPUT                     │
              └─────────────────────────────────────────┘
```

---

## Phase Details

### Phase 0: Context Gathering

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 CONTEXT GATHERING                                           │
│  ────────────────────                                           │
│                                                                 │
│  Works with OR without existing specs (brownfield compatible)   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  WITH @spec reference:                                   │   │
│  │                                                          │   │
│  │  /build-task @2026-01-11-supabase-auth "change timeout"  │   │
│  │                                                          │   │
│  │  1. Read spec.md from referenced spec                    │   │
│  │  2. Understand original requirements                     │   │
│  │  3. Link task to parent spec                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  WITHOUT @spec reference:                                │   │
│  │                                                          │   │
│  │  /build-task "add loading spinner to dashboard"          │   │
│  │                                                          │   │
│  │  1. Analyze codebase directly                            │   │
│  │  2. Search .catalyst/specs/ for related specs            │   │
│  │  3. If found → add as "Related Spec" (optional)          │   │
│  │  4. If not found → continue without                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Output: .catalyst/tasks/YYYY-MM-DD-{slug}.md                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 1: Test Assessment

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 TEST ASSESSMENT                                             │
│  ──────────────────                                             │
│                                                                 │
│  ⚠️  CRITICAL: Assess BEFORE assuming TDD is needed             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🛡️ ENFORCER analyzes existing tests                     │   │
│  │                                                          │   │
│  │  1. Search for test files related to change area         │   │
│  │  2. Analyze test coverage                                │   │
│  │  3. Determine strategy:                                  │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ Strategy │ Condition              │ Next Step     │  │   │
│  │  ├──────────┼────────────────────────┼───────────────┤  │   │
│  │  │ COVERED  │ Tests fully cover this │ Skip to impl  │  │   │
│  │  │ MODIFY   │ Tests exist, need      │ Update tests  │  │   │
│  │  │          │ assertion updates      │ first         │  │   │
│  │  │ NEW      │ No tests cover this    │ Write tests   │  │   │
│  │  │          │ area                   │ first         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  4. Write assessment to task file                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Tests (if MODIFY or NEW)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 TESTS (Conditional)                                         │
│  ──────────────────────                                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IF COVERED:                                             │   │
│  │                                                          │   │
│  │  ✅ Skip this phase                                      │   │
│  │  Existing tests will validate the implementation         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IF MODIFY:                                              │   │
│  │                                                          │   │
│  │  🛡️ ENFORCER updates existing tests:                     │   │
│  │                                                          │   │
│  │  • Update assertions for new behavior                    │   │
│  │  • Tests must FAIL with current code                     │   │
│  │  • Tests must PASS after implementation                  │   │
│  │                                                          │   │
│  │  Example:                                                │   │
│  │  - expect(session.timeout).toBe(7) → toBe(30)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IF NEW:                                                 │   │
│  │                                                          │   │
│  │  🛡️ ENFORCER writes new tests:                           │   │
│  │                                                          │   │
│  │  • Create test file if needed                            │   │
│  │  • Write tests that FAIL                                 │   │
│  │  • Tests must PASS after implementation                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 IMPLEMENTATION                                              │
│  ─────────────────                                              │
│                                                                 │
│  Select builder based on change scope:                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Change Type        │ Builder     │ Example              │   │
│  ├─────────────────────┼─────────────┼──────────────────────┤   │
│  │  Backend/API        │ ⚔️ Smith     │ API endpoint change  │   │
│  │  Frontend/UI        │ 🎨 Shaper   │ Component update     │   │
│  │  Database           │ 🧪 Alchemist │ Schema migration     │   │
│  │  Multiple areas     │ Multiple    │ Full-stack change    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Builder responsibilities:                                      │
│                                                                 │
│  1. Implement the change                                        │
│  2. Stay within task scope                                      │
│  3. Run tests after each change                                 │
│  4. Report completion                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Verify & Commit

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 VERIFY & COMMIT                                             │
│  ──────────────────                                             │
│                                                                 │
│  1. Run all tests                                               │
│     $ npm test                                                  │
│     Expected: All passing                                       │
│                                                                 │
│  2. Run lint                                                    │
│     $ npm run lint                                              │
│     Expected: No errors                                         │
│                                                                 │
│  3. Update task file                                            │
│     Status: COMPLETE                                            │
│     Commit hash: abc1234                                        │
│                                                                 │
│  4. Commit with structured message:                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  task(auth): change session timeout to 30 days           │   │
│  │                                                          │   │
│  │  Task: 2026-01-25-session-timeout                        │   │
│  │  Related: @2026-01-11-supabase-auth                      │   │
│  │                                                          │   │
│  │  Changes:                                                │   │
│  │  - Updated session config                                │   │
│  │  - Modified timeout assertions                           │   │
│  │                                                          │   │
│  │  Tests: 12 passing                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Task File Structure

```
.catalyst/
├── tasks/                              ← Independent task folder
│   ├── 2026-01-25-session-timeout.md
│   ├── 2026-02-03-add-remember-me.md
│   └── 2026-02-10-fix-oauth-redirect.md
├── specs/                              ← May not exist (brownfield)
│   └── ...
└── main/
    └── ...
```

---

## Task File Format

```markdown
# Task: Change session timeout to 30 days

> Status: IN_PROGRESS | COMPLETE
> Created: 2026-01-25
> Requested by: Sales (John)
> Related Spec: @2026-01-11-supabase-auth (optional)

## Description
Users are being logged out too frequently.
Change session timeout from 7 to 30 days.

## Test Assessment
| Strategy | Reason |
|----------|--------|
| MODIFY | Existing tests check 7-day timeout, need to update assertions |

### Affected Tests
- tests/auth/session.test.ts → Update timeout assertions

## Changes Required
- [ ] Update session config in supabase.ts
- [ ] Update test assertions

## Files Modified
- src/lib/supabase.ts
- tests/auth/session.test.ts

## Commit
- Hash: abc1234
- Branch: task/session-timeout
```

---

## Output

### Success

```
✅ Task complete!

Task: 2026-01-25-session-timeout
Status: COMPLETE

Test Assessment: MODIFY
├── Updated 1 test file
└── tests/auth/session.test.ts

Changes:
├── src/lib/supabase.ts (session config)
└── tests/auth/session.test.ts (assertions)

Tests: 12 passing
Commit: abc1234

Related: @2026-01-11-supabase-auth

Created: .catalyst/tasks/2026-01-25-session-timeout.md

➡️  Next: git push origin task/session-timeout
```

### Assessment Only

```
📋 Task assessed!

Task: 2026-01-25-session-timeout
Test Strategy: COVERED

Existing tests fully cover this change:
└── tests/auth/session.test.ts (line 45-67)

No new tests needed. Ready to implement.
```

---

## Comparison with /build-spec

| Aspect | /build-spec | /build-task |
|--------|-------------|-------------|
| **Purpose** | Implement new spec | Modify existing code |
| **Requires spec** | Yes | No (optional reference) |
| **Test approach** | Always TDD | Assess first, then decide |
| **Documentation** | Full tasks.md | Lightweight task file |
| **Validation** | Full Guardians | Tests + Lint only |
| **Commit** | With spec reference | With task reference |
| **Brownfield** | Needs spec first | Works immediately |

---

## Execution Flow

```
Context ──▶ Assess ──▶ Tests? ──▶ Implement ──▶ Verify ──▶ Commit
   │           │          │           │           │          │
   │           │          │           │           │          │
 gather     determine   COVERED:    builder    run tests   structured
 context    strategy    skip        executes   + lint      commit msg
            │           │
            │           MODIFY/NEW:
            │           write/update
            │           tests first
            │
            └── ENFORCER
```
