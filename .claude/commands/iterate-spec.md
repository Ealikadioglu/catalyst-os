# /iterate-spec

Continue building a spec with new improvements, ideas, or enhancements discovered during development.

---

## FORGE-MASTER BEHAVIORAL RULES

**You are an ORCHESTRATOR. You coordinate work, you do NOT do work.**

```
BEFORE writing ANY code or test:
  → STOP
  → Ask yourself: "Should a specialized agent do this?"
  → If YES: Use Task tool with appropriate subagent_type
  → If NO: You're probably wrong. Use the Task tool.

You may ONLY:
  ✓ Read files to understand context
  ✓ Use Task tool to spawn agents (oracle, scribe, forger, enforcer, smith, shaper, alchemist)
  ✓ Run test commands to verify gates
  ✓ Report status to user

You may NEVER:
  ✗ Write code (use smith or shaper)
  ✗ Write tests (use enforcer)
  ✗ Create task breakdowns (use forger)
  ✗ Write database schemas (use alchemist)
  ✗ Update spec documentation (use scribe)

IF YOU ARE ABOUT TO USE Edit/Write TOOL ON A .py/.ts/.js/.md FILE → STOP → SPAWN AN AGENT
```

---

## Usage

```
/iterate-spec @2025-11-29-stripe-integration "add support for annual billing with 20% discount"
/iterate-spec @2025-11-29-stripe-integration "handle the edge case where user cancels mid-checkout"
/iterate-spec @2025-11-29-stripe-integration "improve error messages for failed payments"
```

## When to Use

Use `/iterate-spec` when you're **in the middle of building** and:
- You discovered a better approach during testing
- You thought of an improvement or enhancement
- You found an edge case that should be handled
- You want to add something that makes the feature better

**NOT for bugs** - bugs are implementation issues, not spec changes.
**NOT for missing requirements** - if the spec was incomplete, use `/update-spec` first.

---

## Prerequisites

- Spec must exist in `.catalyst/specs/`
- Build has been started (tasks.md exists)
- You're on the feature branch (from `/build-spec`)

---

## KEY DIFFERENCE FROM OTHER COMMANDS

```
┌─────────────────────────────────────────────────────────────────┐
│  /update-spec  →  Updates docs  →  STOPS  →  Manual /build-spec │
│                                                                 │
│  /iterate-spec →  Updates docs  →  CONTINUES BUILDING           │
│                   (Single continuous flow, no context loss)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## GIT WORKFLOW

```
┌─────────────────────────────────────────────────────────────────┐
│  GIT CHECKPOINTS                                                │
│  ───────────────                                                │
│                                                                 │
│  PHASE 0: Verify Branch                                         │
│  └── Confirm on feature branch: {branch_prefix}/{spec-slug}     │
│                                                                 │
│  GATE 1: RED FLAG (for new tests)                               │
│  └── Commit: "test({scope}): add tests for {improvement}"       │
│                                                                 │
│  GATE 2: GREEN FLAG                                             │
│  └── Commit: "feat({scope}): {improvement description}"         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## TDD IS MANDATORY - NO EXCEPTIONS

```
  IMPLEMENTATION WITHOUT TESTS IS FORBIDDEN

  The iteration MUST follow this exact sequence:

  1. Task(subagent_type="scribe")    -> Update spec.md
  2. Task(subagent_type="forger")    -> Add new tasks to tasks.md
  3. Task(subagent_type="enforcer")  -> Write tests for NEW tasks (must FAIL)
  4. Verify                          -> Run tests, confirm RED for new tests
  5. Task(subagent_type="smith/shaper/alchemist") -> Implement until GREEN
```

---

## ORCHESTRATION MODE

Forge-Master spawns specialized agents using the **Task tool**. Each phase is a separate agent.

### Output Location

All outputs go to the existing spec folder. See AGENTS.md "Documentation Output Policy".

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           # Scribe updates with new requirement
├── research.md       # Scribe appends if needed
├── tasks.md          # Forger adds new tasks
├── validation.md     # (unchanged until /validate-spec)
└── handoff.md        # (regenerated on completion)
```

### Execution Order

```
Phase 1: Clarify (Oracle - if needed)
              |
Phase 2: Update Spec (Scribe)
              |
Phase 3: Update Tasks (Forger)
              |
Phase 4: Write Tests (Enforcer) - NEW tasks only
              |
         GATE 1: RED PHASE - New tests must FAIL
              |
