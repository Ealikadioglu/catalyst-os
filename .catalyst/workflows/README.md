# Catalyst OS Workflows

> Visual guides for the spec-driven development lifecycle.

---

## Complete Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CATALYST OS LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │              │     │              │     │              │     │              │
  │   🔍 SHAPE   │────▶│   🔨 BUILD   │────▶│   ✓ VALIDATE │────▶│  ✅ APPROVE  │
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

## Workflow Files

| File | Command | Purpose |
|------|---------|---------|
| [catalyze-project.md](./catalyze-project.md) | `/catalyze-project` | Initialize project foundation |
| [catalyze-spec.md](./catalyze-spec.md) | `/catalyze-spec` | Shape a new specification |
| [build-spec.md](./build-spec.md) | `/build-spec` | Implement with strict TDD |
| [validate-spec.md](./validate-spec.md) | `/validate-spec` | Run quality checks |
| [approve-spec.md](./approve-spec.md) | `/approve-spec` | Finalize and archive |

---

## Agent Groups

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
│  │(Sonnet) │ │(Sonnet) │ │(Haiku)  │ │(Haiku)  │ │(Sonnet) │               │
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
│  │(Sonnet) │ │(Sonnet) │ │(Sonnet) │ │(Sonnet) │ │ (Sonnet)  │             │
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

## Quick Command Reference

| Command | When to Use | Output |
|---------|-------------|--------|
| `/catalyze-project` | Start new project | mission.md, roadmap.md, tech-stack.md |
| `/catalyze-spec "feature"` | New feature request | spec.md, research.md |
| `/build-spec @slug` | Implement feature | tasks.md (updated) |
| `/validate-spec @slug` | Quality checks | validation.md, handoff.md |
| `/approve-spec @slug` | Finalize | Commit + Archive |
| `/reject-spec @slug "reason"` | Reject implementation | Status: REJECTED |
| `/status-spec @slug` | Check progress | Current status |
| `/update-spec @slug` | Modify spec | Updated spec.md |
