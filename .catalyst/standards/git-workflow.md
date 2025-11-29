# Git Workflow

Branch management and commit conventions.

## Branch Strategy

### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch (optional)

### Feature Branches
```
feature/{spec-name}
feature/2025-11-29-stripe-integration
```

### Other Branches
```
fix/{issue-number}-description
hotfix/{issue-number}-description
refactor/{description}
```

## Commit Messages

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting |
| `refactor` | Code restructure |
| `test` | Tests |
| `chore` | Maintenance |

### Examples

```bash
# Feature
feat(subscriptions): add stripe checkout integration

# Fix
fix(auth): resolve token refresh race condition

# With body
feat(pricing): implement dynamic pricing page

- Add plan comparison table
- Implement feature tooltips
- Add annual/monthly toggle

Spec: 2025-11-29-pricing
```

## Workflow

### Starting Work

```bash
# Update main
git checkout main
git pull

# Create feature branch
git checkout -b feature/2025-11-29-stripe-integration
```

### During Development

```bash
# Commit often
git add .
git commit -m "feat(stripe): add subscription service"

# Keep updated with main
git fetch origin
git rebase origin/main
```

### Completing Work

```bash
# Ensure tests pass
npm test

# Push branch
git push origin feature/2025-11-29-stripe-integration

# Create PR or merge
```

## Code Review

### PR Requirements
- [ ] Tests pass
- [ ] Linting clean
- [ ] Spec reference in description
- [ ] Changes documented

### PR Template

```markdown
## Description
Brief description of changes

## Spec Reference
.catalyst/specs/2025-11-29-stripe-integration

## Changes
- Added subscription service
- Created checkout flow
- Added webhook handlers

## Testing
- [ ] Unit tests added
- [ ] E2E tests added
- [ ] Manual testing done

## Screenshots
(if UI changes)
```

## Merge Strategy

### Squash Merge (Recommended)
- Clean history
- One commit per feature
- Easy revert

### Merge Commit
- Preserve full history
- See individual commits
- More verbose

## Tagging Releases

```bash
# Semantic versioning
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

## Emergency Hotfix

```bash
# Branch from main
git checkout main
git checkout -b hotfix/critical-auth-fix

# Fix, test, commit
git commit -m "fix(auth): patch critical vulnerability"

# Merge directly to main
git checkout main
git merge hotfix/critical-auth-fix
git push
```

## Don'ts

- ❌ Commit directly to main
- ❌ Force push to shared branches
- ❌ Commit secrets or credentials
- ❌ Large commits without description
- ❌ Merge without tests passing

---

*Adjust branch naming and merge strategy for your team.*

