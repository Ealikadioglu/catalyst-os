---
name: build-orchestration
description: Implement a specification under strict TDD, coordinating builder agents in dependency order across the task DAG. Use for /forge-spec and /forge-spec-worktree.
---

# Build Orchestration

> **When to invoke:** When implementing a specification using strict TDD.
> **Invoked by:** `/forge-spec` or `/forge-spec-worktree` command.
> **Orchestrator:** Forge-Master agent.

## Purpose

Orchestrate the full build workflow: task breakdown, test writing, foundation, contracts, parallel implementation, and integration — all following strict TDD.

## Skills Referenced

- `test-driven-development` — Enforcer uses during red/green phases
- `agent-delegation` — Orchestrator follows delegation and verification rules
- `verification-before-completion` — All agents verify before claiming done; **evidence tiers** decide how much proof each task needs
- `systematic-debugging` — Builder agents use when tests fail
- `autopilot` — only under `/forge-spec-worktree`: no questions, recommended option + log, chain into audit and seal

## Cost Discipline — read before anything else

A forge cycle's token bill is dominated by **prose that gets re-read**, not by tests. Three rules keep it proportional to the change:

1. **Size lane.** Small specs run in **direct mode** (no DAG, no Forger, no parallel phase, orchestrator builds). See *Phase 0.5*.
2. **tasks.md is a state table, not a diary.** It records what is true now. How it got there goes to `.catalyst/specs/{spec-slug}/journal/{task-id}.md`, which the build never reads. A big spec earns a big DAG; it does not earn rationale, attempts, or abandoned approaches. See *tasks.md vs journal*.
3. **Run to completion.** The orchestrator never ends a turn to "wait" for an agent it has already spawned — it reads the result and continues. Returning to the user happens only at a hard gate that failed, an escalation, or the final report.

## Prerequisites

- Spec must exist in `.catalyst/specs/`
- `spec.md` must be complete
- No unresolved "Open Questions"

## Output Location

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           # Already exists from /catalyze-spec
├── research.md       # Already exists from /catalyze-spec
├── tasks.md          # Forger (or orchestrator in direct mode) creates — state table, no narrative
├── journal/          # Per-task narrative, append-only, written by the agent doing the task
│   └── {task-id}.md  #   read by the audit, never by the build
├── validation.md     # Arbiter creates (in /audit-spec)
├── handoff.md        # Updated throughout
└── assets/
```

## Git Workflow

```
PHASE 0: Setup
├── Read .catalyst/main/project-config.yaml
├── IF --worktree flag:
│   ├── mkdir -p {worktree_path}
│   ├── git worktree add {worktree_path}/{spec-slug} -b {branch_prefix}/{spec-slug} {development_branch}
│   ├── cd {worktree_path}/{spec-slug}
│   └── Record worktree path in spec's handoff.md
├── ELSE (default):
│   ├── Checkout to development_branch (default: main)
│   └── Create branch: {branch_prefix}/{spec-slug}

GATE 1: RED FLAG
└── Commit: "test({scope}): write failing tests for {spec}"

GATE 2: GREEN FLAG
└── Commit: "feat({scope}): implement {spec}"
```

## TDD IS MANDATORY — NO EXCEPTIONS

```
Full DAG lane — the build MUST follow this exact sequence:

1. Task(subagent_type="forger")    -> Create tasks.md
2. Task(subagent_type="enforcer")  -> Write ALL tests (must FAIL)
3. Verify                          -> Run tests, confirm RED
4. Task(subagent_type="smith/shaper/artificer/alchemist") -> Implement until GREEN

Direct lane — same sequence, no spawns: the orchestrator writes tasks.md,
writes the failing tests, confirms RED, commits, implements, confirms GREEN, commits.
```

The lane is chosen in Phase 0.5. TDD is identical in both; only *who types* changes.

## Execution Order (DAG-Based)

```
Phase 1: Forger (task breakdown → tasks.md with Build DAG)
              |
Phase 2: Enforcer (write ALL failing tests)
              |
         GATE 1: RED PHASE — All tests must FAIL
              |
Phase 3: Foundation (Alchemist — sequential)
              |
         GATE 2: Foundation tests pass
              |
Phase 4: Contracts (Smith — shared types, sequential)
              |
         GATE 3: Type-check passes
              |
Phase 5: Parallel Implementation (Smith × N + Shaper × M + Artificer × K)
         [scope-isolated parallel agents]
              |
         GATE 4: GREEN PHASE — All tests must PASS
              |