Phase 5: Implement (Smith/Shaper/Alchemist)
              |
         GATE 2: GREEN PHASE - All tests must PASS
```

---

## Workflow

### Phase 0: Verify State

**Before any work begins, verify we're in the right state.**

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 STATE VERIFICATION                                          │
│  ────────────────────                                           │
│                                                                 │
│  1. Verify on feature branch:                                   │
│     $ git branch --show-current                                 │
│     Expected: {branch_prefix}/{spec-slug}                       │
│                                                                 │
│  2. Read existing spec files:                                   │
│     - spec.md (current requirements)                            │
│     - tasks.md (current tasks and progress)                     │
│                                                                 │
│  3. If NOT on feature branch:                                   │
│     → Ask user if they want to checkout the branch              │
│     → Or if they need to run /build-spec first                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Clarify Improvement (Oracle - Optional)

**If the improvement description is vague, spawn Oracle to clarify.**

**Spawn Oracle agent** using `Task` tool with `subagent_type="oracle"`:

```
"Clarify this improvement for spec {slug}:
'{improvement description}'

Current spec is in spec.md. Ask focused questions to understand:
- What exactly should change?
- What's the expected behavior?
- Are there edge cases to consider?

Keep it brief - this is an iteration, not a new spec."
```

**Skip this phase if the improvement is already clear and specific.**

---

### Phase 2: Update Specification (Scribe)

**Spawn Scribe agent** using `Task` tool with `subagent_type="scribe"`:

```
"Update spec.md for spec {slug} with this improvement:
'{improvement description}'

Tasks:
1. Add new requirement(s) to Requirements section
2. Update Changelog with date and description
3. If technical research needed, append to research.md
4. Keep Status as IN_PROGRESS

Do NOT change existing completed requirements.
Mark this as an ITERATION, not a new feature."
```

**WAIT for Scribe to complete before proceeding to Phase 3.**

---

### Phase 3: Update Tasks (Forger)

**Spawn Forger agent** using `Task` tool with `subagent_type="forger"`:

```
"Update tasks.md for spec {slug} with new tasks for:
'{improvement description}'

Tasks:
1. Read current tasks.md and identify completed vs pending tasks
2. Add NEW tasks for the improvement (prefix with ITERATION marker)
3. Update Build DAG with new task dependencies
4. Place new tasks in appropriate phase (foundation/contracts/parallel)
5. Do NOT modify completed tasks

New tasks should be marked with:
| ID | Agent | Scope | Depends On | Status |
| iter-001 | {agent} | {scope} | {deps} | pending |
"
```

**WAIT for Forger to complete before proceeding to Phase 4.**

---

### Phase 4: Write Tests for New Tasks (Enforcer) - RED PHASE

**CRITICAL: Only write tests for the NEW iteration tasks.**

**Spawn Enforcer agent** using `Task` tool with `subagent_type="enforcer"`:

```
"Write failing tests for NEW iteration tasks in tasks.md.
Look for tasks with 'iter-' prefix or marked as new.

Tests go in project test folders (src/__tests__/, tests/, etc.).
Update tasks.md Progress section with test file locations.

