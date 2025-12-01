# /approve-spec

Accept the implementation and archive the spec.

## Usage

```
/approve-spec @2025-11-29-stripe-integration
/approve-spec @2025-11-29-stripe-integration "Great work!"
```

## Prerequisites

- Validation must be complete
- `validation/sign-off.md` must show "READY FOR APPROVAL"
- **TDD compliance must be verified** (test-manifest.md exists)
- User must have manually tested (recommended)

---

## ⚠️ TDD COMPLIANCE REQUIRED

```
╔═══════════════════════════════════════════════════════════════════╗
║  Before approving, verify TDD was followed throughout:            ║
║                                                                    ║
║  - [ ] test-manifest.md exists and shows red→green transition    ║
║  - [ ] validation/sign-off.md confirms TDD compliance            ║
║  - [ ] All tests pass                                             ║
║                                                                    ║
║  🚫 DO NOT APPROVE if TDD was skipped                             ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## Workflow

### Phase 1: Final Verification

1. **TDD Compliance Check:**
   - Read `implementation/test-manifest.md`
   - Verify red phase was completed (tests failed first)
   - Verify green phase achieved (all tests pass now)
   - Check `validation/sign-off.md` shows TDD compliance ✅

2. **Validation Check:**
   - Verify all validation checks passed
   - Confirm no blocking issues

3. **User Review:**
   - Check user has reviewed
   - Note any user feedback

**If TDD was not followed:**
```
❌ APPROVAL BLOCKED

TDD compliance not verified. Cannot approve.

Action: Return to /build-spec and follow TDD process.
        Then /validate-spec, then /approve-spec.
```

### Phase 2: Git Commit (if configured)

1. Stage all changes from the spec
2. Create structured commit message with TDD stats:
   ```
   feat(stripe): implement subscription integration

   TDD Compliance: ✅ Verified
   - Tests written first: ✓
   - Red phase: 45 tests failed initially
   - Green phase: 45 tests pass now

   Implementation:
   - Add subscription schema and migrations
   - Create Stripe service wrapper
   - Implement subscription API endpoints
   - Add pricing page and management UI

   Spec: 2025-11-29-stripe-integration
   Tasks: 7 completed
   Tests: 45 unit, 12 e2e (57 total)
   Coverage: 87%
   ```

### Phase 3: Archive Spec

Move spec to completed:
```
.catalyst/specs/2025-11-29-stripe-integration/
→ .catalyst/specs/completed/2025-11-29-stripe-integration/
```

Add completion summary to spec:
```markdown
---
status: completed
completed_date: YYYY-MM-DD
commit: abc123 (if git enabled)
tdd_compliant: true
tests_written_first: true
total_tests: 57
---
```

### Phase 4: Update Documentation (Scribe)

1. Update relevant docs if needed
2. Add feature to README if significant
3. Update CHANGELOG if present

## Output

```
✅ Spec approved and archived!

Spec: 2025-11-29-stripe-integration
Status: COMPLETED

TDD Compliance: ✅ VERIFIED
├── Tests written first: ✓
├── Red phase: 45 tests failed initially
├── Green phase: 45 tests pass now
└── Coverage: 87%

Commit: feat(stripe): implement subscription integration

Archived to: .catalyst/specs/completed/

Summary:
├── Requirements: 8 fulfilled
├── Tasks: 7 completed
├── Tests: 57 total (45 unit, 12 e2e)
└── Duration: 3 sessions

🎉 Feature ready for production!
```
