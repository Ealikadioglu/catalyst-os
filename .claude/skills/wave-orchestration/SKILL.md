---
name: wave-orchestration
description: Run one roadmap wave unattended, spec by spec in order — brief, catalyze in pi, gate the spec, forge in pi, gate the PR, merge into the autopilot branch, pull, next — using herdr tabs and pi agents. Use for /forge-wave.
---

# Wave Orchestration

> **When to invoke:** `/forge-wave <id>`.
> **Requires:** herdr (the session runs inside it) and pi with Catalyst installed in `.pi/`. Load the `herdr` skill for its CLI and the `autopilot` skill for its decision policy.
> **Type:** Rigid.

## Purpose

A wave is an ordered list of specs with one goal (`## 🌊 Waves` in `roadmap.md`). This skill builds them **one at a time**. Each spec is catalyzed only after the previous one is merged, so it is shaped against the code that spec changed. Parallel catalyze or forge was tried and dropped: spec five is wrong when it was shaped before specs one to four landed.

Two roles:

| Who | Does | Never does |
|-----|------|-----------|
| You (orchestrator) | Read the wave, write each spec's brief, gate the spec, gate the PR, merge, keep the wave file | Write feature code (a fix of a few lines at most) |
| pi (one tab per spec) | `/catalyze-spec --from`, `/forge-spec-worktree`, PR fixes | Decide scope, step outside the spec |

Your tokens go to three places only: the brief, the spec gate, the PR gate.

## The Iron Laws

```
1. ONE spec at a time. The next spec is catalyzed only after the previous PR is merged and pulled.
2. NEVER merge into anything but autopilot.branch.
3. NEVER trust pi's "tests pass". Run them yourself in the worktree.
4. The wave file is your memory. Write it after every stage; a new session resumes from it.
5. Stop only on a preflight failure or a stop condition below. Everything else: decide, log, continue.
```

## Preflight — fail before starting

Check all of these from the pre-computed context. On the first failure, print one line naming it and the fix, and stop. Start nothing.

| Check | Fails when |
|-------|-----------|
| Wave | `board.js --wave <id>` exits 1, or lists an `UNKNOWN` slug (fix the wave in `/plan-project`) |
| herdr | `HERDR_ENV` is not `1`, or `herdr` is not on PATH |
| pi | `pi` is not on PATH, or `.pi/agents` is missing (`npx catalyst-os --harness pi`) |
| gh | `gh auth status` fails |
| Branch | `autopilot.branch` is empty, equals `git.development_branch`, or is in `git.protected_branches` |
| Merge | `autopilot.auto_merge` is not `true` — a wave cannot advance without merging |
| Checkout | Each repo the wave touches is not on `autopilot.branch`, or has uncommitted changes outside `.catalyst/`. In a multirepo, check every member repo. |

Then `git pull` each repo on `autopilot.branch`.

## State: `.catalyst/waves/wave-<id>.md`

Create it on the first run, in English. If it exists, read the status table and resume from the first row that is not `merged`, `halted`, or `skipped`.

```markdown
# Wave <id> — <goal>

Base: <autopilot.branch> · Started: <date>

## Spec: <slug>
<brief — see Stage 1>

## Orchestration status
| # | spec | stage | tab | PR | rounds | note |
|---|------|-------|-----|----|--------|------|
| 1 | shipment-sorting | merged | pi-shipment-sorting | api#12 | spec 1 / pr 0 | |

## Morning report
```

`stage`: `briefed → catalyzed → go | no-go-patched → forging → pr-open → merged | halted | skipped`

## The Loop

Run `node .catalyst/bin/board.js --wave <id>`. Take the first spec in order that is not done, not `halted`/`skipped` in the wave file, and does not wait on a `halted`/`skipped` spec (mark those `skipped`, reason: "depends on <slug>"). None left → **Morning report**.

Its board state decides where it enters: `backlog` → Stage 1, `planned` → Stage 3, `in progress`/`audited` → a previous forge stopped; mark it `halted` with the worktree path and move on.

### Stage 1 — Brief (you)

Read the spec's Backlog entry (Scope, Done when, seed prompt), the wave goal, the `handoff.md` of the specs this wave already merged, and the code they touched **on the pulled branch**. Append `## Spec: <slug>` to the wave file:

