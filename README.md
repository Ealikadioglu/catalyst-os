# Catalyst OS

> An AI-powered development system for building production-ready applications through spec-driven development.

---

## Quick Start

```bash
npx catalyst-os                        # Install to your project
/catalyze-project                      # Initialize project foundation
/meet-spec "topic"                     # (optional) Talk it through -> meeting notes
/catalyze-spec "description"           # Shape a feature specification
/challenge-spec @spec-name             # (optional) Interrogate the spec branch by branch
/forge-spec @spec-name                 # Implement with TDD
/audit-spec @spec-name                 # Run quality checks
/seal-spec @spec-name                  # Accept and archive
```

---

## Installation

```bash
npx catalyst-os
```

This installs `.claude/` (agents, skills, commands) to your project root.

Then run `/catalyze-project` to initialize — this detects your workspace type, generates foundation docs, and bootstraps `CLAUDE.md` with the skill enforcement directive.

---

## Architecture

```
.claude/
├── agents/              # WHO - Agent personas and behavior
├── skills/              # HOW - Process knowledge and workflows
│   ├── using-skills/    # Bootstrap: enforces skill loading
│   ├── brainstorming/
│   ├── test-driven-development/
│   ├── systematic-debugging/
│   ├── verification-before-completion/
│   ├── agent-delegation/
│   ├── receiving-code-review/
│   ├── workspace-detection/
│   ├── autopilot/
│   ├── unslop/
│   ├── meet-spec/
│   ├── spec-shaping/
│   ├── spec-challenge/
│   ├── build-orchestration/
│   ├── spec-validation/
│   ├── spec-approval/
│   ├── spec-archival/
│   ├── project-initialization/
│   ├── project-sync/
│   └── spec-update/
└── commands/            # WHEN - Thin triggers (invoke skills)

.catalyst/
├── main/                # Mission, roadmap, tech-stack, project-config
├── voice/               # /meet-spec meeting runtime (zero-dependency)
├── meetings/            # Meeting notes artifacts (generated, git-ignored)
├── specs/               # Active specifications
├── completed/           # Archived specs
└── library/             # Reusable patterns
```

---

## Three-Layer Separation

| Layer | Contains | Location | Role |
|-------|----------|----------|------|
| **Command** | WHEN - User trigger | `.claude/commands/` | Thin wrapper (16-18 lines) |
| **Skill** | HOW - Process knowledge | `.claude/skills/` | Rich workflow logic |
| **Agent** | WHO - Persona + behavior | `.claude/agents/` | Specialized executor |

Commands invoke skills. Skills define process. Agents execute within skill boundaries.

### Skill Enforcement

`CLAUDE.md` bootstraps the system by loading `using-skills` at conversation start. This skill contains the full index and the hard rule:

> **If there is even a 1% chance a skill applies, you MUST load it.**

Without this, skills are optional documentation. With it, they're mandatory process gates.

---

## Skills

### Process Skills (cross-cutting)

| Skill | Purpose |
|-------|---------|
| `using-skills` | Bootstrap — enforces all other skill loading |
| `brainstorming` | One-question-at-a-time requirement gathering |
| `test-driven-development` | Red-Green-Refactor with mandatory test failure verification |
| `systematic-debugging` | Root cause investigation before fixes |
| `verification-before-completion` | Evidence before completion claims |
| `agent-delegation` | Orchestrators never implement, verify agent claims |
| `receiving-code-review` | Technical evaluation over performative agreement |
| `workspace-detection` | Detect single_repo, monorepo, or multirepo structure |
| `autopilot` | Unattended runs decide with the recommended option and log it |
| `unslop` | Cut the length that carries no information from every artifact |

### Orchestration Skills (workflow-specific)

