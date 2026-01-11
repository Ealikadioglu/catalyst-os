# Catalyst OS

> An AI-powered development system for building production-ready applications through spec-driven development.

---

## Quick Start

```bash
/catalyze-project              # Initialize project foundation
/catalyze-spec "description"   # Shape a feature specification
/build-spec @spec-name         # Implement with TDD
/validate-spec @spec-name      # Run quality checks
/approve-spec @spec-name       # Accept and archive
```

---

## Installation

Copy `.claude/` and `.catalyst/` folders to your project root.

Your project keeps its own `CLAUDE.md` — Catalyst OS lives entirely within these two folders.

---

## Architecture

```
.claude/
├── commands/           # User-invoked slash commands
└── skills/             # Model-invoked capabilities (HOW)
    ├── catalysts/      # Orchestration skills
    ├── seekers/        # Research skills
    ├── technologists/  # Builder skills
    └── guardians/      # Quality skills

.catalyst/
├── agents/             # Agent definitions (WHO)
│   ├── catalysts/      # Orchestrators
│   ├── seekers/        # Research agents
│   ├── technologists/  # Builder agents
│   └── guardians/      # Quality agents
├── main/               # Mission, roadmap, tech-stack
├── specs/              # Active specifications
├── tasks/              # Independent task files
├── completed/          # Archived specs
├── library/            # Reusable patterns
├── workflows/          # Visual workflow documentation
└── standards/          # Coding standards
```

---

## Core Concepts

### Separation of Concerns

| Component | Contains | Location |
|-----------|----------|----------|
| **Agent** | WHO - Persona, behavior | `.catalyst/agents/` |
| **Skill** | HOW - Process, procedure | `.claude/skills/` |
| **Command** | WHEN - User trigger | `.claude/commands/` |

### 1 Agent → N Skills

```
Seer agent
├── codebase-analysis skill
└── context7-lookup skill

Scout agent
├── web-research skill
├── github-research skill
└── reddit-research skill
```

---

## Complete Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CATALYST OS LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │              │     │              │     │              │     │              │
  │ 🔍 CATALYZE  │────▶│   🔨 BUILD   │────▶│  ✓ VALIDATE  │────▶│  ✅ APPROVE  │
  │              │     │              │     │              │     │              │
  │ /catalyze-   │     │ /build-spec  │     │ /validate-   │     │ /approve-    │
  │    spec      │     │              │     │    spec      │     │    spec      │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  spec.md     │     │  tasks.md    │     │ validation.md│     │   Commit +   │
  │  research.md │     │  (updated)   │     │  handoff.md  │     │   Archive    │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## The Four Orders

### Agent Registry

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENT REGISTRY                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  🎯 CATALYSTS (Orchestrators)                                               │
│  ─────────────────────────────                                              │
│                                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                        │
│  │  Catalyst   │   │Forge-Master │   │   Arbiter   │                        │
│  │   (Opus)    │   │   (Opus)    │   │   (Opus)    │                        │
│  │             │   │             │   │             │                        │
│  │ Spec        │   │ Build       │   │ Validation  │                        │
│  │ orchestr.   │   │ orchestr.   │   │ orchestr.   │                        │
│  └─────────────┘   └─────────────┘   └─────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 SEEKERS (Research)                                                      │
│  ─────────────────────                                                      │
│                                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Oracle  │ │  Seer   │ │  Scout  │ │Surveyor │ │ Scribe  │               │
│  │(Sonnet) │ │(Sonnet) │ │(Sonnet) │ │(Sonnet) │ │(Sonnet) │               │
│  │         │ │         │ │         │ │         │ │         │               │
│  │Require- │ │Codebase │ │  Web    │ │   UI    │ │  Docs   │               │
│  │ments    │ │Analysis │ │Research │ │Research │ │         │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  🔨 TECHNOLOGISTS (Builders)                                                │
│  ───────────────────────────                                                │
│                                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐             │
│  │ Forger  │ │Alchemist│ │  Smith  │ │ Shaper  │ │Necromancer│             │
│  │ (Opus)  │ │ (Opus)  │ │ (Opus)  │ │ (Opus)  │ │  (Opus)   │             │
│  │         │ │         │ │         │ │         │ │           │             │
│  │  Task   │ │Database │ │Backend  │ │Frontend │ │   ML/AI   │             │
│  │Breakdown│ │         │ │         │ │         │ │           │             │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  🛡️ GUARDIANS (Quality)                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ Enforcer │ │ Sentinel │ │Inquisitor│ │ Watcher  │                        │
│  │ (Sonnet) │ │ (Sonnet) │ │ (Sonnet) │ │ (Sonnet) │                        │
│  │          │ │          │ │          │ │          │                        │
│  │  Unit    │ │   E2E    │ │  Code    │ │ Security │                        │
│  │  Tests   │ │  Tests   │ │ Quality  │ │  Audit   │                        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Skills

