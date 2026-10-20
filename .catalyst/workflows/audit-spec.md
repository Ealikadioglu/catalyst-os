# /audit-spec Workflow

> Run validation checks on a completed implementation.

---

## Quick Reference

```
Command:      /audit-spec @2026-01-11-supabase-auth
Orchestrator: Arbiter
Agents:       [Enforcer + Sentinel + Inquisitor + Watcher (+ Curator for DB specs)] (parallel)
Output:       validation.md, handoff.md
```

---

## TDD Compliance Check

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  ⚠️  BEFORE VALIDATION BEGINS, VERIFY TDD WAS FOLLOWED                    ║
║                                                                           ║
║  1. Check tasks.md has test locations for each task                       ║
║  2. Verify all tests pass                                                 ║
║  3. Verify tests were written before implementation                       ║
║                                                                           ║
║  If TDD was skipped → REJECT and return to /forge-spec                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /audit-spec @2026-01-11-supabase-auth                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚖️ ARBITER (Validation Orchestrator)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────┐
                    │  PHASE 0: TDD COMPLIANCE CHECK   │
                    │  (Sequential - MUST pass first)  │
                    └──────────────────────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                    PASS ▼                      FAIL ▼
                         │                           │
              ┌──────────────────┐        ┌──────────────────┐
              │ Continue to      │        │ ❌ BLOCKED       │
              │ validation       │        │ Return to        │
              │                  │        │ /forge-spec      │
              └──────────────────┘        └──────────────────┘
                         │
                         ▼
     ┌─────────────────────────────────────────────────────────────┐
     │              PHASES 1-5: PARALLEL VALIDATION                │
     │                                                             │
     │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
     │  │ ENFORCER  │ │ SENTINEL  │ │ INQUISITOR│ │  WATCHER  │   │
     │  │  (Unit)   │ │   (E2E)   │ │  (Lint)   │ │ (Security)│   │
     │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
     │  ┌──────────────────────────┐                               │
     │  │ CURATOR (Schema Integrity)│  ← DB specs only, read-only   │
     │  └──────────────────────────┘                               │
     │                                                             │
     └─────────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  PHASE 5:        │
              │  Compile Results │
              │  (Arbiter)       │
              └──────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  PHASE 6:        │
              │  Generate        │
              │  handoff.md      │
              └──────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │     OUTPUT       │
              └──────────────────┘
