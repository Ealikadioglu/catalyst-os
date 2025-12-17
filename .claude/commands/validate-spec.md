# /validate-spec

Run validation checks on a completed implementation.

## Usage

```
/validate-spec @2025-11-29-stripe-integration
```

## Prerequisites

- Spec must be in "build complete" state
- All tasks in `tasks.md` marked complete
- **TDD compliance verified** (tests pass)

---

## TDD COMPLIANCE CHECK (FIRST!)

```
  Before validation begins, verify TDD was followed:

  1. Check tasks.md has test locations for each task
  2. Verify all tests pass
  3. Verify tests were written before implementation

  If TDD was skipped -> REJECT and return to /build-spec
```

---

## ORCHESTRATION MODE

**IMPORTANT**: This command operates in orchestration mode. The main agent DELEGATES work to specialized sub-agents.

### Output Location

All outputs go to the spec folder. See AGENTS.md "Documentation Output Policy".

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── SPEC.md           # From /catalyze-spec
├── research.md       # From /catalyze-spec
├── tasks.md          # From /build-spec
├── validation.md     # Arbiter creates (this phase)
├── HANDOFF.md        # Arbiter creates (on success)
└── assets/
```

### PARALLEL EXECUTION

**After TDD check passes, spawn ALL validation agents in parallel!**

```
TDD Check (sequential, must pass first)
        |
        v
[Enforcer + Sentinel + Inquisitor + Watcher] (all parallel)
        |
        v
Arbiter compiles results -> validation.md
        |
        v (if all pass)
Arbiter generates HANDOFF.md
```

---

## Workflow

The **Arbiter** agent orchestrates the Guardians.

### Phase 0: TDD Compliance Verification (BLOCKING)

**This phase MUST pass before any validation begins.**

1. Read `tasks.md`
2. Verify each task has associated tests
3. Run all tests to confirm they pass

**If not compliant -> BLOCK and return to /build-spec**

---

### Phase 1-4: Validation (PARALLEL)

**Spawn all Guardians in parallel**:

```
Enforcer: "Verify test coverage and quality for spec {slug}"
Sentinel: "Run E2E tests for spec {slug}"
Inquisitor: "Review code quality for spec {slug}"
Watcher: "Scan for security issues in spec {slug}"
```

**Enforcer** (Unit Tests):
- Run all unit tests
- Check coverage thresholds
- Verify test quality

**Sentinel** (E2E Tests):
- Run full E2E test suite
- Test user flows
- Capture screenshots on failure

**Inquisitor** (Code Quality):
- Run linters
- Code review checks
- Documentation gaps

**Watcher** (Security):
- Dependency audit
- Secret scanning
- Input validation checks

---

### Phase 5: Compile Results (Arbiter)

**Arbiter creates `validation.md`**:

```markdown
# Validation: {Feature Name}

## Date: YYYY-MM-DD

## TDD Compliance
- [x] Tests written before implementation
- [x] All tasks have tests
- [x] All tests pass

## Test Results

### Unit Tests (Enforcer)
- Total: 45
- Passing: 45
- Coverage: 87%

### E2E Tests (Sentinel)
- Total: 12
- Passing: 12

## Quality Checks

### Lint (Inquisitor)
- Status: PASS
- Errors: 0
- Warnings: 2

### Code Review (Inquisitor)
- Status: PASS
- Suggestions: 2

### Security (Watcher)
- Dependencies: No vulnerabilities
- Secrets: None exposed
- Inputs: Sanitized

## Overall Status: PASS

## Issues Found
| Issue | Severity | Resolution |
|-------|----------|------------|
| Consider extracting validation logic | Low | Suggestion |
```

---

### Phase 6: Generate HANDOFF.md (On Success)

**If all validation passes**, Arbiter generates `HANDOFF.md`:

```markdown
# {Feature Name} - Handoff

> Generated: YYYY-MM-DD

## Summary
[2-3 sentences: what was built and why]

## What Changed
- [Key change 1]
- [Key change 2]

## Key Decisions
| Decision | Why |
|----------|-----|
| [Choice made] | [Reasoning] |

## Files Modified
- `path/to/file.ts` - [what changed]

## How to Test
1. [Step-by-step verification]
2. [Key user flows to check]

## Edge Cases & Gotchas
- [Important behavior to know]

## Follow-up Items
- [ ] [Deferred work if any]
```

---

## Output

### Success
```
Validation complete!

Spec: 2025-11-29-stripe-integration

TDD Compliance: VERIFIED

Results:
- Unit Tests: 45/45 passing (87% coverage)
- E2E Tests: 12/12 passing
- Lint: No errors
- Code Quality: 2 suggestions
- Security: No vulnerabilities

Status: READY FOR APPROVAL

Created:
- .catalyst/specs/{slug}/validation.md
- .catalyst/specs/{slug}/HANDOFF.md

Next: Review HANDOFF.md and run:
      /approve-spec @2025-11-29-stripe-integration
      Or /reject-spec @2025-11-29-stripe-integration "reason"
```

### TDD Failure
```
Validation blocked!

Spec: 2025-11-29-stripe-integration

TDD Compliance: FAILED
- Tests missing for tasks: T-003, T-005
- OR tests written after implementation

Status: BLOCKED - RETURN TO BUILD

Action: Run /build-spec @2025-11-29-stripe-integration
        Follow TDD process (tests BEFORE code)
        Then re-run /validate-spec
```

### Validation Failure
```
Validation failed!

Spec: 2025-11-29-stripe-integration

Failed Checks:
- E2E Tests: 2 failures
- Security: 1 vulnerability found

Created: .catalyst/specs/{slug}/validation.md (with details)

Action: Fix issues and re-run /validate-spec
```
