# Catalyst OS

Spec-driven development framework with specialized agents.

## First Priority

**Before any action**, read `.claude/skills/using-skills/SKILL.md` and follow it.

This skill is the bootstrap — it tells you which other skills to load for the task at hand. No exceptions. No shortcuts. Even for "simple" tasks.

## Architecture

- **Commands / Prompts**: Thin triggers — WHEN to start a workflow
- **Skills**: Rich process knowledge — HOW to do the work
- **Agents**: Specialized personas — WHO does the work

Commands invoke skills. Skills define process. Agents execute within skill boundaries.

## Spec Lifecycle

The canonical workflow order:

`/catalyze-spec` → *(optional)* `/challenge-spec` → `/forge-spec` → `/audit-spec` → `/seal-spec`

- **catalyze** — Shape the specification from a feature request
- **challenge** *(optional)* — Interrogate the shaped spec branch by branch; patch spec.md and log to handoff.md
- **forge** — Implement with strict TDD
- **audit** — Validate the CODE (quality, security, tests)
- **seal** — Final commit, archive, and propagate learnings

`/audit-spec` audits the code implementation, NOT the spec document.

`/challenge-spec` is optional. Use it when the spec has real design surface area; skip it for trivial specs.

### Completion Alternatives

| Path | When to use |
|------|------------|
| `/seal-spec` | Full ceremony — git commit, branch management, archive, library |
| `/archive-spec` | Lightweight — archive + library, no git ceremony |
| `/sync-project` | Batch — scan all specs, archive completed ones, reconcile `.catalyst/main/` docs |

## Specs

Active specs live in `.catalyst/specs/YYYY-MM-DD-{slug}/`. Each spec has:
- `spec.md` — requirements and design
- `tasks.md` — build DAG and progress tracking
- `validation.md` — quality check results
- `handoff.md` — decisions and deviations log

## Rules

Always-on rules in `.claude/rules/` apply to every action.

---

# Agent Registry

Quick reference for all agents and the skills they use.

---

## Parallel Execution Strategy

**CRITICAL**: Always spawn multiple agents in parallel when their tasks are independent.

### Parallelize These (No Dependencies)

| Scenario | Run Together |
|----------|--------------|
| Research phase | Oracle + Seer + Scout + Surveyor |
| Build phase | Smith x N + Shaper x M + Artificer x K (multiple instances) |
| Validation phase | Inquisitor + Watcher + Sentinel + Curator (DB specs) |

### Run Sequentially (Has Dependencies)

| First | Then | Why |
|-------|------|-----|
| Forger | All builders | Need task breakdown (DAG) first |
| Alchemist | Smith/Shaper/Artificer | DB schema before API/UI/mobile that uses it |
| Enforcer | Builders | TDD: tests before implementation |
| Contracts | Parallel work | Shared types before parallel divergence |

### Multi-Instance Parallelization (DAG-Based)

Forger creates a **Build DAG** that identifies:
- **Scope boundaries** — exclusive file ownership per agent instance
- **Dependencies** — which tasks block others
- **Parallel opportunities** — tasks that can run simultaneously

```
alchemist (DB) ──────────────────────────────────────>
                │
                └── contracts (shared types) ────────>
                        │
                        ├── smith-1 (api/auth/**) ──> }
                        ├── smith-2 (api/posts/**) ─> } PARALLEL
                        ├── shaper-1 (pages/profile) > } (5 agents)
                        ├── shaper-2 (pages/feed) ──> }
                        └── shaper-3 (pages/settings) >
```

### Scope Isolation Rules

Each parallel agent has:
- **Scope**: Files it can write (exclusive)
- **Reads**: Files it can read but NOT modify (shared)

**CRITICAL**: Parallel tasks MUST have non-overlapping scopes. If scopes overlap -> make sequential.

---

## CATALYSTS (Orchestrators)

All orchestrators load `using-skills` first and follow `agent-delegation`.

| Agent | Role | Skills Used |
|-------|------|-------------|
| [Catalyst](.claude/agents/catalyst.md) | Spec orchestration | `spec-shaping`, `brainstorming`, `agent-delegation` |
| [Forge-Master](.claude/agents/forge-master.md) | Build orchestration (direct mode or full DAG; runs the whole `/forge-spec-worktree` chain) | `build-orchestration`, `agent-delegation`, `verification-before-completion`, `autopilot` |
| [Arbiter](.claude/agents/arbiter.md) | Validation orchestration | `spec-validation`, `agent-delegation`, `verification-before-completion` |

