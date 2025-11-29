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
- User must have manually tested (recommended)

## Workflow

### Phase 1: Final Verification

1. Verify all validation checks passed
2. Confirm no blocking issues
3. Check user has reviewed

### Phase 2: Git Commit (if configured)

1. Stage all changes from the spec
2. Create structured commit message:
   ```
   feat(stripe): implement subscription integration

   - Add subscription schema and migrations
   - Create Stripe service wrapper
   - Implement subscription API endpoints
   - Add pricing page and management UI

   Spec: 2025-11-29-stripe-integration
   Tasks: 7 completed
   Tests: 45 unit, 12 e2e
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
Commit: feat(stripe): implement subscription integration

Archived to: .catalyst/specs/completed/

Summary:
├── Requirements: 8 fulfilled
├── Tasks: 7 completed
├── Tests: 57 total (45 unit, 12 e2e)
└── Duration: 3 sessions

🎉 Feature ready for production!
```

