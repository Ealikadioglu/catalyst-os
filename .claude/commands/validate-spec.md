# /validate-spec

Run validation checks on a completed implementation.

## Usage

```
/validate-spec @2025-11-29-stripe-integration
```

## Prerequisites

- Spec must be in "build complete" state
- All tasks in `implementation/tasks.md` marked complete
- **TDD compliance verified** (test-manifest.md shows all green)
- Unit tests passing

---

## ⚠️ TDD COMPLIANCE CHECK (FIRST!)

```
╔═══════════════════════════════════════════════════════════════════╗
║  Before validation begins, verify TDD was followed:               ║
║                                                                    ║
║  1. Check implementation/test-manifest.md exists                  ║
║  2. Verify Red Phase was completed (tests written first)          ║
║  3. Verify Green Phase achieved (all tests pass)                  ║
║                                                                    ║
║  🚫 If TDD was skipped → REJECT and return to /build-spec         ║
╚═══════════════════════════════════════════════════════════════════╝
```

### TDD Compliance Checklist

Before spawning any validation agents, check:

- [ ] `implementation/test-manifest.md` exists
- [ ] Test manifest shows tests were written BEFORE code
- [ ] `implementation/progress.md` shows TDD log with red→green transition
- [ ] All tests pass when run

**If ANY of these fail:**
```
❌ VALIDATION BLOCKED

TDD compliance check failed:
- Missing: test-manifest.md

Action Required:
1. Return to /build-spec
2. Write tests first (Enforcer)
3. Then implement (Builders)
4. Re-run /validate-spec
```

---

## ORCHESTRATION MODE

**IMPORTANT**: This command operates in orchestration mode. The main agent DELEGATES work to specialized sub-agents.

**You MUST:**
- First: Check TDD compliance (before spawning agents)
- Spawn **Enforcer** agent to verify unit test coverage
- Spawn **Sentinel** agent for E2E testing
- Spawn **Inquisitor** agent for code review
- Spawn **Watcher** agent for security scanning

**The main agent coordinates, sub-agents execute.**

### ⚡ PARALLEL EXECUTION

**After TDD check passes, spawn ALL validation agents in parallel!**

```
TDD Check (sequential, must pass first)
        ↓
[Enforcer + Sentinel + Inquisitor + Watcher] (all parallel)
```

All Guardians are independent - spawn them together for faster validation.

---

## Workflow

The **Arbiter** agent orchestrates the Guardians.

### Phase 0: TDD Compliance Verification (BLOCKING)

**This phase MUST pass before any validation begins.**

1. Read `implementation/test-manifest.md`
2. Read `implementation/progress.md`
3. Verify TDD workflow was followed:

```markdown
## TDD Compliance Report

### Checklist
- [x] test-manifest.md exists
- [x] Tests written before implementation (timestamp check)
- [x] Red phase documented (all tests failed initially)
- [x] Green phase achieved (all tests pass now)
- [x] No tests were skipped or deleted

### Evidence
- Test manifest created: 10:00 AM
- First implementation commit: 10:30 AM (after tests)
- Red phase tests: 45 failing
- Green phase tests: 45 passing

### Result: ✅ TDD COMPLIANT
```

**If not compliant:**
```markdown
### Result: ❌ TDD NOT COMPLIANT

Issues:
- Implementation started before tests were written
- 3 tasks have no corresponding tests
- Test manifest missing

Action: Return to /build-spec and follow TDD process
```

---

### Phase 1: Unit Test Verification (Enforcer)

Use `unit-test-writing` and `test-fixture-creation` skills:

1. **Run all unit tests** and verify they pass
2. **Check test coverage**:
   - Minimum coverage threshold (if configured)
   - All critical paths tested
   - Edge cases covered

3. **Verify test quality**:
   - Tests are meaningful (not just checking true === true)
   - Tests match requirements
   - No tests that always pass

4. Document in `validation/unit-test-report.md`:

```markdown
# Unit Test Report

## Summary
- Total Tests: 45
- Passing: 45
- Failing: 0
- Skipped: 0
- Coverage: 87%

## By Category
| Category | Tests | Pass | Coverage |
|----------|-------|------|----------|
| Unit | 25 | 25 | 92% |
| Integration | 8 | 8 | 85% |
| Component | 12 | 12 | 82% |

## Quality Check
- [x] No empty tests
- [x] No always-passing tests
- [x] Assertions are meaningful
- [x] Edge cases covered
```

---

### Phase 2: E2E Testing (Sentinel)

Use `e2e-test-execution` and `browser-automation` skills:

