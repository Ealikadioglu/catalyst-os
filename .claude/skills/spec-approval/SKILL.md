# Spec Approval

> **When to invoke:** When accepting an implementation and archiving the spec.
> **Invoked by:** `/approve-spec` command.

## Purpose

Final verification, git commit, spec archival, self-documentation (propagate learnings), and optional library extraction.

## Skills Referenced

- `verification-before-completion` — Final TDD compliance check
- `agent-delegation` — Scribe delegation for library extraction

## Prerequisites

- Validation must be complete
- `validation.md` must show all checks passed
- `handoff.md` must exist
- TDD compliance verified

## Workflow

### Phase 1: Final Verification

1. **TDD Compliance:** Verify tasks.md shows tests for all tasks
2. **Validation:** All checks passed in validation.md
3. **User Review:** handoff.md reviewed

If TDD not followed → BLOCK approval.

### Phase 2: Load Project Configuration

Read `.catalyst/main/project-config.yaml` for:
- `git.protected_branches`
- `git.branch_prefix`
- `repository_type` (monorepo or multi-repo)
- `specs.completed_path`

### Phase 3: Detect Changed Repositories

**Multi-repo:** Check each repo for changes.
**Monorepo:** Check root directory only.

### Phase 4: Branch Management

For each repository with changes:
1. Check current branch
2. If on protected branch → create feature branch (ask user for name)
3. If on feature branch → continue

### Phase 5: Git Commit

For each repository with changes:
1. Stage changes
2. Create structured commit message with TDD stats
3. Commit

### Phase 6: Archive Spec

Move spec to completed path:
```
.catalyst/specs/{slug}/ → .catalyst/specs/completed/{slug}/
```

Update spec.md status to COMPLETE.

### Phase 7: Self-Documentation

Propagate learnings from completed spec back to project docs:

1. **conventions.md** — Add patterns from `patterns_established`
2. **architecture.md** — Add key files from `key_files`
3. **concerns.md** — Mark resolved issues from `issues_resolved`

### Phase 8: Library Extraction (Optional)

Auto-detect reusable patterns from spec name/content. Ask user if spec should be added to pattern library. If yes, delegate to Scribe for extraction.

## Output

```
Spec approved and archived!

Branch: {branch-name}
Commits: {commit details}
Archived to: {completed path}

Self-Documentation:
- conventions.md: +X patterns
- architecture.md: +Y key files
- concerns.md: Z issues resolved

Library: {status}

Next: git push -u origin {branch-name}
```
