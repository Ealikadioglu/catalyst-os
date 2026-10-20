# /catalyze-spec Workflow

> Shape a new specification from a feature request.

---

## Quick Reference

```
Command:      /catalyze-spec "feature description"
Unattended:   /catalyze-spec "feature description" --from /abs/plan.md
              (no questions, no approvals, no git; see spec-shaping → Unattended Mode)
Orchestrator: Catalyst
Agents:       Oracle → [Seer + Scout + Surveyor] → Scribe
Output:       .catalyst/specs/YYYY-MM-DD-{slug}/
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /catalyze-spec "Login pages and supabase auth"           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎯 CATALYST (Orchestrator)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌───────────────┐            ┌───────────────┐            ┌───────────────┐
│   PHASE 0     │            │   PHASE 1     │            │   PHASE 2     │
│   Roadmap     │───────────▶│   Initialize  │───────────▶│   Oracle      │
│   Assessment  │            │   Spec Folder │            │   (Sequential)│
└───────────────┘            └───────────────┘            └───────────────┘
                                                                  │
                                                                  ▼
                             ┌────────────────────────────────────────────────┐
                             │              PHASE 3: PARALLEL RESEARCH        │
                             │  ┌─────────┐   ┌─────────┐   ┌─────────┐      │
                             │  │  SEER   │   │  SCOUT  │   │ SURVEYOR│      │
                             │  │Codebase │   │   Web   │   │   UI    │      │
                             │  └─────────┘   └─────────┘   └─────────┘      │
                             └────────────────────────────────────────────────┘
                                                                  │
                                                                  ▼
                             ┌───────────────┐            ┌───────────────┐
                             │   PHASE 4     │            │               │
                             │   Scribe      │───────────▶│    OUTPUT     │
                             │   (Compile)   │            │               │
                             └───────────────┘            └───────────────┘
```

---

## Phase Details