```

---

## Phase Details

### Phase 0: TDD Compliance Verification (BLOCKING)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 TDD COMPLIANCE CHECK                                        │
│  ───────────────────────                                        │
│                                                                 │
│  ⚠️  THIS PHASE MUST PASS BEFORE ANY VALIDATION BEGINS          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Verification Steps:                                     │   │
│  │                                                          │   │
│  │  1. Read tasks.md                                        │   │
│  │     └── Check Progress section                           │   │
│  │                                                          │   │
│  │  2. Verify each task has associated tests                │   │
│  │     ┌──────────────────────────────────────────────┐     │   │
│  │     │ Task    │ Test Location                      │     │   │
│  │     ├─────────┼────────────────────────────────────┤     │   │
│  │     │ T-001   │ tests/db/user-profiles.test.ts     │     │   │
│  │     │ T-002   │ tests/db/sessions.test.ts          │     │   │
│  │     │ T-003   │ tests/services/auth.test.ts        │     │   │
│  │     │ ...     │ ...                                │     │   │
│  │     └──────────────────────────────────────────────┘     │   │
│  │                                                          │   │
│  │  3. Run all tests to confirm they pass                   │   │
│  │     $ npm test                                           │   │
│  │     Expected: 45 passed, 0 failed                        │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IF NOT COMPLIANT:                                       │   │
│  │                                                          │   │
│  │  ❌ VALIDATION BLOCKED                                   │   │
│  │                                                          │   │
│  │  TDD compliance not verified.                            │   │
│  │  - Tests missing for tasks: T-003, T-005                 │   │
│  │  - OR tests written after implementation                 │   │
│  │                                                          │   │
│  │  Action: Return to /forge-spec and follow TDD process    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phases 1-4: Parallel Validation

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 PARALLEL VALIDATION                                         │
│  ──────────────────────                                         │
│                                                                 │
│  ⚡ ALL FOUR GUARDIANS RUN SIMULTANEOUSLY                       │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │ 🛡️ ENFORCER     │  │ 🏰 SENTINEL    │                         │
│  │ Unit Tests     │  │ E2E Tests      │                         │
│  ├────────────────┤  ├────────────────┤                         │
│  │                │  │                │                         │
│  │ • Run all unit │  │ • Run full E2E │                         │
│  │   tests        │  │   test suite   │                         │
│  │                │  │                │                         │
│  │ • Check        │  │ • Test user    │                         │
│  │   coverage     │  │   flows        │                         │
│  │   thresholds   │  │                │                         │
│  │                │  │ • Capture      │                         │
│  │ • Verify test  │  │   screenshots  │                         │
│  │   quality      │  │   on failure   │                         │
│  │                │  │                │                         │
│  │ Result:        │  │ Result:        │                         │
│  │ 45/45 (87%)    │  │ 12/12 passing  │                         │
│  └────────────────┘  └────────────────┘                         │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │ 🔍 INQUISITOR  │  │ 👁️ WATCHER     │                         │
│  │ Code Quality   │  │ Security       │                         │
│  ├────────────────┤  ├────────────────┤                         │
│  │                │  │                │                         │
│  │ • Run linters  │  │ • Dependency   │                         │
│  │                │  │   audit        │                         │
│  │ • Code review  │  │                │                         │
│  │   checks       │  │ • Secret       │                         │
│  │                │  │   scanning     │                         │
│  │ • Check        │  │                │                         │
│  │   documentation│  │ • Input        │                         │
│  │   gaps         │  │   validation   │                         │
│  │                │  │   checks       │                         │
│  │ Result:        │  │                │                         │
│  │ 0 errors       │  │ Result:        │                         │
│  │ 2 warnings     │  │ No vulns       │                         │
│  └────────────────┘  └────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 5: Compile Results (Arbiter)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 COMPILE RESULTS                                             │
│  ──────────────────                                             │
│                                                                 │
│  Arbiter creates validation.md:                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ # Validation: Supabase Authentication                    │   │
│  │                                                          │   │
│  │ ## Date: 2026-01-11                                      │   │
│  │                                                          │   │
│  │ ## TDD Compliance                                        │   │
│  │ - [x] Tests written before implementation                │   │
│  │ - [x] All tasks have tests                               │   │
│  │ - [x] All tests pass                                     │   │
│  │                                                          │   │
│  │ ## Test Results                                          │   │
│  │                                                          │   │
│  │ ### Unit Tests (Enforcer)                                │   │
│  │ - Total: 45                                              │   │
│  │ - Passing: 45                                            │   │
│  │ - Coverage: 87%                                          │   │
│  │                                                          │   │
│  │ ### E2E Tests (Sentinel)                                 │   │
│  │ - Total: 12                                              │   │
│  │ - Passing: 12                                            │   │
│  │                                                          │   │
│  │ ## Quality Checks                                        │   │
│  │                                                          │   │
│  │ ### Lint (Inquisitor)                                    │   │
│  │ - Status: PASS                                           │   │
│  │ - Errors: 0                                              │   │
│  │ - Warnings: 2                                            │   │
│  │                                                          │   │
│  │ ### Security (Watcher)                                   │   │
│  │ - Dependencies: No vulnerabilities                       │   │
│  │ - Secrets: None exposed                                  │   │
│  │ - Inputs: Sanitized                                      │   │
│  │                                                          │   │
│  │ ## Overall Status: PASS ✅                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 6: Generate handoff.md (On Success)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 GENERATE HANDOFF                                            │
│  ───────────────────                                            │
│                                                                 │
│  If all validation passes, Arbiter generates handoff.md:        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ # Supabase Authentication - Handoff                      │   │
│  │                                                          │   │
│  │ > Generated: 2026-01-11                                  │   │
│  │                                                          │   │
│  │ ## Summary                                               │   │
│  │ Complete authentication system using Supabase Auth       │   │
│  │ with email/password and Google OAuth support.            │   │
│  │                                                          │   │
│  │ ## What Changed                                          │   │
│  │ - Added user profiles and sessions tables                │   │
│  │ - Created auth service with Supabase integration         │   │
│  │ - Built login and signup pages with forms                │   │
│  │ - Implemented protected route middleware                 │   │
│  │                                                          │   │
│  │ ## Key Decisions                                         │   │
│  │ | Decision              | Why                          | │   │
│  │ |-----------------------|------------------------------|│   │
│  │ | JWT in httpOnly       | Security best practice       | │   │
│  │ | Server-side sessions  | SSR compatibility            | │   │
│  │                                                          │   │
│  │ ## Files Modified                                        │   │
│  │ - src/lib/supabase.ts - Supabase client setup           │   │
│  │ - src/services/auth.ts - Auth service wrapper           │   │
│  │ - src/pages/login.tsx - Login page                      │   │
│  │ - src/pages/signup.tsx - Signup page                    │   │
│  │ - src/middleware.ts - Auth middleware                   │   │
│  │                                                          │   │
│  │ ## How to Test                                           │   │
│  │ 1. Visit /login and enter credentials                   │   │
│  │ 2. Try accessing protected route without auth           │   │
│  │ 3. Sign up with new email                               │   │
│  │ 4. Test Google OAuth flow                               │   │
│  │                                                          │   │
│  │ ## Edge Cases & Gotchas                                  │   │
│  │ - Session expires after 7 days                          │   │
│  │ - OAuth requires callback URL in Supabase dashboard     │   │
│  │                                                          │   │
│  │ ## Follow-up Items                                       │   │
│  │ - [ ] Add password reset flow                           │   │
│  │ - [ ] Implement MFA                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output

### Success

```
✅ Validation complete!

