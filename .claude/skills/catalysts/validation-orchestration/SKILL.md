---
name: validation-orchestration
description: >
  Orchestrate the validation workflow for completed implementations. Use when
  /validate-spec command is invoked or when implementation needs quality verification.
agent: arbiter
---

# Validation Orchestration

Coordinate the validation workflow to ensure implementation quality.

## Process

1. **Verify prerequisites**
   - All tasks marked complete
   - Unit tests passing
   - No blocking issues

2. **Run E2E tests** (use `e2e-test-execution`)
   - Execute full test suite
   - Capture failures

3. **Check code quality** (use `lint-checking`, `code-review`)
   - Run linters
   - Review patterns

4. **Security scan** (use `dependency-audit`, `secret-scanning`)
   - Audit dependencies
   - Scan for secrets

5. **Produce validation report**
   - Compile results
   - Create validation/sign-off.md

## Failure Handling

```
If any check fails:
1. Document in validation/
2. Route back to build phase
3. Re-run after fixes
```

## Output

`validation/sign-off.md` with:
- All check results
- Overall status
- Recommendations
- Next steps
