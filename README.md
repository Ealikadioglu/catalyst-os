# Catalyst OS

> An AI-powered development system for building production-ready applications through spec-driven development.

**📖 [Full Documentation →](.catalyst/README.md)**

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
└── skills/             # Model-invoked capabilities

.catalyst/
├── agents/             # Agent definitions (WHO)
├── main/               # Mission, roadmap, tech-stack
├── specs/              # Active specifications
└── standards/          # Coding standards
```

---

<p align="center">
  <a href=".catalyst/README.md">Full Documentation</a> •
  <a href=".catalyst/AGENTS.md">Agent Registry</a>
</p>

