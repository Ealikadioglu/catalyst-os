# /catalyze-project Workflow

> Initialize project foundation with mission, roadmap, and tech stack.

---

## Quick Reference

```
Command:    /catalyze-project
Orchestrator: Catalyst (Opus)
Agents:       Oracle, Seer, Scribe
Output:       .catalyst/main/
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           /catalyze-project                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎯 CATALYST (Orchestrator)                                                 │
│  ─────────────────────────                                                  │
│  Coordinates all phases and delegates to specialized agents                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  PHASE 1          │   │  PHASE 2          │   │  PHASE 3          │
│  DISCOVERY        │   │  MISSION          │   │  ROADMAP          │
└───────────────────┘   └───────────────────┘   └───────────────────┘
          │                         │                         │
          ▼                         ▼                         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  PHASE 4          │   │                   │   │                   │
│  TECH STACK       │──▶│      OUTPUT       │──▶│   NEXT STEPS      │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

---

## Phase Details

### Phase 1: Discovery

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 DISCOVERY                                                   │
│  ─────────────                                                  │
│                                                                 │
│  Catalyst scans the codebase to understand:                     │
│                                                                 │
│    ├── Project structure                                        │
│    ├── Package files (package.json, requirements.txt, etc.)     │
│    ├── Existing documentation                                   │
│    ├── Git history                                              │
│    └── Configuration files                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Mission Creation

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 MISSION CREATION                                            │
│  ────────────────────                                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🔮 ORACLE (Requirement Elicitation)                     │   │
│  │                                                          │   │
│  │  Asks 3-5 clarifying questions:                          │   │
│  │                                                          │   │
│  │    ❓ What problem does this project solve?              │   │
│  │    ❓ Who are the primary users?                         │   │
│  │    ❓ What makes this unique?                            │   │
│  │    ❓ What are the key success metrics?                  │   │
│  │                                                          │   │
│  │  ⏳ Waits for user responses                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📜 SCRIBE (Documentation)                               │   │
│  │                                                          │   │
│  │  Creates: .catalyst/main/mission.md                      │   │
│  │                                                          │   │
│  │    • Project vision                                      │   │
│  │    • Core value proposition                              │   │
│  │    • Target users                                        │   │
│  │    • Success criteria                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Roadmap Creation

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 ROADMAP CREATION                                            │
│  ────────────────────                                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🔮 ORACLE                                               │   │
│  │                                                          │   │
│  │  Asks about:                                             │   │
│  │    ❓ Planned features?                                  │   │
│  │    ❓ Priorities?                                        │   │
│  │                                                          │   │
│  │  ⏳ Waits for user responses                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📜 SCRIBE                                               │   │
│  │                                                          │   │
│  │  Creates: .catalyst/main/roadmap.md                      │   │
│  │                                                          │   │
│  │    • Current State (existing features)                   │   │
│  │    • Short-Term Goals (1-3 months)                       │   │
│  │    • Medium-Term Goals (3-6 months)                      │   │
│  │    • Long-Term Vision (6+ months)                        │   │
│  │    • Changelog                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Tech Stack Documentation

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 TECH STACK DOCUMENTATION                                    │
│  ────────────────────────────                                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  👁️ SEER (Codebase Analysis)                             │   │
│  │                                                          │   │
│  │  Analyzes existing code:                                 │   │
│  │                                                          │   │
│  │    • Frontend framework and libraries                    │   │
│  │    • Backend framework and services                      │   │
│  │    • Database and storage                                │   │
│  │    • Infrastructure and deployment                       │   │
│  │    • Development tools                                   │   │
│  │    • Key architectural decisions                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📜 SCRIBE                                               │   │
│  │                                                          │   │
│  │  Creates: .catalyst/main/tech-stack.md                   │   │
│  │                                                          │   │
│  │    • Frontend technologies                               │   │
│  │    • Backend technologies                                │   │
│  │    • Database/storage                                    │   │
│  │    • Infrastructure                                      │   │
│  │    • Development tools                                   │   │
│  │    • Key architectural decisions                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output

```
✅ Project initialized!

Created:
├── .catalyst/main/mission.md      ← Project vision & success criteria
├── .catalyst/main/roadmap.md      ← Feature roadmap with priorities
└── .catalyst/main/tech-stack.md   ← Technology documentation

➡️  Next: Run /catalyze-spec "feature description"
```

---

## Agents Involved

| Agent | Role | Model | What They Do |
|-------|------|-------|--------------|
| **Catalyst** | Orchestrator | Opus | Coordinates all phases |
| **Oracle** | Requirements | Sonnet | Asks clarifying questions |
| **Seer** | Analysis | Sonnet | Analyzes existing codebase |
| **Scribe** | Documentation | Sonnet | Creates all markdown files |

---

## Execution Flow

```
SEQUENTIAL EXECUTION (each phase depends on previous)

   Discovery ──▶ Mission ──▶ Roadmap ──▶ Tech Stack ──▶ Done!
       │            │            │            │
       │            │            │            └── Seer + Scribe
       │            │            └── Oracle + Scribe
       │            └── Oracle + Scribe
       └── Catalyst scans
```