Phase 6: Integration (Enforcer — cross-boundary tests)
```

### Parallel Execution Rules

| Phase | Agents | Parallel? |
|-------|--------|-----------|
| Task Breakdown | Forger | No (creates DAG first) |
| Test Writing | Enforcer | No (must complete before impl) |
| Foundation | Alchemist | No (DB schema first) |
| Contracts | Smith (single) | No (shared types before parallel) |
| Implementation | Smith × N + Shaper × M + Artificer × K | **Yes — multiple instances** |
| Integration | Enforcer | No (after all parallel complete) |

**Multi-Instance Rules:**
- Each parallel agent has exclusive scope (files it can write)
- Each parallel agent has read-only access to shared types
- Scopes MUST NOT overlap
- Spawn all ready agents in ONE message

## Workflow Detail

### Phase 0: Git Setup

1. Read `project-config.yaml` for `development_branch`, `branch_prefix`, and `worktree_path`
2. IF `--worktree` flag (from `/forge-spec-worktree`):
   - `mkdir -p {worktree_path}` (default: `.catalyst/worktrees`)
   - `git worktree add {worktree_path}/{spec-slug} -b {branch_prefix}/{spec-slug} {development_branch}`
   - `cd {worktree_path}/{spec-slug}` — all subsequent work happens here
   - Record `worktree: {worktree_path}/{spec-slug}` in the spec's `handoff.md`
   - `/forge-spec-worktree` also means **autopilot**: load the `autopilot` skill, mark `handoff.md` with `**Mode:** AUTOPILOT`, and after GATE 2 + board sync continue straight into `spec-validation` and `spec-approval` without returning to the user
3. ELSE (default — branch checkout):
   - Checkout development branch and pull
   - Create spec feature branch: `{branch_prefix}/{spec-slug}`

### Phase 0.5: Size Lane — direct mode or full DAG

Decide once, before spawning anyone. Read `spec.md` frontmatter (`provides`, `affects`) and the requirements.

| Signal | Direct mode | Full DAG |
|--------|-------------|----------|
| Production files created or modified | **≤ 3** | 4+ |
| Database migration / schema change | none | any |
| Independent work units that could run in parallel (separate pages, separate API domains) | none | 2+ |
| Distinct builder domains needed (backend + frontend + mobile) | 1 | 2+ |

**All four in the left column → direct mode.** Anything in the right column → full DAG. Write the lane and the reason as the first line of `tasks.md`: `> Lane: direct — 2 files, no migration`.

**Direct mode (the orchestrator IS the builder):**

```
1. Write tasks.md yourself: the lane line, one task row per behaviour (≤ 5 rows), Evidence tier per row, Current Session.
   No phases, no scope tables, no dependency graph.
2. Load test-driven-development. Write the failing tests yourself. Run → all RED.
3. GATE 1: commit "test({scope}): write failing tests for {spec}"
4. Implement yourself. Run → all GREEN. Refactor. Run → still GREEN.
5. GATE 2: commit "feat({scope}): implement {spec}"
6. Update tasks.md Progress rows + Current Session. Append .catalyst/specs/{spec-slug}/journal/direct.md (≤ 200 words).
7. Board sync.
```

No Forger, no Enforcer, no Smith/Shaper spawn, no integration phase. `agent-delegation`'s Iron Law #1 does not apply below this threshold — a 90-line change does not need 12 agents and 2 hours of hand-offs. TDD, both gates, and verification still apply in full.

**Full DAG** continues with Phase 1 below.

### Phase 1: Task Breakdown (Forger)

Spawn Forger → creates `tasks.md` with Build DAG including phases, scope boundaries, dependencies, parallel opportunities, and an **Evidence** tier per task (`rg` = red-then-green, `mut` = mutation-prove; see `verification-before-completion`). Forger keeps every row at its stated shape and every rationale out.

### Phase 2: Write Tests (Enforcer) — RED PHASE

Spawn Enforcer → writes failing tests for ALL tasks. Run tests to confirm all FAIL.

### GATE 1: Red Phase Verification — BLOCKING

```
THIS IS A HARD GATE. DO NOT PROCEED UNTIL ALL 3 STEPS COMPLETE:

  1. RUN all tests → confirm every test FAILS
  2. If ANY test passes → STOP and fix before continuing
  3. COMMIT the failing tests → this is the checkpoint

COMMIT: "test({scope}): write failing tests for {spec}"

Only AFTER this commit exists may implementation begin.
No commit = no implementation. No exceptions.
```

> **Context checkpoint:** If context is getting long, compact now. All state is in `tasks.md`.
> Run `/primer-spec @{slug}` in a new conversation to resume.

- Every task has at least one test
- All tests executed
- All tests FAIL (for the right reasons — missing feature, not import errors)
- Commit is the proof that red phase happened

### Phase 3-4: Foundation & Contracts

> **Context checkpoint:** If context is getting long, compact now. All state is in `tasks.md`.
> Run `/primer-spec @{slug}` in a new conversation to resume.

Spawn Alchemist (foundation) → WAIT → Spawn Smith (contracts) → WAIT

### Phase 5: Parallel Implementation

Spawn ALL ready agents in ONE message with scope boundaries:
```
Each agent prompt includes:
- SCOPE (write): exclusive files
- READS (no modify): shared files
- Requirements from tasks.md
- Test references
```

### GATE 2: Green Phase Verification — BLOCKING

```
THIS IS A HARD GATE. DO NOT PROCEED UNTIL ALL 3 STEPS COMPLETE:

  1. RUN all tests → confirm every test PASSES
  2. If ANY test fails → fix before continuing
  3. COMMIT the implementation → this is the checkpoint