| Skill | Command | Purpose |
|-------|---------|---------|
| `meet-spec` | `/meet-spec` | Project hub — chat or voice meeting → `/catalyze-spec`-ready notes (optional) |
| `spec-shaping` | `/catalyze-spec` | Shape feature requests into specifications |
| `spec-challenge` | `/challenge-spec` | Interrogate a shaped spec branch by branch (optional) |
| `build-orchestration` | `/forge-spec` | DAG-based TDD implementation |
| `spec-validation` | `/audit-spec` | Quality checks via Guardian agents |
| `spec-approval` | `/seal-spec` | Final verification and archival |
| `spec-archival` | `/archive-spec` | Lightweight completion and archival |
| `project-initialization` | `/catalyze-project` | Workspace detection + foundation docs |
| `project-sync` | `/sync-project` | Batch sync and archive specs |
| `spec-update` | `/update-spec` | Modify spec during planning phase |

---

## The Four Orders

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
├── Artificer  → Mobile (Flutter)
└── Necromancer → ML/AI

Guardians (Quality)
├── Enforcer   → Unit tests
├── Sentinel   → E2E tests
├── Inquisitor → Code review
├── Watcher    → Security
└── Curator    → Schema integrity (DB, read-only)
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
| | Artificer | Implement mobile apps (Flutter) |
| | Alchemist | Design schemas, create migrations |
| | Necromancer | Implement ML/AI features |
| **GUARDIANS** | Enforcer | Write and run unit tests |
| | Sentinel | Run E2E tests |
| | Inquisitor | Code review, linting |
| | Watcher | Security audit, dependency scan |
| | Curator | Schema-integrity audit (read-only DB) |

---

## Complete Lifecycle

```
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │              │     │              │     │              │     │              │
  │   CATALYZE   │────>│    FORGE     │────>│    AUDIT     │────>│     SEAL     │
  │              │     │              │     │              │     │              │
  │ /catalyze-   │     │ /forge-spec  │     │ /audit-spec  │     │ /seal-spec   │
  │    spec      │     │              │     │              │     │              │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
         │                    │                    │                    │
         v                    v                    v                    v
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  spec.md     │     │  tasks.md    │     │ validation.md│     │   Commit +   │
  │  research.md │     │  (updated)   │     │  handoff.md  │     │   Archive    │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
  Context full? New conversation?
  Run /primer-spec @slug to restore awareness before continuing.

  Optional gate between CATALYZE and FORGE:
  /challenge-spec @slug — interrogate every branch of the design tree
  before tests are written. Patches spec.md, logs to handoff.md.
```

---

## Commands

| Command | When to Use | Output |
|---------|-------------|--------|
| `/catalyze-project` | Start new project | mission.md, roadmap.md, tech-stack.md |
| `/meet-spec "topic"` | Shape a spec by talking it through (optional) | meeting.html + meeting.md |
| `/catalyze-spec "feature"` | New feature request | spec.md, research.md |
| `/challenge-spec @slug` | Stress-test the spec before forging (optional) | spec.md (patched), handoff.md (Challenge Log) |
| `/forge-spec @slug` | Implement feature | tasks.md (updated) |
| `/forge-spec-worktree @slug` | **Unattended** forge → audit → seal in an isolated worktree | PR + archived spec |
| `/primer-spec @slug` | Restore context (new conversation) | Brief status summary |
| `/audit-spec @slug` | Quality checks | validation.md, handoff.md |
| `/seal-spec @slug` | Finalize | Commit + Archive |
| `/archive-spec @slug` | Lightweight archive | Archive (no git ceremony) |
| `/sync-project` | Batch sync spec statuses | Sync report + archives |
| `/discard-spec @slug "reason"` | Discard implementation | Status: REJECTED |
| `/status-spec @slug` | Check progress | Current status |
| `/update-spec @slug "change"` | Modify spec (planning phase) | Updated spec.md |
| `/mission` | Create/update mission.md | mission.md |
| `/plan-project` | Plan the backlog & next spec | roadmap.md |
| `/tech-stack` | Create/update tech-stack.md | tech-stack.md |

---

## Project Dashboard

