# /build-task

Execute a focused task on an existing codebase. Works with or without prior specs (brownfield compatible).

## Usage

```
/build-task "change session timeout to 30 days"
/build-task @2026-01-11-supabase-auth "change session timeout"
```

---

## When to Use

| Use `/build-task` | Use `/catalyze-spec` |
|-------------------|----------------------|
| Modify existing feature | New feature from scratch |
| Stakeholder change request | Major addition |
| Mid-level refactoring | Architectural change |
| Post-completion modifications | Needs research phase |
| Brownfield projects (no specs) | Greenfield projects |

---

## ORCHESTRATION MODE

**IMPORTANT**: This command operates in orchestration mode. The main agent DELEGATES work to specialized sub-agents.

### Output Location

```
.catalyst/tasks/YYYY-MM-DD-{slug}.md
```

Tasks are **independent entities**. They can optionally reference specs but don't require them.

---

## Workflow

### Phase 0: Context Gathering

1. **Check for @spec reference:**
   - If provided → Read spec for context
   - If not provided → Analyze codebase directly

2. **Auto-detect related specs (optional):**
   - Search `.catalyst/specs/` for keyword matches
   - If found → Add as reference in task file
   - If not found → Continue without

3. **Create task file:**
   ```
   .catalyst/tasks/YYYY-MM-DD-{slug}.md
   ```

### Phase 1: Test Assessment (Enforcer)

**CRITICAL: Assess before assuming TDD is needed.**

Spawn **Enforcer** agent to analyze:

```
"Analyze test coverage for [task description].
Determine test strategy: COVERED, MODIFY, or NEW.
Output assessment to task file."
```

| Strategy | Condition | Action |
|----------|-----------|--------|
| **COVERED** | Existing tests fully cover this change | Skip to Phase 3 |
| **MODIFY** | Tests exist but assertions need updating | Update tests first |
| **NEW** | No tests cover this area | Write new tests first |

### Phase 2: Tests (if MODIFY or NEW)

If assessment is MODIFY or NEW:

```
Enforcer: "Write/update tests for [task].
Tests must FAIL before implementation (TDD)."
```

If assessment is COVERED:
- Skip to Phase 3

### Phase 3: Implementation

Spawn appropriate builder based on task scope:

```
Smith: "Implement [backend changes]. Run tests after."
Shaper: "Implement [frontend changes]. Run tests after."
Alchemist: "Implement [database changes]. Run tests after."
```

### Phase 4: Verify & Commit

1. **Run tests** - All must pass
2. **Run lint** - No errors
3. **Update task file** - Mark COMPLETE, add commit hash
4. **Commit** with structured message:

```
task({scope}): {description}

Task: YYYY-MM-DD-{slug}
Related: @spec-name (if any)

Changes:
- {change 1}
- {change 2}

Tests: {X} passing
```

---

## Task File Format

```markdown
# Task: {Title}

> Status: IN_PROGRESS | COMPLETE
> Created: YYYY-MM-DD
> Requested by: {Who asked for this}
> Related Spec: @spec-name (optional, if found)

## Description
{Brief description of what needs to change and why}

## Test Assessment
| Strategy | Reason |
|----------|--------|
| COVERED / MODIFY / NEW | {Explanation} |

### Affected Tests (if MODIFY/NEW)
- path/to/test.ts → {what changes}

## Changes Required
- [ ] {Task item 1}
- [ ] {Task item 2}

## Files Modified
- src/path/to/file.ts

## Commit
- Hash: {filled on completion}
- Branch: task/{slug}
```

---

## Output

### Success
```
Task complete!

Task: 2026-01-25-session-timeout
Status: COMPLETE

Test Assessment: MODIFY
- Updated 2 test files

Changes:
- src/lib/supabase.ts (session config)
- tests/auth/session.test.ts (assertions)

Tests: 12 passing
Commit: abc1234

[If related spec found:]
Related: @2026-01-11-supabase-auth

Created: .catalyst/tasks/2026-01-25-session-timeout.md
```

### Assessment Only (dry run)
```
Task assessed!

Task: 2026-01-25-session-timeout
Test Strategy: COVERED

Existing tests fully cover this change:
- tests/auth/session.test.ts (line 45-67)

Ready to implement. Run again to proceed.
```

---

## Examples

### With Spec Reference
```
/build-task @2026-01-11-supabase-auth "increase session timeout to 30 days"
```

### Without Spec (Brownfield)
```
/build-task "add loading spinner to dashboard"
```

### Multiple Related Changes
```
/build-task "update all API endpoints to use new auth header format"
```