Spec: 2026-01-11-supabase-auth

TDD Compliance: VERIFIED

Results:
├── Unit Tests:    45/45 passing (87% coverage)
├── E2E Tests:     12/12 passing
├── Lint:          No errors
├── Code Quality:  2 suggestions
└── Security:      No vulnerabilities

Status: READY FOR APPROVAL

Created:
├── .catalyst/specs/2026-01-11-supabase-auth/validation.md
└── .catalyst/specs/2026-01-11-supabase-auth/handoff.md

➡️  Next: Review handoff.md and run:
         /seal-spec @2026-01-11-supabase-auth
    Or:  /discard-spec @2026-01-11-supabase-auth "reason"
```

### TDD Failure

```
❌ Validation blocked!

Spec: 2026-01-11-supabase-auth

TDD Compliance: FAILED
├── Tests missing for tasks: T-003, T-005
└── OR tests written after implementation

Status: BLOCKED - RETURN TO BUILD

Action: Run /forge-spec @2026-01-11-supabase-auth
        Follow TDD process (tests BEFORE code)
        Then re-run /audit-spec
```

### Validation Failure

```
❌ Validation failed!

Spec: 2026-01-11-supabase-auth

Failed Checks:
├── E2E Tests: 2 failures
└── Security: 1 vulnerability found

Created: .catalyst/specs/2026-01-11-supabase-auth/validation.md

Action: Fix issues and re-run /audit-spec
```

---

## Agents Involved

| Agent | Role | Execution |
|-------|------|-----------|
| **Arbiter** | Orchestrator | Coordinates |
| **Enforcer** | Unit Tests | Parallel |
| **Sentinel** | E2E Tests | Parallel |
| **Inquisitor** | Code Quality | Parallel |
| **Watcher** | Security | Parallel |
| **Curator** | Schema Integrity (DB specs only, read-only) | Parallel |

---

## Execution Flow

```
SEQUENTIAL GATE THEN PARALLEL

TDD Check ──▶ [Enforcer + Sentinel + Inquisitor + Watcher (+ Curator: DB)] ──▶ Arbiter
(blocking)              (all run simultaneously)              (compile)
    │                              │                              │
    │                              │                              │
 verify                       parallel                      validation.md
 compliance                   validation                    handoff.md
```
