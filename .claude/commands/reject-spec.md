# /reject-spec

Request changes to the implementation.

## Usage

```
/reject-spec @2025-11-29-stripe-integration "reason"
/reject-spec @2025-11-29-stripe-integration "UI doesn't match mockup"
/reject-spec @2025-11-29-stripe-integration "TDD not followed"
```

---

## TDD Violation Rejection

**If TDD was not followed, this is an automatic rejection reason:**

```
/reject-spec @spec-name "TDD not followed - tests written after code"
```

This routes directly back to `/build-spec` with instructions to:
1. Delete implementation code
2. Write tests first (Enforcer)
3. Verify tests fail
4. Then implement

---

## Workflow

### Phase 1: Document Rejection

1. Record rejection reason
2. Create issue in spec:

`validation/rejections.md`:
```markdown
# Rejection Log

## Rejection #1
**Date:** YYYY-MM-DD
**Reason:** UI doesn't match mockup
**Status:** Pending fix

### Requested Changes
- [ ] Align button placement with Figma design
- [ ] Use correct color scheme
- [ ] Add missing loading states
```

### Phase 2: Route to Appropriate Agent

Based on rejection reason:

| Issue Type | Route To | Command |
|------------|----------|---------|
| **TDD not followed** | Enforcer → Builders | `/build-spec` (start over) |
| Missing tests | Enforcer | `/build-spec` |
| Test failures | Enforcer + Builders | `/build-spec` |
| UI/UX issues | Shaper | `/build-spec` |
| API issues | Smith | `/build-spec` |
| Quality issues | Inquisitor | `/validate-spec` |
| Security issues | Watcher | IMMEDIATE FIX |

### TDD Violation Handling

If rejection reason is TDD-related:

```markdown
## Rejection #X - TDD VIOLATION
**Date:** YYYY-MM-DD
**Reason:** TDD not followed
**Status:** REQUIRES RESTART

### Issue
Implementation was done without tests or tests were written after code.

### Required Actions
1. ❌ Current implementation must be reviewed
2. ✅ Write ALL tests first (Enforcer)
3. ✅ Verify tests FAIL (red phase)
4. ✅ Then implement to make tests pass (green phase)
5. ✅ Document TDD compliance in test-manifest.md

### Note
TDD is mandatory in this project. Code written without failing tests
first does not follow our development standards.
```

### Phase 3: Update Progress

Update `implementation/progress.md`:
```markdown
## Status: CHANGES REQUESTED

## Rejection Feedback
- UI doesn't match mockup (see validation/rejections.md)

## Action Items
- [ ] Review Figma designs
- [ ] Update PricingPage component
- [ ] Re-run validation
```

For TDD violations:
```markdown
## Status: ⚠️ TDD VIOLATION - RESTART REQUIRED

## Rejection Feedback
- TDD process was not followed
- Tests were written after implementation

## Action Items
- [ ] Review test-first development process
- [ ] Write failing tests for all features
- [ ] Verify red phase (all tests fail)
- [ ] Implement features
- [ ] Verify green phase (all tests pass)
- [ ] Document in test-manifest.md
```

## Output

### Standard Rejection
```
⚠️ Spec rejected - changes requested

Spec: 2025-11-29-stripe-integration
Reason: UI doesn't match mockup

Changes needed:
├── [ ] Align button placement with Figma design
├── [ ] Use correct color scheme
└── [ ] Add missing loading states

Next: Fix issues and run /build-spec @2025-11-29-stripe-integration
      Then /validate-spec @2025-11-29-stripe-integration
```

### TDD Violation Rejection
```
🚫 Spec rejected - TDD VIOLATION

Spec: 2025-11-29-stripe-integration
Reason: TDD not followed - tests written after code

This is a critical process violation. TDD is mandatory.

Required process:
1. Enforcer writes ALL tests first
2. Verify all tests FAIL (red phase)
3. Builders implement features
4. Verify all tests PASS (green phase)
5. Document in test-manifest.md

Next: Run /build-spec @2025-11-29-stripe-integration
      Follow TDD process strictly this time.
```

## Tips

Be specific in rejection reasons:
- ❌ "Doesn't look right"
- ✅ "Button should be blue (#3B82F6) not gray"

- ❌ "API is slow"  
- ✅ "GET /subscriptions takes 2s, should be <200ms"

- ❌ "Tests are wrong"
- ✅ "Missing test for expired card scenario"

- ❌ "TDD not done"
- ✅ "TDD not followed - test-manifest.md missing, tests written after implementation"
