# /sync-project Workflow

> Batch sync spec statuses with reality and archive completed work.

---

## Quick Reference

```
Command:      /sync-project
              /sync-project "focus on auth"
Orchestrator: Main Agent
Agents:       Scribe (for library extraction, optional)
Output:       Updated tasks.md files + archived completed specs
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              /sync-project                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 1: SCAN ACTIVE SPECS             │
              │  ─────────────────────────              │
              │                                         │
              │  List .catalyst/specs/*/                 │
              │  Read spec.md, tasks.md, validation.md  │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 2: DETECT ACTUAL STATE           │
              │  ───────────────────────────            │
              │                                         │
              │  Check git history, test results,       │
              │  file existence for each spec           │
              │  Classify: Complete / In Progress /     │
              │            Stale / Draft                │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 3: PRESENT FINDINGS              │
              │  ────────────────────────               │
              │                                         │
              │  Show sync report to user               │
              │  Ask which specs to archive             │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 4: ARCHIVE CONFIRMED SPECS       │
              │  ───────────────────────────────        │
              │                                         │
              │  Update tasks.md + spec.md status       │
              │  Move to .catalyst/specs/completed/     │
              │  Check for library patterns             │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 5: UPDATE ROADMAP (Optional)     │
              │  ─────────────────────────────          │
              │                                         │
              │  Update roadmap.md with new statuses    │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │              OUTPUT                     │
              └─────────────────────────────────────────┘
```

---

## Execution Flow

```
SEQUENTIAL EXECUTION

Scan ──▶ Detect ──▶ Present ──▶ Archive ──▶ Roadmap ──▶ Done!
  │         │          │           │           │
  │         │          │           │           │
list     classify   show user   move to    update
specs    by state   ask which  completed/  statuses
```
