---
name: spec-validation
description: Validate a finished implementation for test coverage, code quality, security, and schema integrity by orchestrating the Guardian agents. Use for /audit-spec.
---

# Spec Validation

> **When to invoke:** When running validation checks on a completed implementation.
> **Invoked by:** `/audit-spec` command.
> **Orchestrator:** Arbiter agent.
>
> **Lifecycle position:** `/catalyze-spec` → `/forge-spec` → **`/audit-spec`** → `/seal-spec`
>
> This skill audits the CODE implementation (quality, security, tests) — not the spec document.

## Purpose

Orchestrate comprehensive validation: TDD compliance, unit tests, E2E tests, code quality, and security scanning.

## Skills Referenced

- `verification-before-completion` — All validation must produce evidence
- `agent-delegation` — Parallel agent spawning rules
- `test-driven-development` — TDD compliance verification

## Prerequisites — BLOCKING

Before ANY validation begins, verify the spec was actually built:

1. **tasks.md must exist** in the spec folder
   - IF NOT FOUND → STOP: "No tasks.md found. Run `/forge-spec @{slug}` first."
2. **Spec status must be IN_PROGRESS or later** (not DRAFT)
   - IF DRAFT → STOP: "Spec is still in DRAFT. Run `/forge-spec @{slug}` to implement it first."
3. All tasks in `tasks.md` marked complete
4. TDD compliance verified (tests pass)

## Output Location

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── validation.md     # Arbiter creates (this phase)
├── handoff.md        # Arbiter creates (on success)
└── ...existing files
```

## TDD Compliance Check (FIRST!)

```
Before validation begins, verify TDD was followed:

1. Check tasks.md has test locations for each task
2. Verify all tests pass
3. Verify tests were written before implementation

If TDD was skipped → REJECT and return to /forge-spec
```

## Parallel Execution

```
TDD Check (sequential, must pass first)
        |
        v
[Enforcer + Sentinel + Inquisitor + Watcher + Curator] (all parallel)
        |
        v
Arbiter compiles results → validation.md
        |
        v (if all pass)
Arbiter generates handoff.md
```

## Workflow

### Phase 0: TDD Compliance (BLOCKING)

Read tasks.md, verify each task has tests, run all tests. If not compliant → BLOCK.

Direct-mode specs (`> Lane: direct` on line 1 of `tasks.md`) are compliant when the RED commit precedes the GREEN commit in `git log` — there is no Forger DAG to check.

Then read `.catalyst/specs/{spec-slug}/journal/*.md` (if present). The journals are written **for this audit**: deviations, abandoned approaches, builder notes like "this row should have been `mut`". Feed them to Inquisitor and Watcher as context.

### Phase 1-4: Validation (PARALLEL)

Guardians **return findings in their response**. None of them writes a file. Arbiter compiles
`validation.md`, and Arbiter is its only writer. A `validation-{guardian}.md` on disk is a report
nothing reads: the audit is over by the time it exists, and `/seal-spec` reads `validation.md`.

Put the shape in every Guardian prompt, because an unshaped "report your findings" is what turns a
verdict into an essay:

```
"Return findings in your response; write no file. Each finding: one claim, one
evidence pointer (the command you ran and its output, or file:line), one line
on whether it blocks. Lead with the verdict: PASS, PASS WITH CONCERNS, or FAIL.
A finding you cannot point at is not a finding."
```

Spawn all Guardians in parallel:

**Enforcer** (Unit Tests):
- Run all unit tests
- Check coverage thresholds
- Verify test quality

**Sentinel** (E2E Tests):
- Run full E2E test suite
- Test user flows
- Capture screenshots on failure

**Inquisitor** (Code Quality + Simplification):
- Run linters
- Code review checks
- Documentation gaps — and the opposite: **comment budget** per `.claude/rules/code-comments.md` (docblocks ≤ 15 lines, why-only, no decision records in code; flag any file where comments exceed ~20% of the production diff)
- Evidence tiers honoured: every `mut` row has a mutation-detecting assertion; no `rg` row was escalated
- **Code simplification suggestions** (unnecessary abstractions, over-engineering, dead code, verbose patterns)
- Simplifications must NOT change behavior — only structure
- Provide before/after snippets for each suggestion

**Watcher** (Security):
- Dependency audit
- Secret scanning
- Input validation checks

**Curator** (Schema Integrity — only for specs touching database):
- READ-ONLY Guardian — audits the schema, never creates or modifies it
- (The Alchemist *builds* the schema during `/forge-spec`; Curator independently *verifies* it here)
- Query actual database schema for all tables the spec touches
- Verify column names in spec/code match real database columns
- Verify all foreign keys and constraints exist in the actual DB
- Verify API endpoints persist all fields the spec expects (end-to-end trace)
- Verify any SQL functions/stored procedures the feature depends on actually exist
- Check for missing sequences, triggers, or DB-level defaults the feature assumes

### Phase 5: Compile Results (Arbiter)

Create `validation.md` with results from all Guardians.

### Phase 6: Generate handoff.md (On Success)

If all validation passes, create handoff.md with:
- Summary of what was built
- Key decisions and reasoning
- Files modified
- How to test
- Edge cases and gotchas
- Follow-up items

## Validation Template

```markdown
# Validation: {Feature Name}

## TDD Compliance
- [x] Tests written before implementation
- [x] All tasks have tests
- [x] All tests pass

## Test Results
### Unit Tests (Enforcer)
- Total: N, Passing: N, Coverage: X%

### E2E Tests (Sentinel)
- Total: N, Passing: N

## Quality Checks
### Lint & Simplification (Inquisitor)
- Lint Status: PASS/FAIL, Errors: N, Warnings: N
- Simplification Opportunities: N found

### Security (Watcher)
- Dependencies: status
- Secrets: status
- Inputs: status

### Schema Integrity (Curator) — if spec touches database
- Column names match: status
- Constraints verified: status
- API end-to-end trace: status
- DB functions/sequences: status

## Overall Status: PASS/FAIL

## Issues Found
| Issue | Severity | Resolution |
|-------|----------|------------|
```

## Output

### Success
```
Validation complete!
Status: READY FOR APPROVAL
Next: /seal-spec @slug
```

### TDD Failure
```
Validation blocked!
TDD Compliance: FAILED
Action: Return to /forge-spec and follow TDD process
```

### Validation Failure
```
Validation failed!
Failed Checks: [details]
Action: Fix issues and re-run /audit-spec
```

Under `autopilot` this verdict returns to Forge-Master for **one** remediation pass and a re-audit; a second FAIL halts the chain before seal.

## Board Sync (final step)

Run this whether the audit passed or failed — the script reads `validation.md` and moves the spec to **Audited** only on `Overall Status: PASS`. Run the board script — it derives the state from disk and regenerates `roadmap.md` + `dashboard.html` deterministically. Never hand-write either file.

```bash
node .catalyst/bin/board.js --by "/audit-spec"
```
Paste its 4-line summary into your report. If it prints `skipped — no roadmap.md`, say so in one line and move on.
