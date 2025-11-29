---
name: lint-checking
description: >
  Run linters and formatters to ensure code quality. Use when checking
  code style compliance or validating code before commit.
agent: inquisitor
---

# Lint Checking

Run linters and formatters.

## When to Use

- Pre-commit checks
- Code style validation
- Quality gates

## Common Commands

```bash
# JavaScript/TypeScript
npx eslint . --ext .js,.jsx,.ts,.tsx
npx eslint . --fix
npx prettier --check .
npx prettier --write .

# Python
ruff check .
ruff check . --fix
black --check .
```

## Fix Process

1. Run linter
2. Review errors
3. Auto-fix where possible
4. Manual fix remaining
5. Verify clean

## Checklist

- [ ] Linter passes
- [ ] Formatter passes
- [ ] No warnings
- [ ] Pre-commit works
