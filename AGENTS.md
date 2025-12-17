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
| Build phase | Smith + Shaper (backend + frontend) |
| Validation phase | Inquisitor + Watcher + Sentinel |

### ❌ Run Sequentially (Has Dependencies)

| First | Then | Why |
|-------|------|-----|
| Forger | All builders | Need task breakdown first |
| Alchemist | Smith | DB schema before API that uses it |
| Enforcer | Builders | TDD: tests before implementation |

### Example: Build Phase

```
WRONG (Sequential):
  alchemist → smith → shaper → enforcer

CORRECT (Parallel where possible):
  alchemist (DB) ─────────────────────────►
                  ├── smith (Backend) ────► } PARALLEL
                  └── shaper (Frontend) ──► } PARALLEL
```

**When in doubt**: If two agents don't share data dependencies, spawn them in parallel.

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

**CRITICAL: Never create random .md files. All documentation goes to structured locations only.**

### Spec Folder Structure

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── SPEC.md           # Requirements + overview + status
├── research.md       # All research findings (append-only)
├── tasks.md          # Task breakdown + progress tracking
├── validation.md     # Test results + quality checks
├── HANDOFF.md        # Final walkthrough (generated on completion)
└── assets/           # Images, diagrams, mockups
```

### File Ownership

| File | Owner | When Updated |
|------|-------|--------------|
| `SPEC.md` | Scribe | Requirements change |
| `research.md` | Scout, Seer, Oracle | New findings discovered |
| `tasks.md` | Forger | Task breakdown, progress updates |
| `validation.md` | Arbiter, Inquisitor, Sentinel | Test execution |
| `HANDOFF.md` | Arbiter | Spec completion (final artifact) |

### Rules

1. **UPDATE > CREATE** — Always update existing files before creating new ones
2. **No root-level docs** — Never create .md files in project root (except README.md)
3. **No orphan docs** — Every document must belong to a spec folder
4. **Append to research.md** — Don't create separate research files, append findings
5. **Delegate to Scribe** — When unsure about documentation, delegate to Scribe