## SEEKERS (Research)

| Agent | Role | Skills Used |
|-------|------|-------------|
| [Oracle](.claude/agents/oracle.md) | Gather requirements | `brainstorming` |
| [Scribe](.claude/agents/scribe.md) | Write documentation | — |
| [Seer](.claude/agents/seer.md) | Analyze codebase | — |
| [Scout](.claude/agents/scout.md) | Web research | — |
| [Surveyor](.claude/agents/surveyor.md) | UI/UX research | — |

## TECHNOLOGISTS (Builders)

All builders follow `test-driven-development`, `systematic-debugging`, `verification-before-completion`, and `receiving-code-review`.

| Agent | Role | Additional Skills |
|-------|------|-------------------|
| [Forger](.claude/agents/forger.md) | Task breakdown | — |
| [Smith](.claude/agents/smith.md) | Backend/API | `test-driven-development`, `systematic-debugging` |
| [Shaper](.claude/agents/shaper.md) | Frontend/UI | `test-driven-development`, `systematic-debugging` |
| [Artificer](.claude/agents/artificer.md) | Mobile (Flutter) | `mobile-development`, `test-driven-development`, `systematic-debugging` |
| [Alchemist](.claude/agents/alchemist.md) | Database/schemas | `test-driven-development`, `systematic-debugging` |
| [Necromancer](.claude/agents/necromancer.md) | ML/AI | — |

## GUARDIANS (Quality)

| Agent | Role | Skills Used |
|-------|------|-------------|
| [Enforcer](.claude/agents/enforcer.md) | Unit tests | `test-driven-development` |
| [Sentinel](.claude/agents/sentinel.md) | E2E tests | — |
| [Inquisitor](.claude/agents/inquisitor.md) | Code review | — |
| [Watcher](.claude/agents/watcher.md) | Security audit | — |
| [Curator](.claude/agents/curator.md) | Schema-integrity audit (read-only DB) | `secret-scanning` |

---

## Language Policy

**CRITICAL: All generated artifacts MUST be in English.**

| Context | Language |
|---------|----------|
| User Communication | Match user's language |
| Generated Artifacts | **Always English** |
| Code & Comments | **Always English** |

**Artifacts include:** `.catalyst/` contents, spec documents, mission.md, roadmap.md, tech-stack.md, code comments, commit messages.

---

## Documentation Output Policy

**CRITICAL: All spec documentation MUST go through Scribe agent.**

> **Structure defined in:** `.catalyst/specs/spec-structure.yaml` (single source of truth)

### STRICT ALLOWLIST

Spec folders may **ONLY** contain:

| File | Owner | Purpose |
|------|-------|---------|
| `spec.md` | Scribe | Requirements + frontmatter |
| `research.md` | Scribe | Compiled research findings |
| `tasks.md` | Forger | Build DAG + progress |
| `validation.md` | Arbiter | Test results |
| `handoff.md` | Arbiter | Human-readable summary |
| `assets/` | Any | Images, diagrams |

**ANY OTHER FILE IS FORBIDDEN.** No README.md, no notes.md, no implementation/.

### Rules

1. **Scribe is gatekeeper** — All .md writes in specs go through Scribe
2. **DENY by default** — If not in allowlist, don't create it
3. **Researchers hand off** — Scout/Seer/Oracle give findings to Scribe, don't write directly
4. **tasks.md is THE living document** — ONE file to read when resuming work
5. **handoff.md is colleague summary** — Human-readable walkthrough, finalized at end

---

## Context Assembly

**spec.md has YAML frontmatter** for cross-spec knowledge transfer:

```yaml
---
spec: YYYY-MM-DD-slug
status: draft | in-progress | complete
domain: auth | payments | etc
provides: [what this spec creates]
requires: [specs this depends on]
affects: [specs this impacts]
patterns_established: [reusable patterns created]
key_files: [important files created/modified]
key_decisions: [major choices made]
---
```

Catalyst reads frontmatter from all specs to understand project context before shaping new specs.
