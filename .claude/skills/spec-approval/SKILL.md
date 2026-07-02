# Spec Approval

> **When to invoke:** When accepting an implementation and archiving the spec.
> **Invoked by:** `/seal-spec` command.

## Purpose

Final verification, git commit, spec archival, self-documentation (propagate learnings), and optional library extraction.

## Skills Referenced

- `verification-before-completion` — Final TDD compliance check
- `agent-delegation` — Scribe delegation for library extraction

## Prerequisites — HARD GATES

> **This skill is the FINAL step in the spec lifecycle.** It runs ONLY after build and validation are complete.
> **Flow:** `/catalyze-spec` → `/forge-spec` → `/audit-spec` → **`/seal-spec`** (you are here)
>
> If the spec has not been built yet, STOP and tell the user to run `/forge-spec` first.
> If the spec has not been validated yet, STOP and tell the user to run `/audit-spec` first.

- `/forge-spec` must have been completed (tasks.md exists with completed tasks)
- Validation must be complete (`validation.md` must show all checks passed)
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

### Phase 7: Push & Pull Request

> **This phase is atomic — do NOT stop or ask for confirmation between push and PR creation.**
> If validation passed in Phase 1 and the commit succeeded in Phase 5, proceed straight through push → PR without pausing.
> Only halt if a git/gh command returns an error.

1. Read `git.development_branch` from `.catalyst/main/project-config.yaml` (e.g., `development`, `staging`)
2. Push the feature branch: `git push -u origin {branch-name}`
3. **Immediately** create a PR targeting the development branch — do not wait for user input:
   ```
   gh pr create --base {development_branch} --title "feat({scope}): {spec title}" --body "..."
   ```
4. Include spec summary, TDD stats, and file change counts in the PR body
5. Capture the returned PR URL for the final output

**Do not ask** "should I create a PR?" or "ready to push?" — the user already invoked `/seal-spec`, which is the explicit authorization for the full push + PR flow. Only pause if a command fails or the working tree is in an unexpected state.

### Phase 8: Self-Documentation

Propagate learnings from completed spec back to project docs:

1. **conventions.md** — Add patterns from `patterns_established`
2. **architecture.md** — Add key files from `key_files`
3. **concerns.md** — Mark resolved issues from `issues_resolved`

### Phase 9: Library Extraction (Optional)

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

PR: {pr-url}
```

## Board Sync (final step)

The spec just moved **Audited → Done (sealed)**. Load `spec-lifecycle-board` and run **Update the Board**: move the entry out of the board into the **Done** timeline in `roadmap.md`, re-resolve `▶ Next Up`, and regenerate `.catalyst/main/dashboard.html` (`generatedBy: "/seal-spec"`).