Alongside `roadmap.md`, Catalyst generates a self-contained visual panel at **`.catalyst/dashboard.html`** — double-click to open in any browser (no server, no network). It's a whole-`.catalyst/main` control panel tabbed across **Roadmap · Mission · Tech Stack · Architecture · Concerns · Conventions**.

The Roadmap tab is a Kanban board over the spec lifecycle:

```
Backlog → Planned → In Progress → Audited → Done (sealed)
```

The board shows the 4 active states as collapsible columns; **Done** is the sealed timeline below. A single **▶ Next Up** card always answers "what's the next spec?", with a copy-able command.

**It is generated by a script, not by the model.** Every lifecycle command ends with one shell call:

```bash
node .catalyst/bin/board.js --by "/forge-spec"
```

`board.js` classifies every spec folder from the files on disk (`spec.md` → Planned, `tasks.md` → In Progress, passing `validation.md` → Audited, `completed/` → Done), rewrites the lifecycle sections of `roadmap.md` while preserving your Backlog and Vision verbatim, and regenerates `dashboard.html` from the template plus the raw `.catalyst/main` docs. Zero tokens, deterministic, idempotent.

| Command | Moves the spec |
|---------|----------------|
| `/catalyze-spec` | Backlog → Planned |
| `/forge-spec` | Planned → In Progress |
| `/audit-spec` (pass) | In Progress → Audited |
| `/seal-spec` | Audited → Done |

Run `/plan-project` to re-plan the backlog (the one place a model edits `roadmap.md`), or `/sync-project` to reconcile after the fact. The lifecycle rules are defined once in the `spec-lifecycle-board` skill.

> **v3.6.0 note:** versions 3.1–3.5 had the model read a 30 KB template and re-emit the dashboard by hand on every command. That was the largest single source of token spend in the framework and is gone.

---

## Unattended Runs (`/forge-spec-worktree`)

```
/forge-spec-worktree @2026-09-02-password-reset
```

Runs **forge → audit → seal** to completion in an isolated git worktree with nobody watching. Governed by the `autopilot` skill:

- Every decision point picks the option marked **Recommended** (or derives one: spec → conventions → codebase pattern → smallest scope) and logs it to `handoff.md ## Autopilot Decisions`. Nothing ends the turn to ask.
- A failed audit gets **one** remediation pass and a re-audit.
- The chain **halts** only for: three failures on one task, a second audit failure, a `git`/`gh` error, a secret in the diff, a destructive DB change, or unresolved Open Questions in the spec. A halt writes `## Autopilot Halt` with the exact resume command.
- It ends with a pushed branch, a PR against your development branch, and the board synced.

Use plain `/forge-spec` when you want to stay in the loop between phases.

---

## Cost Discipline

A forge cycle's token bill is dominated by prose that gets re-read, not by tests. Three mechanisms keep cost proportional to the change (details in `build-orchestration`):

| Mechanism | What it does |
|-----------|--------------|
| **Size lane** | Specs touching ≤ 3 production files with no migration run in **direct mode**: no DAG, no Forger, no parallel phase — the orchestrator writes the tests and the code itself, TDD and both gates intact. |
| **tasks.md ≤ 3,000 words** | `tasks.md` is a state table (status enum + ≤ 200-char note per task). Narrative goes to `journal/{task}.md`, written by the builder, read only by the audit. |
| **Evidence tiers** | Each task row says `rg` (red-then-green, default) or `mut` (mutation-prove — only for named invariants, security/tenant boundaries, load-bearing requirements). Builders cannot escalate on their own. |

Plus two always-on rules: orchestrators **run to completion** (never end a turn to "wait"), and code comments follow a **budget** (`.claude/rules/code-comments.md`: why-only, ≤ 15-line docblocks, decisions live in `handoff.md`).

---

## Project Hub (`/meet-spec`)

Talk to your project. `/meet-spec` opens a local browser **hub** with two ways in —
both reading the codebase, docs, and web live, and both writing a `/catalyze-spec`-ready
notes artifact:

- **💬 Chat with your project** — a text conversation about your vision, ideas, and what
  you'd like to build. A thinking partner, not a formal interview. Works the same in both
  modes (local `claude -p`).
- **🎙️ Start a meeting** — a spoken spec-shaping meeting.

If you've generated a dashboard, the hub embeds it below the two options.

```
/meet-spec "realtime notifications"     # opens the hub → chat or meet → End
/catalyze-spec @.catalyst/meetings/YYYY-MM-DD-{slug}/meeting.md
```

The **meeting** has two modes (`voice.mode` in `project-config.yaml`):

| | **diy** (default) | **bundled** |
|---|---|---|
| Speech | Browser Web Speech API | ElevenLabs Conversational AI |
| Brain | Local `claude -p` | ElevenLabs agent (Claude LLM) |
| Cost | **Free** (uses your Claude) | Per-minute, BYOK key |
| Setup | None — just Chrome | API key + agent |

Both the room and the chat show **live notes** beside the conversation. On end they save
`meeting.html` (rendered, self-contained) and `meeting.md` (canonical input for
`/catalyze-spec`). Notes are written in English regardless of the conversation language
(`voice.language`, e.g. `"tr"`). Runtime lives in `.catalyst/voice/` (zero npm
dependencies). See `.catalyst/voice/README.md` for setup.

---

## Spec Folder Structure

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           <- Requirements (Scribe owns)
├── research.md       <- Research findings (Scribe compiles)
├── tasks.md          <- Task breakdown + progress (Forger owns)
├── validation.md     <- Test results (Arbiter owns)
├── handoff.md        <- Human-readable summary (Scribe owns)
└── assets/           <- Images, diagrams, mockups
```

---

## TDD Enforcement

```
  1. FORGER creates tasks.md
         │
         v
  2. ENFORCER writes ALL tests
         │
         v
  ┌──────────────────────────────────────────┐
  │  GATE 1: RED PHASE                       │
  │  All tests must FAIL                     │
  │  If any pass -> STOP                     │
  └──────────────────────────────────────────┘
         │
         v (only after gate passes)
  3. BUILDERS implement (Alchemist, Smith, Shaper)
         │
         v
  ┌──────────────────────────────────────────┐
  │  GATE 2: GREEN PHASE                     │
  │  All tests must PASS                     │
  └──────────────────────────────────────────┘
```

---

## Workspace Support

Catalyst OS detects and adapts to your workspace structure:

| Type | Detection | Example |
|------|-----------|---------|
| **Single Repo** | `.git/` in CWD, no workspace config | Standard project |
| **Monorepo** | `.git/` + pnpm-workspace.yaml / turbo.json / etc. | apps/ + packages/ |
| **Multirepo** | No `.git/` in CWD, subdirs have `.git/` | Workspace with 3 repos |

Detected during `/catalyze-project` and stored in `project-config.yaml`. Affects scoping, branching, and build strategy.

---

## Parallelization Rules

```
PARALLELIZE (No Dependencies)
──────────────────────────────
Research phase  │ Seer + Scout + Surveyor
Build phase     │ Smith + Shaper (backend + frontend)
Validation      │ Enforcer + Sentinel + Inquisitor + Watcher

RUN SEQUENTIALLY (Has Dependencies)
────────────────────────────────────
Oracle     -> All research  │ Need requirements first
Forger     -> All builders  │ Need task breakdown
Alchemist  -> Smith         │ DB schema before API
Enforcer   -> Builders      │ TDD: tests before code
```

---

## Pattern Library

Reusable implementation patterns extracted from completed specs via `/seal-spec`, `/archive-spec`, or `/sync-project`.

**Location:** `.catalyst/library/`

| Category | Keywords |
|----------|----------|
| Payments | stripe, billing, subscription |
| Authentication | oauth, sso, jwt, login |
| File Storage | s3, upload, media |
| Real-time | websocket, live updates |
| Notifications | email, push, sms |
| Search | elasticsearch, fulltext |
| Caching | redis, performance |
| Background Jobs | queue, worker, cron |