| Order | Agent | Skills |
|-------|-------|--------|
| **CATALYSTS** | Catalyst | `spec-orchestration` |
| | Forge-Master | `build-orchestration` |
| | Arbiter | `validation-orchestration` |
| **SEEKERS** | Oracle | `requirement-elicitation` |
| | Scribe | `documentation-management` |
| | Seer | `codebase-analysis`, `context7-lookup` |
| | Scout | `web-research`, `github-research`, `reddit-research` |
| | Surveyor | `figma-analysis`, `ui-pattern-hunting` |
| **TECHNOLOGISTS** | Forger | `task-breakdown` |
| | Smith | `api-development`, `service-implementation` |
| | Shaper | `react-development`, `ui-component-building` |
| | Alchemist | `schema-design`, `migration-creation` |
| | Necromancer | `ml-pipeline`, `ai-integration` |
| **GUARDIANS** | Enforcer | `unit-test-writing`, `test-fixture-creation` |
| | Sentinel | `e2e-test-execution`, `browser-automation` |
| | Inquisitor | `lint-checking`, `code-review` |
| | Watcher | `dependency-audit`, `secret-scanning` |

---

## Commands

| Command | When to Use | Output |
|---------|-------------|--------|
| `/catalyze-project` | Start new project | mission.md, roadmap.md, tech-stack.md |
| `/catalyze-spec "feature"` | New feature request | spec.md, research.md |
| `/build-spec @slug` | Implement feature | tasks.md (updated) |
| `/build-task "description"` | Modify existing code | task.md in .catalyst/tasks/ |
| `/validate-spec @slug` | Quality checks | validation.md, handoff.md |
| `/approve-spec @slug` | Finalize | Commit + Archive |
| `/reject-spec @slug "reason"` | Reject implementation | Status: REJECTED |
| `/status-spec @slug` | Check progress | Current status |
| `/update-spec @slug` | Modify spec | Updated spec.md |
| `/mission` | Create/update mission.md | mission.md |
| `/roadmap` | Create/update roadmap.md | roadmap.md |
| `/tech-stack` | Create/update tech-stack.md | tech-stack.md |

---

