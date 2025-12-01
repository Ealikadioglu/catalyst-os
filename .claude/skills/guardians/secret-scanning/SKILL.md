---
name: secret-scanning
description: >
  Scan code for exposed secrets and credentials. TRIGGERS: pre-commit checks,
  PR reviews, /validate-spec command, security audits.
---

# Secret Scanning

Scan for exposed secrets.

## When to Use

- Pre-commit checks
- PR reviews
- Security audits

## Scanning Tools

```bash
# gitleaks
gitleaks detect

# truffleHog
trufflehog git file://.

# detect-secrets
detect-secrets scan
```

## Common Patterns

```regex
# AWS Access Key
AKIA[0-9A-Z]{16}

# GitHub Token
ghp_[A-Za-z0-9]{36}

# Generic API Key
[Aa]pi[_-]?[Kk]ey.*['"][A-Za-z0-9]{20,}['"]
```

## Response Process

If secret found:
1. Revoke immediately
2. Remove from code
3. Use environment variables
4. Audit access

## Output Format

```markdown
## Secret Scan Report

### Findings

#### 🔴 Critical
**File**: src/config/stripe.ts:15
**Type**: Stripe API Key
**Action**: Revoke and rotate
```

## Checklist

- [ ] No secrets in code
- [ ] .gitignore updated
- [ ] Pre-commit hook active
