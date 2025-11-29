# /validate-spec

Run validation checks on a completed implementation.

## Usage

```
/validate-spec @2025-11-29-stripe-integration
```

## Prerequisites

- Spec must be in "build complete" state
- All tasks in `implementation/tasks.md` marked complete
- Unit tests passing

## Workflow

The **Arbiter** agent orchestrates the Guardians.

### Phase 1: E2E Testing (Sentinel)

Use `e2e-test-execution` and `browser-automation` skills:

1. Run full E2E test suite
2. Test real user flows:
   - Happy paths
   - Error scenarios
   - Edge cases
3. Capture screenshots on failure
4. Document in `validation/test-results.md`

### Phase 2: Code Quality (Inquisitor)

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

### Phase 3: Security Scan (Watcher)

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

### Phase 4: Validation Report

Create `validation/sign-off.md`:

```markdown
# Validation Report

## Spec: {spec-name}
## Date: YYYY-MM-DD

## Summary
| Check | Status | Notes |
|-------|--------|-------|
| Unit Tests | ✅ Pass | 45/45 |
| E2E Tests | ✅ Pass | 12/12 |
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

## Failure Handling

If any check fails:

1. **Create issue list** in `validation/test-results.md`
2. **Route back to builders**:
   - Test failures → Technologists
   - Quality issues → Inquisitor suggestions
   - Security issues → STOP, notify immediately
3. **Re-run** `/build-spec` for fixes
4. **Re-run** `/validate-spec`

## Output

```
✅ Validation complete!

Spec: 2025-11-29-stripe-integration

Results:
├── Unit Tests: ✅ 45/45 passing
├── E2E Tests: ✅ 12/12 passing
├── Lint: ✅ No errors
├── Code Quality: ⚠️ 2 suggestions
└── Security: ✅ No vulnerabilities

Status: READY FOR APPROVAL

Next: Review and run /approve-spec @2025-11-29-stripe-integration
      Or /reject-spec @2025-11-29-stripe-integration "reason"
```

