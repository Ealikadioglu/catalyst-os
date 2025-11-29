# /reject-spec

Request changes to the implementation.

## Usage

```
/reject-spec @2025-11-29-stripe-integration "reason"
/reject-spec @2025-11-29-stripe-integration "UI doesn't match mockup"
```

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
| UI/UX issues | Shaper | `/build-spec` |
| API issues | Smith | `/build-spec` |
| Test failures | Enforcer | `/build-spec` |
| Quality issues | Inquisitor | `/validate-spec` |
| Security issues | Watcher | IMMEDIATE FIX |

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

## Output

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

## Tips

Be specific in rejection reasons:
- ❌ "Doesn't look right"
- ✅ "Button should be blue (#3B82F6) not gray"

- ❌ "API is slow"  
- ✅ "GET /subscriptions takes 2s, should be <200ms"

- ❌ "Tests are wrong"
- ✅ "Missing test for expired card scenario"

