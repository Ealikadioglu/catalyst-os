---
name: code-review
description: >
  Review code for quality, patterns, and best practices. TRIGGERS: after
  implementation, before merge/commit, /validate-spec command, quality gate check.
---

# Code Review

Review code for quality and patterns.

## When to Use

- After implementation
- Before merge/commit
- Quality gate check

## Review Checklist

### Code Quality
- [ ] Clear naming
- [ ] DRY compliance
- [ ] Error handling
- [ ] Type safety

### Patterns
- [ ] Project conventions
- [ ] Proper abstraction
- [ ] No circular deps

### Security
- [ ] Input validation
- [ ] No hardcoded secrets

## Feedback Format

### 🔴 Critical (Must Fix)
```markdown
**File**: src/api/users.ts:45
**Issue**: SQL injection vulnerability
**Fix**: Use parameterized query
```

### 🟡 Important (Should Fix)
```markdown
**File**: src/services/stripe.ts:23
**Issue**: Missing error handling
```

### 🟢 Suggestion
```markdown
**File**: src/utils/pricing.ts:12
**Suggestion**: Extract constant
```

## Checklist

- [ ] Critical issues found
- [ ] Actionable feedback
- [ ] No bikeshedding