- **Catalyze as:** `<slug>` — the folder must end with it
- **Goal:** one or two sentences
- **Acceptance:** the behaviours that prove it, as GIVEN/WHEN/THEN lines (they become the spec's ACs)
- **Where:** repo(s), and the existing files and patterns to follow, by path
- **Non-goals:** what belongs to a later spec in this wave

The brief is where the quality of the run is decided. pi builds what it is told and nothing else.

### Stage 2 — Catalyze (pi, new tab)

Every spec gets a fresh tab and a fresh pi, so no context leaks between specs:

```bash
herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$PWD" --label "pi-<slug>" --no-focus   # → .result.root_pane.pane_id
herdr agent start "pi-<slug>" --kind pi --pane <root_pane_id>
herdr agent prompt "pi-<slug>" '/catalyze-spec "<title>" --from <abs path to wave file> — use only the section "Spec: <slug>"' --wait
```

Run every `--wait` prompt in the background with no timeout; you are woken when it returns. Do not poll.

If pi stops with a question instead of running, answer with the full command: `Run UNATTENDED mode exactly as if invoked with: /catalyze-spec "…" --from … Ask me nothing further.`

Confirm `.catalyst/specs/*-<slug>/spec.md` exists. Wrong folder name → rename it to `YYYY-MM-DD-<slug>`.

### Stage 3 — Spec gate (you): GO / NO-GO

Read `spec.md` against the brief and the code:

- Every Acceptance line of the brief is an AC scenario; every requirement has at least one AC.
- Scope is no wider than the brief; no non-goal crept in.
- Repos, files, and APIs it names exist on the pulled branch (pi invents components and CSS classes).
- Schema, tenant, and PII boundaries agree with `project-config.yaml` and `architecture.md`.
- Open Questions is empty, or every entry is closed by a logged autopilot decision.

**GO** → Stage 4. **NO-GO** → patch `spec.md` yourself, add one line to `handoff.md` (`Wave gate: <what changed>`), then Stage 4. Never re-catalyze.

If `.catalyst/` is tracked by git in this project, commit the spec folder to `autopilot.branch` and push before forging, so the worktree has it. It usually is git-ignored; then skip this.

### Stage 4 — Forge (pi, same tab)

```bash
herdr agent prompt "pi-<slug>" '/new' --wait            # only if pi's context is near full
herdr agent prompt "pi-<slug>" '/forge-spec-worktree <YYYY-MM-DD-slug>' --wait
```

Pass the folder name bare, with no `@`: the command globs on it.

When it returns: `## Autopilot Halt` in the spec's `handoff.md` → `halted` (copy its resume command into the note), next spec. Otherwise find the PR: `gh pr list --base <autopilot.branch> --head <branch_prefix>/<folder> --state open` (in each member repo for a multirepo). Read pi's screen only when neither exists: `herdr agent read "pi-<slug>" --source recent-unwrapped --lines 80`.

### Stage 5 — PR gate (subagent): GO / NO-GO

Give the review to a subagent so the diff stays out of your context; only the verdict comes back. Its checklist:

- Run the tests in the worktree yourself. CI must be green.
- Test diff on its own: deleted or skipped tests, weakened assertions, tests that mock the thing under test.
- Every AC of the spec has a test carrying its ID.
- The diff stays inside the spec's scope.
- Security: secrets, tenant isolation, PII, SQL.
- `.claude/rules/`: comment budget, commit format.

**GO** → confirm the PR base is `autopilot.branch`, `gh pr merge <n>` with the repo's merge method → `merged`.
**NO-GO** → `gh pr review <n> --request-changes --body "<findings>"`, then:

```bash
herdr agent prompt "pi-<slug>" 'Fix PR #<n> in <repo>: apply every review comment, push to the same branch.' --wait
```

At most **two** fix rounds. Still NO-GO: fix it yourself if it is a few lines, otherwise `halted`.

### Stage 6 — Advance

`git pull` every repo on `autopilot.branch`, run `node .catalyst/bin/board.js --by "/forge-wave <id>"`, update the status row, back to *The Loop*.

## Stop conditions

| Situation | Do |
|-----------|----|
| pi asks something | `herdr agent read`. Inside the brief → answer it. Outside → `skipped`, next spec |
| `## Autopilot Halt` | `halted`, resume command in the note |
| Two fix rounds and still NO-GO | `halted` |
| Merge conflict | `halted` — serial runs should not produce one, so something else changed the branch |
| Deleting a branch, `git stash`, touching changes you did not make | Do not. Note it for the morning |
| A secret, a destructive DB change, or any branch other than `autopilot.branch` | **Stop the run.** Do not merge. Top line of the morning report |

## Morning report

Append to the wave file, then print it:

- Merged: each spec with its PR link
- Halted / skipped: each with the reason and the resume command
- NO-GO patches: what the spec gate changed, one line each
- For the human: what to check on `autopilot.branch` before promoting it, ranked

## Board Sync (final step)

```bash
node .catalyst/bin/board.js --by "/forge-wave <id>"
```
Paste its 4-line summary into your report. If it prints `skipped — no roadmap.md`, say so in one line and move on.
