# Task Building

> **When to invoke:** When executing a focused task on an existing codebase.
> **Invoked by:** `/build-task` command.

## Purpose

Execute focused, brownfield-compatible tasks. Works with or without prior specs. Simpler flow than full spec build.

## Skills Referenced

- `test-driven-development` — Test assessment and TDD when needed
- `agent-delegation` — Orchestrator rules
- `verification-before-completion` — Verify before marking complete
- `systematic-debugging` — When tests fail during implementation

## When to Use

| Use `/build-task` | Use `/catalyze-spec` |
|-------------------|----------------------|
| Modify existing feature | New feature from scratch |
| Stakeholder change request | Major addition |
| Mid-level refactoring | Architectural change |
| Post-completion modifications | Needs research phase |
| Brownfield projects (no specs) | Greenfield projects |

## Output Location

```
.catalyst/tasks/YYYY-MM-DD-{slug}.md
```

Tasks are independent entities. They can optionally reference specs.

## Workflow

### Phase 0: Context Gathering

1. Check for @spec reference → read spec for context
2. Auto-detect related specs in `.catalyst/specs/`
3. Create task file

### Phase 1: Test Assessment (Enforcer)

Spawn Enforcer to analyze test coverage:

| Strategy | Condition | Action |
|----------|-----------|--------|
| **COVERED** | Existing tests fully cover this change | Skip to Phase 3 |
| **MODIFY** | Tests exist but assertions need updating | Update tests first |
| **NEW** | No tests cover this area | Write new tests first |

### Phase 2: Tests (if MODIFY or NEW)

Spawn Enforcer to write/update tests. Tests must FAIL before implementation (TDD).

### Phase 3: Implementation

Spawn appropriate builder based on task scope:
- Smith for backend
- Shaper for frontend
- Alchemist for database

### Phase 4: Verify & Commit

1. Run tests — all must pass
2. Run lint — no errors
3. Update task file — mark COMPLETE
4. Commit with structured message

## Task File Format

```markdown
# Task: {Title}

> Status: IN_PROGRESS | COMPLETE
> Created: YYYY-MM-DD
> Related Spec: @spec-name (optional)

## Description
{What needs to change and why}

## Test Assessment
| Strategy | Reason |
|----------|--------|
| COVERED / MODIFY / NEW | {Explanation} |

## Changes Required
- [ ] {Task item}

## Files Modified
- src/path/to/file.ts

## Commit
- Hash: {filled on completion}
```