COMMIT: "feat({scope}): implement {spec}"

Only AFTER this commit exists may integration begin.
```

> **Context checkpoint:** If context is getting long, compact now. All state is in `tasks.md`.
> Run `/primer-spec @{slug}` in a new conversation to resume.

### Phase 6: Integration

> **Context checkpoint:** If context is getting long, compact now. All state is in `tasks.md`.
> Run `/primer-spec @{slug}` in a new conversation to resume.

Spawn Enforcer for cross-boundary integration tests.

## Implementation Rules

```
FOR EACH TASK:
1. Verify test exists and FAILS
2. Write MINIMAL code to make test pass
3. Run test → must PASS
4. Refactor if needed
5. Run test → must still PASS
6. Prove at the task's Evidence tier (rg or mut) — never escalate the tier on your own
7. Update your tasks.md Progress row (status + ≤ 200-char note) — THE AGENT DOING THE WORK MUST DO THIS
8. Append your narrative to .catalyst/specs/{spec-slug}/journal/{task-id}.md — NOT to tasks.md, NOT to a journal/ at the repo root

NEVER write code without a failing test first
NEVER write more code than needed to pass the test
NEVER modify files outside your SCOPE
NEVER report done without updating your tasks.md row first
NEVER put more than one line of prose in a tasks.md cell
Comments follow .claude/rules/code-comments.md: why-only, ≤ 15-line docblocks, decisions go to handoff.md
```

### tasks.md vs journal

`tasks.md` is **shared mutable state** read by every agent on most turns. Every word in it is paid for dozens of times. It therefore holds only:

| Section | Content | Cap |
|---------|---------|-----|
| `## Build DAG` | Phases, task rows (ID, Agent, Scope, Reads, Depends On, Evidence, Est) | as many rows as tasks |
| `## Progress` | One row per task: Status enum · Tests · Commit · **Note ≤ 200 chars** | one line per task |
| `## Current Session` | Phase, active tasks, next step, file:line | 10 lines |
| `## Decisions` | **One line each** — decision + 10-word why. Full rationale → `handoff.md` | one line per decision |

The shapes above are the whole budget. There is no file-level word cap: a spec with sixty tasks writes sixty rows, and that is correct. What never enters the file is rationale, an attempt, or an approach that was dropped. If a row needs more than 200 characters, the rest goes to the journal.

`.catalyst/specs/{spec-slug}/journal/{task-id}.md` is **append-only, per task, written by the agent doing the task**. What was tried, what failed, why the approach changed, test output excerpts. Rules:

- The agent doing task X writes `.catalyst/specs/{spec-slug}/journal/X.md`. Nobody else writes to it. The journal directory lives inside the spec folder — a `journal/` at the repo root is a bug.
- **No agent reads another task's journal during the build.** The orchestrator does not read journals at all.
- The **audit** (Arbiter, Inquisitor) reads journals — that is what they are for.
- `/primer-spec` reads `tasks.md` only.

### tasks.md Update Responsibility

**Every agent (smith, shaper, artificer, alchemist, enforcer) MUST update its own Progress row before reporting back**, and put everything longer than a line in its journal. The orchestrator (forge-master) verifies and fills gaps, but agents are the primary updaters. Read `tasks.md` with `grep -A` / `sed -n` for the section you need — do not `cat` the whole file on every turn.

## Failure Modes

| Failure | Action |
|---------|--------|
| Tests pass before implementation | STOP — fix tests (testing wrong thing) |
| Implementation starts without tests | STOP — delete code, return to Phase 2 |
| Scope violation detected | STOP agent, revert, re-run with stricter prompt |
| Parallel agents conflict | STOP build, revert, restructure DAG |
| Dependency deadlock | STOP all, report to user, restructure DAG |
| A paragraph appears in a tasks.md cell | Move it to journal/, trim the note to ≤ 200 chars |
| Orchestrator ends a turn to "wait" | Don't. Read the agent result and continue in the same turn |

## Board Sync (final step)

Once the GREEN commit exists, the spec has moved **Planned → In Progress**. Run the board script — it derives the state from disk and regenerates `roadmap.md` + `dashboard.html` deterministically. Never hand-write either file.

```bash
node .catalyst/bin/board.js --by "/forge-spec"
```
Paste its 4-line summary into your report. If it prints `skipped — no roadmap.md`, say so in one line and move on.