## Spec Folder Structure

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           ← Requirements (Scribe owns)
├── research.md       ← Research findings (Scribe compiles)
├── tasks.md          ← Task breakdown (Forger owns)
├── validation.md     ← Test results (Arbiter owns)
├── handoff.md        ← Living documentation (Scribe owns)
└── assets/           ← Images, diagrams, mockups
```

---

## TDD Enforcement

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ⚠️  TDD IS MANDATORY - NO EXCEPTIONS                                    ║
║                                                                           ║
║   ┌─────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                     │ ║
║   │   1. FORGER creates tasks.md                                        │ ║
║   │          │                                                          │ ║
║   │          ▼                                                          │ ║
║   │   2. ENFORCER writes ALL tests                                      │ ║
║   │          │                                                          │ ║
║   │          ▼                                                          │ ║
║   │   ┌──────────────────────────────────────────┐                      │ ║
║   │   │  🚧 GATE 1: RED PHASE                    │                      │ ║
║   │   │  All tests must FAIL                     │                      │ ║
║   │   │  If any pass → STOP                      │                      │ ║
║   │   └──────────────────────────────────────────┘                      │ ║
║   │          │                                                          │ ║
║   │          ▼ (only after gate passes)                                 │ ║
║   │   3. BUILDERS implement (Alchemist, Smith, Shaper)                  │ ║
║   │          │                                                          │ ║
║   │          ▼                                                          │ ║
║   │   ┌──────────────────────────────────────────┐                      │ ║
║   │   │  🚧 GATE 2: GREEN PHASE                  │                      │ ║
║   │   │  All tests must PASS                     │                      │ ║
║   │   └──────────────────────────────────────────┘                      │ ║
║   │                                                                     │ ║
║   └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Parallelization Rules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚡ PARALLEL EXECUTION RULES                                                │
└─────────────────────────────────────────────────────────────────────────────┘

✅ PARALLELIZE THESE (No Dependencies)
───────────────────────────────────────
┌───────────────────┬────────────────────────────────────────┐
│ Scenario          │ Run Together                           │
├───────────────────┼────────────────────────────────────────┤
│ Research phase    │ Seer + Scout + Surveyor                │
│ Build phase       │ Smith + Shaper (backend + frontend)    │
│ Validation phase  │ Enforcer + Sentinel + Inquisitor +     │
│                   │ Watcher                                │
└───────────────────┴────────────────────────────────────────┘

❌ RUN SEQUENTIALLY (Has Dependencies)
───────────────────────────────────────
┌───────────────────┬──────────────┬─────────────────────────┐
│ First             │ Then         │ Why                     │
├───────────────────┼──────────────┼─────────────────────────┤
│ Oracle            │ All research │ Need requirements first │
│ Forger            │ All builders │ Need task breakdown     │
│ Alchemist         │ Smith        │ DB schema before API    │
│ Enforcer          │ Builders     │ TDD: tests before code  │
└───────────────────┴──────────────┴─────────────────────────┘


EXAMPLE: Research Phase
─────────────────────────

  WRONG (Sequential):
  Oracle → Seer → Scout → Surveyor → Scribe

  CORRECT (Parallel where possible):
  Oracle → [Seer + Scout + Surveyor] → Scribe
              ▲         ▲         ▲
              └─────────┴─────────┘
                  (parallel)


EXAMPLE: Build Phase
──────────────────────

  WRONG (Sequential):
  Alchemist → Smith → Shaper

  CORRECT (Parallel where possible):
                  ┌── Smith ──┐
  Alchemist ──────┤           ├──▶ Done
      (DB)        └── Shaper ─┘
                    (parallel)
```

---

## Pattern Library

Reusable implementation patterns extracted from completed specs.

**Location:** `.catalyst/library/`

### How It Works

1. When a spec is approved via `/approve-spec`, you're prompted to extract reusable patterns
2. **Not every spec becomes a library item** — project-specific implementations are skipped
3. Browse library items before starting new features for guidance

### Library Item Format

```markdown
# Pattern Name

> Category: <category>
> Complexity: Low | Medium | High
> Last Updated: YYYY-MM-DD
> Based on: N implementations

## Overview
## When to Use
## Key Considerations
## Architecture Pattern
## Common Pitfalls
## Dependencies
## Testing Strategy
## Database Considerations
## Related Specs
```

### Categories

| Category | Description |
|----------|-------------|
| Payments | Stripe, billing, subscriptions |
| Authentication | OAuth, SSO, JWT, login flows |
| File Storage | S3, uploads, media handling |
| Real-time | WebSockets, live updates |
| Notifications | Email, push, SMS |
| Search | Full-text search, Elasticsearch |
| Caching | Redis, performance optimization |
| Background Jobs | Queues, workers, async processing |

---

## File Formats

### Agent File

```markdown
# Agent Name

*Role Title*

## Opening
*"Opening line"*

## Role
What this agent does.

## Behavior
- Guidelines
- Constraints

## Skills
| Skill | Purpose |
|-------|---------|
| `skill-name` | Description |
```

### Skill File

```yaml
---
name: skill-name
description: When to use this skill...
agent: agent-name
---

# Skill Name

## Process
1. Step one
2. Step two

## Output
What this produces
```

---

## Standards

Project standards in `.catalyst/standards/`:
- `coding.md` - Code style and conventions
- `testing.md` - Test requirements (TDD mandatory)
- `git-workflow.md` - Branch and commit conventions

---

## Workflow Documentation

Detailed visual workflow guides are available in `.catalyst/workflows/`:

| File | Command |
|------|---------|
| [catalyze-project.md](.catalyst/workflows/catalyze-project.md) | `/catalyze-project` |
| [catalyze-spec.md](.catalyst/workflows/catalyze-spec.md) | `/catalyze-spec` |
| [build-spec.md](.catalyst/workflows/build-spec.md) | `/build-spec` |
| [build-task.md](.catalyst/workflows/build-task.md) | `/build-task` |
| [validate-spec.md](.catalyst/workflows/validate-spec.md) | `/validate-spec` |
| [approve-spec.md](.catalyst/workflows/approve-spec.md) | `/approve-spec` |
