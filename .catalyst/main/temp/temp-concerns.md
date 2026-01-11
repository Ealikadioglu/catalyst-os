# Concerns

> Analysis Date: YYYY-MM-DD
> Update when: Issues fixed, new concerns discovered

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | - |
| High | 0 | - |
| Medium | 0 | - |
| Low | 0 | - |

---

## Critical Issues

Issues that could cause data loss, security breaches, or system failures.

### [CRIT-001] Issue Title

**Location**: `src/path/to/file.ts:123`
**Severity**: Critical
**Type**: Security / Data Loss / System Failure

**Description**:
What the issue is and why it's critical.

**Evidence**:
```typescript
// Code snippet showing the issue
```

**Impact**:
What could happen if not addressed.

**Recommended Fix**:
How to resolve the issue.

**Safe Modification**: No - requires careful migration

---

## High Priority

Issues that affect functionality or could become critical.

### [HIGH-001] Issue Title

**Location**: `src/path/to/file.ts:45`
**Severity**: High
**Type**: Bug / Performance / Tech Debt

**Description**:
Clear description of the issue.

**Evidence**:
```typescript
// Code snippet or metrics
```

**Impact**:
How this affects users or system.

**Recommended Fix**:
Steps to resolve.

**Safe Modification**: Yes - isolated change

---

## Medium Priority

Issues that should be addressed but aren't urgent.

### [MED-001] N+1 Query in User List

**Location**: `src/api/users/route.ts:34`
**Severity**: Medium
**Type**: Performance

**Description**:
User list endpoint loads related data in a loop instead of using a join.

**Evidence**:
```typescript
// Current: N+1 queries
const users = await db.user.findMany();
for (const user of users) {
  user.profile = await db.profile.findUnique({ where: { userId: user.id } });
}

// Should be: Single query with include
const users = await db.user.findMany({
  include: { profile: true }
});
```

**Impact**:
~50ms per user → 5s for 100 users

**Recommended Fix**:
Use Prisma `include` for eager loading.

**Safe Modification**: Yes - same result, better performance

---

## Low Priority

Nice-to-fix items, minor tech debt.

### [LOW-001] Issue Title

**Location**: `src/path/to/file.ts`
**Severity**: Low
**Type**: Tech Debt / Code Quality

**Description**:
Brief description.

**Recommended Fix**:
What to do when time permits.

---

## Tech Debt Inventory

Accumulated shortcuts and workarounds.

| ID | Location | Description | Added | Effort |
|----|----------|-------------|-------|--------|
| TD-001 | `src/lib/legacy.ts` | Old auth system still in use | 2024-06 | High |
| TD-002 | `src/utils/helpers.ts` | Duplicate utility functions | 2024-08 | Low |

---

## Fragile Areas

Code sections that break easily or have poor test coverage.

### `src/services/payment.ts`

**Why Fragile**:
- Complex state machine with many edge cases
- External API dependency with inconsistent responses
- Only 40% test coverage

**Safe Modification Guide**:
1. Always test with sandbox API
2. Check all state transitions
3. Verify webhook handling

**Recent Breakages**:
- 2024-12-01: Webhook signature validation failed after API update
- 2024-11-15: Race condition in concurrent payments

---

## Known Bugs

Documented issues not yet fixed.

| ID | Description | Location | Workaround | Priority |
|----|-------------|----------|------------|----------|
| BUG-001 | Login redirect fails on Safari | `src/lib/auth.ts` | Use Chrome | Medium |
| BUG-002 | Date picker shows wrong timezone | `src/components/DatePicker.tsx` | Manual adjustment | Low |

---

## Security Notes

Security-related observations (no secrets!).

| Area | Status | Notes |
|------|--------|-------|
| Input validation | Partial | Missing on admin endpoints |
| Auth | Good | JWT with refresh tokens |
| CORS | Good | Configured for known origins |
| Rate limiting | Missing | Needed on public endpoints |
| Secrets management | Good | Using environment variables |

**Action Items**:
- [ ] Add validation middleware to admin routes
- [ ] Implement rate limiting on `/api/auth/*`

---

## Flaky Tests

Tests that fail intermittently.

| Test | Location | Failure Rate | Cause |
|------|----------|--------------|-------|
| `should handle concurrent requests` | `tests/api/users.test.ts:45` | ~10% | Race condition in mock |
| `should timeout after 5s` | `tests/services/external.test.ts:78` | ~5% | CI timing variations |

---

## Dependencies to Watch

Packages that need attention.

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| react | 18.2.0 | 19.0.0 | Major upgrade, breaking changes |
| prisma | 5.0.0 | 5.8.0 | Security patches available |
| next | 14.0.0 | 14.1.0 | Recommended update |

---

## Improvement Opportunities

Not bugs, but areas that could be better.

| Area | Current State | Ideal State | Effort |
|------|---------------|-------------|--------|
| Error messages | Generic | User-friendly with actions | Medium |
| Loading states | Spinner only | Skeleton screens | Low |
| Caching | None | Redis for hot data | High |

---

*Last updated: YYYY-MM-DD*
