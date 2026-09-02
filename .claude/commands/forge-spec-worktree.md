# /forge-spec-worktree

**Unattended pipeline**: forge → audit → seal, end to end, in an isolated git worktree, with every decision resolved automatically. Start it, walk away, come back to a PR.

> **Lifecycle position:** `/catalyze-spec` → **`/forge-spec-worktree`** (= `/forge-spec` + `/audit-spec` + `/seal-spec`) → done
>
> Use `/forge-spec` instead when you want to stay in the loop between phases.

## Usage

```
/forge-spec-worktree @2025-11-29-stripe-integration
```

## Pre-computed Context

```bash
echo "=== BRANCH ===" && git branch --show-current
echo "=== STATUS ===" && git status --short
echo "=== WORKTREES ===" && git worktree list
echo "=== SPEC FILES ===" && ls .catalyst/specs/*$ARGUMENTS*/ 2>/dev/null || echo "No spec found for: $ARGUMENTS"
echo "=== SPEC FRONTMATTER ===" && head -30 .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No spec.md"
echo "=== OPEN QUESTIONS ===" && grep -n -A 8 -i "open questions" .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "None"
echo "=== TASKS EXIST? ===" && head -5 .catalyst/specs/*$ARGUMENTS*/tasks.md 2>/dev/null || echo "No tasks.md yet (fresh build)"
echo "=== PROJECT CONFIG ===" && cat .catalyst/main/project-config.yaml 2>/dev/null || echo "No project config"
```

---

**Invoke skills, in order, without returning to the user between them:**

1. `autopilot` — load FIRST; it governs every decision for the rest of the run
2. `build-orchestration` with `--worktree` (forge)
3. `spec-validation` (audit) — on FAIL, one remediation pass, then re-audit
4. `spec-approval` (seal) — commit, archive, push, PR

**Orchestrator:** Forge-Master runs the whole chain. It hands off to Arbiter for the audit and runs the seal itself.

**Process skills used:** `test-driven-development`, `agent-delegation`, `verification-before-completion`, `systematic-debugging`

## Execution Mode

Invoking this command is the user's explicit authorization for the **entire** chain, including `git push` and `gh pr create`. There is no confirmation step anywhere in the run. The only things that end the run early are the **halt conditions** listed in the `autopilot` skill (three failed attempts on one task, a second audit failure, a git/gh error, a secret in the diff, or a destructive database change).

When it halts, it writes `## Autopilot Halt` to the spec's `handoff.md` with the exact command to resume, and reports. When it finishes, it reports the PR URL, the worktree path, and the `## Autopilot Decisions` table.
