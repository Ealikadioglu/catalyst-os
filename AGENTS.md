# Agent Registry

Quick reference for all agents and their skills.

> 📋 **Rule**: Artifacts are always in English — see [Language Policy](#language-policy) below.

---

## Parallel Execution Strategy

**CRITICAL**: Always spawn multiple agents in parallel when their tasks are independent.

### ✅ Parallelize These (No Dependencies)

| Scenario | Run Together |
|----------|--------------|
| Research phase | Oracle + Seer + Scout + Surveyor |
| Build phase | Smith × N + Shaper × M (multiple instances) |
| Validation phase | Inquisitor + Watcher + Sentinel |

### ❌ Run Sequentially (Has Dependencies)

| First | Then | Why |
|-------|------|-----|
| Forger | All builders | Need task breakdown (DAG) first |
| Alchemist | Smith/Shaper | DB schema before API/UI that uses it |
| Enforcer | Builders | TDD: tests before implementation |
| Contracts | Parallel work | Shared types before parallel divergence |

### Multi-Instance Parallelization (DAG-Based)

Forger creates a **Build DAG** that identifies:
- **Scope boundaries** — exclusive file ownership per agent instance
- **Dependencies** — which tasks block others
- **Parallel opportunities** — tasks that can run simultaneously

```
OLD (Single instance per type):
  alchemist → smith → shaper

NEW (Multiple instances with scope isolation):
  alchemist (DB) ─────────────────────────────────────►
                  │
                  └── contracts (shared types) ───────►
                          │
                          ├── smith-1 (api/auth/**) ──► }
                          ├── smith-2 (api/posts/**) ─► } PARALLEL
                          ├── shaper-1 (pages/profile) ► } (5 agents)
                          ├── shaper-2 (pages/feed) ───► }
                          └── shaper-3 (pages/settings) ►
```

### Scope Isolation Rules

Each parallel agent has:
- **Scope**: Files it can write (exclusive)
- **Reads**: Files it can read but NOT modify (shared)

```yaml
# Example from tasks.md
api-auth:
  agent: smith-1
  scope: [src/api/auth/**, tests/api/auth/**]
  reads: [src/types/**]

api-posts:
  agent: smith-2
  scope: [src/api/posts/**, tests/api/posts/**]
  reads: [src/types/**]
```

**CRITICAL**: Parallel tasks MUST have non-overlapping scopes. If scopes overlap → make sequential.

### Phase Gates

```
Phase 1: Foundation (alchemist)
    └── GATE: schema tests pass
Phase 2: Contracts (smith single)
    └── GATE: type-check passes
Phase 3: Parallel (smith × N, shaper × M)
    └── GATE: ALL parallel tests pass
Phase 4: Integration (enforcer)
    └── GATE: integration tests pass
```

**When in doubt**: If two agents don't share data dependencies AND have non-overlapping scopes, spawn them in parallel.

---

## CATALYSTS (Orchestrators)

| Agent | Skills |
|-------|--------|
| [Catalyst](.claude/agents/catalyst.md) | `spec-orchestration` |
| [Forge-Master](.claude/agents/forge-master.md) | `build-orchestration` |
| [Arbiter](.claude/agents/arbiter.md) | `validation-orchestration` |

## SEEKERS (Research)

| Agent | Skills |
|-------|--------|
| [Oracle](.claude/agents/oracle.md) | `requirement-elicitation` |
| [Scribe](.claude/agents/scribe.md) | `documentation-management` |
| [Seer](.claude/agents/seer.md) | `codebase-analysis`, `context7-lookup` |
| [Scout](.claude/agents/scout.md) | `web-research`, `github-research`, `reddit-research` |
| [Surveyor](.claude/agents/surveyor.md) | `figma-analysis`, `ui-pattern-hunting` |

## TECHNOLOGISTS (Builders)

| Agent | Skills |
|-------|--------|
| [Forger](.claude/agents/forger.md) | `task-breakdown` |
| [Smith](.claude/agents/smith.md) | `api-development`, `service-implementation` |
| [Shaper](.claude/agents/shaper.md) | `react-development`, `ui-component-building` |
| [Alchemist](.claude/agents/alchemist.md) | `schema-design`, `migration-creation` |
| [Necromancer](.claude/agents/necromancer.md) | `ml-pipeline`, `ai-integration` |

## GUARDIANS (Quality)

| Agent | Skills |
|-------|--------|
| [Enforcer](.claude/agents/enforcer.md) | `unit-test-writing`, `test-fixture-creation` |
| [Sentinel](.claude/agents/sentinel.md) | `e2e-test-execution`, `browser-automation` |
| [Inquisitor](.claude/agents/inquisitor.md) | `lint-checking`, `code-review` |
| [Watcher](.claude/agents/watcher.md) | `dependency-audit`, `secret-scanning` |

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

> **Structure defined in:** `.catalyst/spec-structure.yaml` (single source of truth)

### Enforcement

**NEVER** use Write/Edit tools directly for `.md` files in `.catalyst/specs/`.
**ALWAYS** delegate documentation tasks to **Scribe** agent.

Scribe is the gatekeeper. This ensures:
- Correct file locations
- Consistent formatting
- No orphan documents

### Quick Reference

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md        → Scribe owns
├── research.md    → Scribe compiles (researchers hand off findings)
├── tasks.md       → Forger owns
├── validation.md  → Arbiter owns
├── handoff.md     → Scribe owns (living document, updated throughout)
└── assets/        → Any agent
```

### Rules

1. **Scribe is gatekeeper** — All .md writes in specs go through Scribe
2. **Researchers hand off** — Scout/Seer/Oracle give findings to Scribe, don't write directly
3. **handoff.md is living** — Updated throughout, not generated at end
4. **See spec-structure.yaml** — For full structure details