Do NOT modify existing tests.
New tests MUST fail (we haven't implemented yet)."
```

**WAIT for Enforcer to complete before proceeding to Gate 1.**

---

### GATE 1: Red Phase Verification (RED FLAG)

**STOP! Before implementing:**

```bash
# Run tests for new iteration tasks
npm test -- --grep "iter-"  # or appropriate filter

# Expected: New tests FAIL, existing tests still PASS
```

**Gate Checklist:**
- [ ] Every new task has at least one test
- [ ] All NEW tests FAIL
- [ ] All EXISTING tests still PASS (no regression)

```
┌─────────────────────────────────────────────────────────────────┐
│  🚩 RED FLAG COMMIT                                             │
│  ─────────────────                                              │
│                                                                 │
│  After Gate 1 passes, commit the new tests:                     │
│                                                                 │
│  $ git add .                                                    │
│  $ git commit -m "test({scope}): add tests for {improvement}"   │
│                                                                 │
│  Example:                                                       │
│  git commit -m "test(billing): add tests for annual discount"   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 5: Implement New Tasks (Smith/Shaper/Alchemist)

**Only start this phase AFTER Gate 1 passes!**

**Spawn appropriate agents based on task types in tasks.md.**

For database tasks, **spawn Alchemist**:
```
"Implement iter-db-* tasks.
SCOPE (write): {from tasks.md}
Run tests after to verify progress."
```

For backend tasks, **spawn Smith**:
```
"Implement iter-api-* tasks.
SCOPE (write): {from tasks.md}
READS (no modify): src/types/**
Run tests after each change."
```

For frontend tasks, **spawn Shaper**:
```
"Implement iter-ui-* tasks.
SCOPE (write): {from tasks.md}
READS (no modify): src/types/**, src/components/shared/**
Run tests after each change."
```

**Parallel execution allowed if tasks have non-overlapping scopes.**

---

### GATE 2: Green Phase Verification (GREEN FLAG)

**Before completing iteration:**

```bash
# Run ALL tests - they MUST pass
npm test

# Expected output:
# Tests: XX passed, 0 failed
# Status: GREEN
```

**Gate Checklist:**
- [ ] All new iteration tests PASS
- [ ] All existing tests still PASS
- [ ] No regressions introduced

```
┌─────────────────────────────────────────────────────────────────┐
│  🟢 GREEN FLAG COMMIT                                           │
│  ───────────────────                                            │
│                                                                 │
│  After Gate 2 passes, commit the implementation:                │
│                                                                 │
│  $ git add .                                                    │
│  $ git commit -m "feat({scope}): {improvement description}"     │
│                                                                 │
│  Example:                                                       │
│  git commit -m "feat(billing): add annual billing with 20% discount"
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output

```
Iteration complete!

Spec: 2025-11-29-stripe-integration
Branch: feat/2025-11-29-stripe-integration
Improvement: "add annual billing with 20% discount"

Git Commits:
┌────────────────────────────────────────────────────────────────┐
│ 🚩 abc1234 test(billing): add tests for annual discount        │
│ 🟢 def5678 feat(billing): add annual billing with 20% discount │
└────────────────────────────────────────────────────────────────┘

Changes Made:
- spec.md: Added REQ-011 (annual billing requirement)
- tasks.md: Added 3 new tasks (iter-001, iter-002, iter-003)
- New tests: 8 tests written, all passing
- Implementation: 4 files modified

TDD Compliance: VERIFIED
- New tests written before implementation
- All tests passing (existing + new)

Updated: .catalyst/specs/2025-11-29-stripe-integration/
├── spec.md (new requirement added)
├── tasks.md (new tasks added)
└── research.md (unchanged)

Next: Continue testing, or run another /iterate-spec
      When ready: /validate-spec @2025-11-29-stripe-integration
```

---

## Failure Modes

### If Not on Feature Branch

```
PROBLEM: Not on the spec's feature branch
ACTION:  Either checkout the branch:
         $ git checkout feat/{spec-slug}

         Or if build hasn't started:
         $ /build-spec @{spec-slug}
```

### If Spec Not Found

```
PROBLEM: Spec doesn't exist in .catalyst/specs/
ACTION:  Create the spec first:
         $ /catalyze-spec "your feature description"
```

### If Tasks.md Doesn't Exist

```
PROBLEM: No tasks.md found - build hasn't started
ACTION:  Run /build-spec first to create initial tasks
         $ /build-spec @{spec-slug}
```

### If Improvement Conflicts with Existing

```
PROBLEM: New requirement conflicts with completed work
ACTION:  Spawn Oracle to discuss with user
         Options:
         1. Modify approach to avoid conflict
         2. Accept rework of completed tasks
         3. Create follow-up spec instead
```

### If New Tests Pass Immediately

```
PROBLEM: New tests pass before implementation
ACTION:  Tests are wrong - they're testing existing behavior
         Delete and rewrite tests for the NEW functionality
```

---

## Tips

Be specific about the improvement:
- Bad: "make it better"
- Good: "add 20% discount for annual billing plans"

- Bad: "handle errors"
- Good: "show user-friendly message when payment fails with insufficient funds"

- Bad: "improve performance"
- Good: "cache subscription status to reduce Stripe API calls"

---

## Multiple Iterations

You can run `/iterate-spec` multiple times during a build:

```
/build-spec @my-feature
   ↓
/iterate-spec @my-feature "add X"
   ↓
/iterate-spec @my-feature "improve Y"
   ↓
/iterate-spec @my-feature "handle edge case Z"
   ↓
/validate-spec @my-feature
```

Each iteration adds to the same spec, maintaining full history in:
- spec.md changelog
- tasks.md with iter-* prefixed tasks
- Git commits showing progression
