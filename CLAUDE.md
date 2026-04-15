# Catalyst OS

Spec-driven development framework with specialized agents.

## First Priority

**Before any action**, read `.claude/skills/using-skills/SKILL.md` and follow it.

This skill is the bootstrap — it tells you which other skills to load for the task at hand. No exceptions. No shortcuts. Even for "simple" tasks.

## Architecture

- **Commands** (`.claude/commands/`): Thin triggers — WHEN to start a workflow
- **Skills** (`.claude/skills/`): Rich process knowledge — HOW to do the work
- **Agents** (`.claude/agents/`): Specialized personas — WHO does the work

Commands invoke skills. Skills define process. Agents execute within skill boundaries.

## Spec Lifecycle

The canonical workflow order:

`/catalyze-spec` → `/forge-spec` → `/audit-spec` → `/seal-spec`

- **catalyze** — Shape the specification from a feature request
- **forge** — Implement with strict TDD
- **audit** — Validate the CODE (quality, security, tests)
- **seal** — Final commit, archive, and propagate learnings

`/audit-spec` audits the code implementation, NOT the spec document.

### Completion Alternatives

| Path | When to use |
|------|------------|
| `/seal-spec` | Full ceremony — git commit, branch management, archive, library |
| `/archive-spec` | Lightweight — archive + library, no git ceremony |
| `/sync-project` | Batch — scan all specs, archive completed ones at once |

## Specs

Active specs live in `.catalyst/specs/YYYY-MM-DD-{slug}/`. Each spec has:
- `spec.md` — requirements and design
- `tasks.md` — build DAG and progress tracking
- `validation.md` — quality check results
- `handoff.md` — decisions and deviations log

## Rules

Always-on rules in `.claude/rules/` apply to every action.
