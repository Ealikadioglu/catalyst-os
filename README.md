# Catalyst OS

> An AI-powered development system for building production-ready applications through spec-driven development.

---

## Quick Start

```bash
/catalyze-project              # Initialize project foundation
/catalyze-spec "description"   # Shape a feature specification
/build-spec @spec-name         # Implement with TDD
/iterate-spec @spec-name "improvement"  # Add improvements mid-build
/validate-spec @spec-name      # Run quality checks
/approve-spec @spec-name       # Accept and archive
```

---

## Installation

```bash
npx catalyst-os
```

This installs `.claude/` and `.catalyst/` folders to your project root.

Your project keeps its own `CLAUDE.md` — Catalyst OS lives entirely within these two folders.

---

## Architecture

```
.claude/
├── agents/             # Agent definitions (WHO)
│   ├── catalysts/      # Orchestrators
│   ├── seekers/        # Research agents
│   ├── technologists/  # Builder agents
│   └── guardians/      # Quality agents
└── commands/           # User-invoked slash commands

.catalyst/
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
| **Agent** | WHO - Persona, behavior | `.claude/agents/` |
| **Command** | WHEN - User trigger, orchestration | `.claude/commands/` |

### Agent Specialization

```
Catalysts (Orchestrators)
├── Catalyst      → Spec orchestration
├── Forge-Master  → Build orchestration
└── Arbiter       → Validation orchestration

Seekers (Research)
├── Oracle   → Requirements gathering
├── Seer     → Codebase analysis
├── Scout    → Web research
├── Surveyor → UI/UX research
└── Scribe   → Documentation

Technologists (Builders)
├── Forger     → Task breakdown
├── Alchemist  → Database
├── Smith      → Backend
├── Shaper     → Frontend
└── Necromancer → ML/AI

Guardians (Quality)
├── Enforcer   → Unit tests
├── Sentinel   → E2E tests
├── Inquisitor → Code review
└── Watcher    → Security
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
                              │
                              ▼
                       ┌──────────────┐
                       │  🔄 ITERATE  │ ◀─── New idea during build?
                       │              │
                       │ /iterate-    │      Updates spec + tasks
                       │    spec      │      Continues building
                       └──────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  💡 CONTEXT RECOVERY                                                        │
  │                                                                             │
  │  Context full? New conversation?                                            │
  │  Run /primer-spec @slug to restore awareness before continuing.             │
  └─────────────────────────────────────────────────────────────────────────────┘
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

### Agent Capabilities

| Order | Agent | Responsibility |
|-------|-------|----------------|
| **CATALYSTS** | Catalyst | Spec orchestration, spawns Seekers |
| | Forge-Master | Build orchestration, spawns Technologists |
| | Arbiter | Validation orchestration, spawns Guardians |
| **SEEKERS** | Oracle | Gather requirements from user |
| | Scribe | Write and manage documentation |
| | Seer | Analyze codebase patterns |
| | Scout | Research web, GitHub, Reddit |
| | Surveyor | Research UI/UX patterns |
| **TECHNOLOGISTS** | Forger | Break down specs into tasks |
| | Smith | Implement backend/API code |
| | Shaper | Implement frontend/UI code |
| | Alchemist | Design schemas, create migrations |
| | Necromancer | Implement ML/AI features |
| **GUARDIANS** | Enforcer | Write and run unit tests |
| | Sentinel | Run E2E tests |
| | Inquisitor | Code review, linting |
| | Watcher | Security audit, dependency scan |

---

## Commands

| Command | When to Use | Output |
|---------|-------------|--------|
| `/catalyze-project` | Start new project | mission.md, roadmap.md, tech-stack.md |
| `/catalyze-spec "feature"` | New feature request | spec.md, research.md |
| `/build-spec @slug` | Implement feature | tasks.md (updated) |
| `/iterate-spec @slug "idea"` | Add improvements mid-build | Updated spec + tasks, continues building |
| `/primer-spec @slug` | Restore context (new conversation) | Brief status summary |
| `/build-task "description"` | Modify existing code | task.md in .catalyst/tasks/ |
| `/validate-spec @slug` | Quality checks | validation.md, handoff.md |
| `/approve-spec @slug` | Finalize | Commit + Archive |
| `/reject-spec @slug "reason"` | Reject implementation | Status: REJECTED |
| `/status-spec @slug` | Check progress | Current status |
| `/update-spec @slug "change"` | Modify spec (planning phase) | Updated spec.md |
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

## Capabilities
What this agent can do.
```

### Command File

```markdown
# /command-name

Description of what this command does.

## Usage
/command-name @spec-slug "optional args"

## Workflow
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
