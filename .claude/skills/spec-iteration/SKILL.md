# Spec Iteration

> **When to invoke:** When adding improvements, enhancements, or edge case handling to a spec that's being built.
> **Invoked by:** `/iterate-spec` command.
> **Orchestrator:** Forge-Master agent.

## Purpose

Continue building a spec with new improvements discovered during development. Unlike `/update-spec` which stops after updating docs, iteration updates docs AND continues building in one flow.

## Skills Referenced

- `test-driven-development` — New tests must follow TDD
- `agent-delegation` — Orchestrator rules
- `verification-before-completion` — Verify before claiming done
- `brainstorming` — Oracle uses if improvement needs clarification

## Prerequisites

- Spec must exist in `.catalyst/specs/`
- Build has been started (`tasks.md` exists)
- On the feature branch from `/build-spec`

## Key Difference

```
/update-spec  →  Updates docs  →  STOPS  →  Manual /build-spec
/iterate-spec →  Updates docs  →  CONTINUES BUILDING (single flow)
```

## Git Workflow

```
PHASE 0: Verify on feature branch
GATE 1: RED FLAG → Commit: "test({scope}): add tests for {improvement}"
GATE 2: GREEN FLAG → Commit: "feat({scope}): {improvement description}"
```

## TDD IS MANDATORY

```
1. Task(subagent_type="scribe")    -> Update spec.md
2. Task(subagent_type="forger")    -> Add new tasks to tasks.md
3. Task(subagent_type="enforcer")  -> Write tests for NEW tasks (must FAIL)
4. Verify                          -> Run tests, confirm RED for new tests
5. Task(subagent_type="smith/shaper/alchemist") -> Implement until GREEN
```

## Execution Order

```
Phase 1: Clarify (Oracle — if needed)
              |
Phase 2: Update Spec (Scribe)
              |
Phase 3: Update Tasks (Forger)
              |
Phase 4: Write Tests (Enforcer) — NEW tasks only
              |
         GATE 1: RED PHASE — New tests must FAIL, existing PASS
              |
Phase 5: Implement (Smith/Shaper/Alchemist)
              |
         GATE 2: GREEN PHASE — All tests must PASS
```

## Workflow Detail

### Phase 0: Verify State

1. Check if `.catalyst/worktrees/{spec-slug}` exists
   - IF exists: `cd` into it (worktree mode)
2. ELSE: Verify on feature branch: `git branch --show-current`
3. Read existing spec.md and tasks.md
4. If neither worktree nor feature branch: ask user to run `/build-spec` or `/build-spec-worktree`

### Phase 1: Clarify (Oracle — Optional)

If improvement description is vague, spawn Oracle. Skip if already clear and specific.

### Phase 2: Update Specification (Scribe)

Spawn Scribe to update spec.md:
- Add new requirements
- Update Changelog with date and description
- Keep Status as IN_PROGRESS
- Do NOT change completed requirements

### Phase 3: Update Tasks (Forger)

Spawn Forger to update tasks.md:
- Read current tasks, identify completed vs pending
- Add NEW tasks with `iter-` prefix
- Update Build DAG with dependencies
- Do NOT modify completed tasks

### Phase 4: Write Tests (Enforcer) — RED PHASE

Write tests for NEW iteration tasks only. Do NOT modify existing tests.

### GATE 1: Red Phase

- New tests FAIL
- Existing tests still PASS (no regression)
- Commit: `test({scope}): add tests for {improvement}`

### Phase 5: Implementation

Spawn appropriate agents (Smith/Shaper/Alchemist) based on task types. Parallel execution allowed if non-overlapping scopes.

### GATE 2: Green Phase

- All new tests PASS
- All existing tests still PASS
- Commit: `feat({scope}): {improvement description}`

## Failure Modes

| Failure | Action |
|---------|--------|
| Not on feature branch | Checkout, run `/build-spec`, or `/build-spec-worktree` first |
| Spec not found | Run `/catalyze-spec` first |
| tasks.md missing | Run `/build-spec` first |
| Improvement conflicts with existing | Spawn Oracle to discuss options |
| New tests pass immediately | Tests are wrong — rewrite for NEW functionality |

## When to Use

- Discovered better approach during testing
- Thought of an improvement or enhancement
- Found an edge case that should be handled
- Want to add something that makes the feature better

**NOT for bugs** — bugs are implementation issues, not spec changes.
**NOT for missing requirements** — use `/update-spec` first.
