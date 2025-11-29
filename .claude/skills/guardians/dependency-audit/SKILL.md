---
name: dependency-audit
description: >
  Audit dependencies for security vulnerabilities and license compliance.
  Use when checking for vulnerable packages or validating licenses.
agent: watcher
---

# Dependency Audit

Audit dependencies for security.

## When to Use

- Security checks
- Before deployment
- Regular maintenance

## Audit Commands

```bash
# npm
npm audit
npm audit fix

# pip
pip-audit
safety check

# snyk
snyk test
```

## Severity Response

| Level | Action |
|-------|--------|
| Critical | Fix immediately |
| High | Fix within 24h |
| Medium | Fix within week |
| Low | Fix when convenient |

## Output Format

```markdown
## Dependency Audit Report

### Vulnerabilities Found

#### 🔴 Critical (1)
**Package**: lodash@4.17.20
**Issue**: Prototype pollution
**Fix**: `npm update lodash`

### License Summary
- MIT: 180 packages
- Apache-2.0: 42 packages
```

## Checklist

- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities
- [ ] Licenses compatible
