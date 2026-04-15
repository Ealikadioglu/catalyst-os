# /archive-spec Workflow

> Lightweight spec archival without git ceremony.

---

## Quick Reference

```
Command:      /archive-spec @2026-01-11-supabase-auth
              /archive-spec @2026-01-11-supabase-auth "closing out"
Orchestrator: Main Agent
Agents:       Scribe (for library extraction, optional)
Output:       Archive to .catalyst/specs/completed/ + Library item (optional)

Note: No git commits, no branch management, no push suggestions.
      For full ceremony, use /seal-spec.
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /archive-spec @2026-01-11-supabase-auth                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 1: READ SPEC                     │
              │  ──────────────────                     │
              │                                         │
              │  Read spec.md, tasks.md                 │
              │  Verify spec folder exists              │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 2: UPDATE TASKS.MD               │
              │  ────────────────────────               │
              │                                         │
              │  Mark completed tasks as done           │
              │  Leave incomplete tasks as-is           │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 3: LIBRARY EXTRACTION (Optional) │
              │  ──────────────────────────────────     │
              │                                         │
              │  Auto-detect reusable patterns          │
              │  Ask user to confirm                    │
              │  If yes → Scribe extracts to library    │
              └─────────────────────────────────────────┘
                                       │
                                       ▼
              ┌─────────────────────────────────────────┐
              │  PHASE 4: ARCHIVE                       │
              │  ────────────────                       │
              │                                         │
              │  Move to completed:                     │
              │  .catalyst/specs/... → .catalyst/specs/completed/...│
              │                                         │
              │  Update spec.md status → COMPLETE       │
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

Read Spec ──▶ Update tasks.md ──▶ Library ──▶ Archive ──▶ Done!
   │               │                │           │
   │               │                │           │
 verify        mark done         extract     move to
 exists        tasks ✓           pattern    completed/
                                (optional)  + status
```