1. Run full E2E test suite
2. Test real user flows:
   - Happy paths
   - Error scenarios
   - Edge cases
3. Capture screenshots on failure
4. Document in `validation/e2e-test-report.md`

```markdown
# E2E Test Report

## Summary
- Total Flows: 12
- Passing: 12
- Failing: 0

## User Flows Tested
- [x] User can view pricing page
- [x] User can select a plan
- [x] User can complete checkout
- [x] User can manage subscription
- [x] System handles payment failures
- [x] Webhook processes correctly
```

---

### Phase 3: Code Quality (Inquisitor)

Use `lint-checking` and `code-review` skills:

1. **Linting**: Run project linters
   - ESLint/Prettier (JS/TS)
   - Pylint/Black (Python)
   - etc.

2. **Code Review**: Check for:
   - Naming conventions
   - Function complexity
   - DRY violations
   - Missing error handling
   - Documentation gaps

3. Document in `validation/quality-report.md`

---

### Phase 4: Security Scan (Watcher)

Use `dependency-audit` and `secret-scanning` skills:

1. **Dependency Audit**:
   - Check for vulnerable packages
   - Verify license compliance

2. **Secret Scanning**:
   - Scan for exposed API keys
   - Check for hardcoded credentials

3. **Input Validation**:
   - Verify all inputs are sanitized
   - Check for SQL injection risks
   - Verify XSS protection

---

### Phase 5: Validation Report

Create `validation/sign-off.md`:

```markdown
# Validation Report

## Spec: {spec-name}
## Date: YYYY-MM-DD

## TDD Compliance: ✅ VERIFIED
- Tests written before code: ✓
- Red phase completed: ✓
- Green phase achieved: ✓

## Summary
| Check | Status | Notes |
|-------|--------|-------|
| TDD Compliance | ✅ Pass | Red→Green verified |
| Unit Tests | ✅ Pass | 45/45, 87% coverage |
| E2E Tests | ✅ Pass | 12/12 flows |
| Lint | ✅ Pass | 0 errors |
| Code Quality | ⚠️ Warn | 2 suggestions |
| Security | ✅ Pass | No vulnerabilities |

## Overall Status: ✅ READY FOR APPROVAL

## E2E Test Results
- ✅ User can view pricing page
- ✅ User can select a plan
- ✅ User can complete checkout
- ✅ User can manage subscription
- ✅ Webhook handles payment failures

## Code Quality Notes
1. Consider extracting duplicate validation logic
2. Add JSDoc to public API functions

## Security Notes
- No exposed secrets
- All inputs sanitized
- Dependencies up to date

## Recommendation
Ready for user review and approval.
```

---

## Failure Handling

### If TDD Compliance Fails

```
❌ VALIDATION BLOCKED - TDD NOT FOLLOWED

The implementation did not follow TDD:
- Tests were written after code
- OR tests are missing for some tasks

Action Required:
1. Do NOT proceed with validation
2. Return to /build-spec
3. Follow TDD process strictly
4. Re-run /validate-spec

This is not optional - TDD is mandatory.
```

### If Any Check Fails

1. **Create issue list** in `validation/issues.md`
2. **Route back to builders**:
   - Test failures → Technologists
   - Quality issues → Inquisitor suggestions
   - Security issues → STOP, notify immediately
3. **Re-run** `/build-spec` for fixes
4. **Re-run** `/validate-spec`

---

## Output

### Success
```
✅ Validation complete!

Spec: 2025-11-29-stripe-integration

TDD Compliance: ✅ VERIFIED
├── Tests written first: ✓
├── Red phase completed: ✓
└── Green phase achieved: ✓

Results:
├── Unit Tests: ✅ 45/45 passing (87% coverage)
├── E2E Tests: ✅ 12/12 passing
├── Lint: ✅ No errors
├── Code Quality: ⚠️ 2 suggestions
└── Security: ✅ No vulnerabilities

Status: READY FOR APPROVAL

Next: Review and run /approve-spec @2025-11-29-stripe-integration
      Or /reject-spec @2025-11-29-stripe-integration "reason"
```

### TDD Failure
```
❌ Validation blocked!

Spec: 2025-11-29-stripe-integration

TDD Compliance: ❌ FAILED
├── test-manifest.md: Missing
├── Tests written first: Unknown
└── Evidence of TDD: None found

Status: BLOCKED - RETURN TO BUILD

Action: Run /build-spec @2025-11-29-stripe-integration
        Follow TDD process (tests BEFORE code)
        Then re-run /validate-spec
```