### Phase 0: Roadmap Impact Assessment

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 ROADMAP ASSESSMENT                                          │
│  ─────────────────────                                          │
│                                                                 │
│  1. Read existing roadmap (if present)                          │
│     └── Check .catalyst/main/roadmap.md                         │
│                                                                 │
│  2. Analyze request scope:                                      │
│                                                                 │
│     ┌─────────────────────┬─────────────────────────────────┐   │
│     │ SMALL REQUEST       │ LARGE REQUEST                   │   │
│     ├─────────────────────┼─────────────────────────────────┤   │
│     │ • Dark mode toggle  │ • Stripe integration            │   │
│     │ • Fix button style  │ • Authentication system         │   │
│     │ • Add validation    │ • Database migration            │   │
│     │                     │                                 │   │
│     │ → Proceed directly  │ → Update roadmap first          │   │
│     └─────────────────────┴─────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 1: Initialize Spec Folder

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 INITIALIZE SPEC FOLDER                                      │
│  ─────────────────────────                                      │
│                                                                 │
│  Create structure:                                              │
│                                                                 │
│  .catalyst/specs/2026-01-11-supabase-auth/                      │
│  ├── spec.md           ← Requirements (empty, Scribe fills)     │
│  ├── research.md       ← Research findings (empty)              │
│  ├── handoff.md        ← Living document (created now)          │
│  └── assets/           ← Images, diagrams, mockups              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Requirements Gathering (Oracle) - SEQUENTIAL

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 REQUIREMENTS GATHERING                                      │
│  ─────────────────────────                                      │
│                                                                 │
│  ⚠️  THIS PHASE MUST COMPLETE BEFORE RESEARCH BEGINS            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🔮 ORACLE                                               │   │
│  │                                                          │   │
│  │  For "Login pages and supabase auth":                    │   │
│  │                                                          │   │
│  │    ❓ Auth methods? (Email/password, OAuth providers?)   │   │
│  │    ❓ Password reset flow needed?                        │   │
│  │    ❓ Session management preferences?                    │   │
│  │    ❓ Role-based access control?                         │   │
│  │    ❓ MFA requirements?                                  │   │
│  │                                                          │   │
│  │  ⏳ Wait for user responses                              │   │
│  │                                                          │   │
│  │  📋 Synthesize requirements                              │   │
│  │     └── Hand off to Scribe                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Research (PARALLEL)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 PARALLEL RESEARCH                                           │
│  ────────────────────                                           │
│                                                                 │
│  ⚡ ALL THREE AGENTS RUN SIMULTANEOUSLY                         │
│                                                                 │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────┐ │
│  │ 👁️ SEER            │ │ 🔍 SCOUT           │ │ 📐 SURVEYOR  │ │
│  │ Codebase Analysis  │ │ Web Research       │ │ UI Research  │ │
│  ├────────────────────┤ ├────────────────────┤ ├──────────────┤ │
│  │                    │ │                    │ │              │ │
│  │ • Find existing    │ │ • Supabase Auth    │ │ • Login page │ │
│  │   auth code        │ │   best practices   │ │   patterns   │ │
│  │                    │ │                    │ │              │ │
│  │ • Analyze project  │ │ • Next.js +        │ │ • Auth form  │ │
│  │   structure        │ │   Supabase         │ │   designs    │ │
│  │                    │ │   patterns         │ │              │ │
│  │ • Check env        │ │                    │ │ • Error      │ │
│  │   config patterns  │ │ • SSR auth         │ │   states     │ │
│  │                    │ │   strategies       │ │              │ │
│  │ • Find route       │ │                    │ │ • OAuth      │ │
│  │   protection       │ │ • Common security  │ │   buttons    │ │
│  │   patterns         │ │   pitfalls         │ │              │ │
│  │                    │ │                    │ │              │ │
│  └────────────────────┘ └────────────────────┘ └──────────────┘ │
│           │                      │                    │         │
│           └──────────────────────┼────────────────────┘         │
│                                  ▼                              │
│                         research.md                             │
│                    (all findings appended)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Compile Specification (Scribe)

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 COMPILE SPECIFICATION                                       │
│  ────────────────────────                                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📜 SCRIBE                                               │   │
│  │                                                          │   │
│  │  Compiles all findings into spec.md:                     │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ # Supabase Authentication System                   │  │   │
│  │  │                                                    │  │   │
│  │  │ > Status: DRAFT                                    │  │   │
│  │  │                                                    │  │   │
│  │  │ ## Overview                                        │  │   │
│  │  │ Complete auth system with login/signup pages       │  │   │
│  │  │                                                    │  │   │
│  │  │ ## User Stories                                    │  │   │
│  │  │ - As a user, I want to sign up with email...       │  │   │
│  │  │ - As a user, I want to login with Google...        │  │   │
│  │  │                                                    │  │   │
│  │  │ ## Requirements                                    │  │   │
│  │  │ ### Functional                                     │  │   │
│  │  │ - [ ] REQ-001: Email/password authentication       │  │   │
│  │  │ - [ ] REQ-002: OAuth with Google provider          │  │   │
│  │  │                                                    │  │   │
│  │  │ ### Non-Functional                                 │  │   │
│  │  │ - [ ] SEC-001: Passwords never stored plaintext    │  │   │
│  │  │ - [ ] PERF-001: Auth check < 50ms                  │  │   │
│  │  │                                                    │  │   │
│  │  │ ## Acceptance Criteria                             │  │   │
│  │  │ 1. User can sign up with valid email               │  │   │
│  │  │ 2. Invalid login shows error message               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output

```
✅ Spec shaped successfully!

Created: .catalyst/specs/2026-01-11-supabase-auth/
├── spec.md        ← Requirements documented
├── research.md    ← Research findings
├── handoff.md     ← Living document
└── assets/        ← UI references

[If roadmap was updated:]
📝 Roadmap updated: .catalyst/main/roadmap.md

⚠️  REMINDER: /forge-spec follows strict TDD
    1. Tests written FIRST (Enforcer)
    2. Tests must FAIL (red phase)
    3. Then implement (Builders)
    4. Tests must PASS (green phase)

➡️  Next: Run /forge-spec @2026-01-11-supabase-auth
```

---

## Agents Involved

| Agent | Role | Execution |
|-------|------|-----------|
| **Catalyst** | Orchestrator | Coordinates all |
| **Oracle** | Requirements | Sequential (first) |
| **Seer** | Codebase | Parallel |
| **Scout** | Web Research | Parallel |
| **Surveyor** | UI Research | Parallel |
| **Scribe** | Documentation | Sequential (last) |

---

## Execution Flow

```
HYBRID EXECUTION (Sequential + Parallel)

                    ┌─────────────────────────────────────────┐
                    │            PARALLEL BLOCK               │
                    │   ┌───────┐ ┌───────┐ ┌───────┐        │
Oracle ────────────▶│   │ Seer  │ │ Scout │ │Surveyor│       │────────▶ Scribe
(must complete      │   └───────┘ └───────┘ └───────┘        │          (compile)
 first)             │     (run simultaneously)               │
                    └─────────────────────────────────────────┘

WRONG:  Oracle → Seer → Scout → Surveyor → Scribe (one by one)
RIGHT:  Oracle → [Seer + Scout + Surveyor] → Scribe (parallel research)
```
