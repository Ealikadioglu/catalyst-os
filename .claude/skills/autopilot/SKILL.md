---
name: autopilot
description: Run an unattended chain end to end, taking the recommended option at every decision, logging it, and never stopping to ask. Use for /forge-spec-worktree or whenever the user says the run is AFK, overnight, or should not stop for questions.
---

# Autopilot

> **When to invoke:** `/forge-spec-worktree`, or whenever the user says the run should be unattended ("AFK", "don't ask me", "run it to the end", "overnight").
> **Used by:** Forge-Master (owner of the chain), Arbiter, and every builder agent spawned during the run.
> **Type:** Rigid.

## Purpose

Run **forge → audit → seal** to completion with no human in the loop. Every fork in the road that would normally end the turn with a question is resolved by picking the **recommended** option and writing it down. The user's involvement is exactly two moments: starting the run and reading the report.

## The Iron Laws

```
1. NEVER end a turn to ask. Decide, log, continue.
2. ALWAYS pick the option marked "Recommended". If none is marked, mark one (rule below), then pick it.
3. EVERY decision is logged to handoff.md ## Autopilot Decisions before the work continues.
4. HALT only on the listed halt conditions. Nothing else stops the chain.
5. A halt leaves the tree resumable: state written, worktree intact, resume command printed.
```

## The Chain

```
PHASE 0  Setup       build-orchestration Phase 0 with --worktree
                     Mark the run: append "**Mode:** AUTOPILOT" to handoff.md
                     Every agent prompt starts with the line: AUTOPILOT — do not stop to ask; see autopilot skill.
PHASE 1  Forge       build-orchestration (direct mode or full DAG — the size lane decides)
                     GATE: RED commit exists, GREEN commit exists, all tests pass
PHASE 2  Audit       spec-validation via Arbiter
                     PASS → Phase 3
                     FAIL → ONE remediation pass: fix every listed issue (builders, or directly in direct mode),
                            re-run the failing checks, re-run the audit
                     FAIL again → HALT (before seal)
PHASE 3  Seal        spec-approval: commit → archive → push → PR, no pauses
PHASE 4  Board       node .catalyst/bin/board.js --by "/forge-spec-worktree"
REPORT               PR URL, worktree path, decisions table, halt (if any)
```

Do not return to the user between phases. Do not say "waiting on X" and end the turn — read the result and continue. Context checkpoints ("good time to compact") are **not** emitted in autopilot; write `tasks.md ## Current Session` silently instead.

## Decision Policy

When a skill, agent, or your own judgment presents options ("STOP and Ask", "Present options with tradeoffs", "Ask user if…", "create feature branch (ask user for name)"):

1. **If an option is marked Recommended** → take it.
2. **If none is marked** → choose one by this precedence, then treat it as recommended:
   1. What `spec.md` says (requirements, key decisions, patterns)
   2. What `.catalyst/main/conventions.md` and `tech-stack.md` say
   3. What the existing codebase already does (follow the dominant pattern)
   4. The option with the **smallest scope** (fewest files, no new dependency, no migration)
3. **Log it** in `handoff.md`:

```markdown
## Autopilot Decisions

| # | Phase | Decision point | Chosen | Alternatives | Why |
|---|-------|----------------|--------|--------------|-----|
| 1 | forge | State management library not specified | Riverpod | Bloc | Already used in 14 of 15 screens |
```

4. Continue **in the same turn**.

Standing defaults (no table row needed unless overridden):

| Question | Autopilot answer |
|----------|------------------|
| Branch name on a protected branch | `{branch_prefix}/{spec-slug}` — the worktree branch |
| "Add to pattern library?" | Yes if `spec-structure.yaml` keyword detection matches, else No |
| Test evidence tier not stated in the task row | `rg` (red-then-green) |
| Compact now? | Never asked; write Current Session and continue |
| Spec says X, codebase uses Y | Follow the spec; log it. If the spec is silent, follow the codebase |

## Halt Conditions — the ONLY reasons to stop

| Condition | Why it halts |
|-----------|-------------|
| Same task fails 3 attempts (agent-delegation escalation cap) | The problem is architectural; a 4th blind try wastes the run |
| Audit fails a second time after remediation | Shipping it would need judgment the spec does not provide |
| `git` or `gh` returns an error | Never work around VCS/remote failures unattended |
| A secret, key, or credential appears in the diff | Security rule; also never commit it |
| The work requires a destructive DB change (drop table/column, truncating migration) | Irreversible; a human signs off |
| Spec has unresolved **Open Questions** at the start | Cannot choose a "recommended" answer to a question the author left open |

On halt:

```markdown
## Autopilot Halt

**Phase:** audit (2nd failure)
**Where:** .catalyst/worktrees/2026-09-02-retry (branch feat/2026-09-02-retry)
**Done so far:** RED a1b2c3d, GREEN e4f5g6h, audit run twice
**Blocking:** Watcher — unscoped write in reapStuckClaims() (see validation.md)
**Resume:** fix, then `/audit-spec @2026-09-02-retry` from inside the worktree, then `/seal-spec @2026-09-02-retry`
```

Then report, with the decisions table so far, and end the turn. **Never** `git worktree remove`, `git push --force`, or merge on halt.

## Escalation replaces "ask"

`agent-delegation`'s escalation protocol ends with "ask the user". In autopilot, attempt #3 failing means **HALT** with the halt block above, not a question. Attempts #1 and #2 are unchanged.

## Report Format

```
Autopilot complete: {spec-slug}

Mode:      direct | full DAG ({N} tasks, {M} agents)
Commits:   RED {hash} · GREEN {hash} · seal {hash}
Audit:     PASS (first run | after 1 remediation pass)
PR:        {url}  (base: {development_branch})
Worktree:  {path}   — remove with: git worktree remove {path}
Board:     {board.js summary line}

Decisions ({count}):
| # | Phase | Decision point | Chosen | Alternatives | Why |
|---|-------|----------------|--------|--------------|-----|
{every row of handoff.md ## Autopilot Decisions, verbatim}
```

The decisions table goes in the report itself, every row, not a pointer to `handoff.md`: the user was away while each choice was made, and this is where they review them. Zero decisions → `Decisions: none`.

## Rationalization Prevention

| Thought | Reality |
|---------|---------|
| "This one is important, I should check with the user" | The user chose autopilot to not be checked with. Pick recommended, log, continue. |
| "There is no recommended option" | Then rule 2 makes one. Precedence: spec → conventions → codebase → smallest scope. |
| "I'll just report progress and wait" | Ending the turn IS stopping. Read the result and continue. |
| "The audit failed, better stop now" | One remediation pass is part of the chain. Halt only on the second failure. |
| "It's safer to skip the PR" | `/forge-spec-worktree` authorizes the PR. Skipping it is stopping short. |
