# Catalyst OS

An AI-powered development system for building production-ready applications through spec-driven development.

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

## The Four Orders

### 1. CATALYSTS (Orchestrators)
*Coordinate workflows and phases*

| Agent | Skills |
|-------|--------|
| Catalyst | `spec-orchestration` |
| Forge-Master | `build-orchestration` |
| Arbiter | `validation-orchestration` |

### 2. SEEKERS (Research)
*Gather knowledge and context*

| Agent | Skills |
|-------|--------|
| Oracle | `requirement-elicitation` |
| Scribe | `documentation-management` |
| Seer | `codebase-analysis`, `context7-lookup` |
| Scout | `web-research`, `github-research`, `reddit-research` |
| Surveyor | `figma-analysis`, `ui-pattern-hunting` |

### 3. TECHNOLOGISTS (Builders)
*Implement with TDD*

| Agent | Skills |
|-------|--------|
| Forger | `task-breakdown` |
| Smith | `api-development`, `service-implementation` |
| Shaper | `react-development`, `ui-component-building` |
| Alchemist | `schema-design`, `migration-creation` |
| Necromancer | `ml-pipeline`, `ai-integration` |

### 4. GUARDIANS (Quality)
*Ensure quality and security*

| Agent | Skills |
|-------|--------|
| Enforcer | `unit-test-writing`, `test-fixture-creation` |
| Sentinel | `e2e-test-execution`, `browser-automation` |
| Inquisitor | `lint-checking`, `code-review` |
| Watcher | `dependency-audit`, `secret-scanning` |

---

## Spec Lifecycle

```
/catalyze-spec → /build-spec → /validate-spec → /approve-spec
     │               │               │               │
  Seekers       Technologists    Guardians        Archive
```

### Spec Folder Structure

Structure is defined in `.catalyst/specs/spec-config.yaml`:

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md        # Main specification (Scribe)
├── research.md    # Research findings (Scribe)
├── tasks.md       # Build DAG with task breakdown (Forger)
├── validation.md  # Quality validation results (Arbiter)
├── handoff.md     # Living document, completion summary (Arbiter)
└── assets/        # Images, diagrams, visual references
```

### Pattern Library

Reusable implementation patterns extracted from completed specs:

```
.catalyst/library/
├── README.md
├── payment-integration.md
├── authentication.md
└── ...
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `/catalyze-project` | Initialize mission, roadmap, tech-stack |
| `/mission` | Create/update mission.md |
| `/roadmap` | Create/update roadmap.md |
| `/tech-stack` | Create/update tech-stack.md |
| `/catalyze-spec` | Shape a new specification |
| `/build-spec` | Implement with TDD |
| `/validate-spec` | Run quality checks |
| `/approve-spec` | Accept and archive |
| `/reject-spec` | Request changes |

---

## How It Works

1. **Command triggers** (e.g., `/catalyze-spec "add payments"`)
2. **Orchestrator skill activates** (`spec-orchestration`)
3. **Orchestrator coordinates other skills** in sequence
4. **Each skill references its agent** for persona/behavior
5. **Output written** to `.catalyst/specs/`

---

## Standards

Project standards in `.catalyst/standards/`:
- `coding.md` - Code style and conventions
- `testing.md` - Test requirements (TDD mandatory)
- `git-workflow.md` - Branch and commit conventions

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

## Installation

Copy `.claude/` and `.catalyst/` folders to your project root.

Your project keeps its own `CLAUDE.md` - Catalyst OS lives entirely within these two folders.

