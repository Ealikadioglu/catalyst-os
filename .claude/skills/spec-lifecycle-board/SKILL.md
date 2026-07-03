# Spec Lifecycle Board

> **When to invoke:** After ANY spec lifecycle transition (catalyze / forge / audit / seal), and whenever the roadmap or dashboard must reflect reality.
> **Invoked by:** `spec-shaping`, `build-orchestration`, `spec-validation`, `spec-archival`, `project-sync`, `project-initialization`, and the `/plan-project` command.

This skill is the **single source of truth** for the spec lifecycle, its board buckets, next-command resolution, and how the visual `dashboard.html` is generated. Everything that touches the board reads from here so the model never drifts across commands.

## The Lifecycle

```
Backlog → Planned → In Progress → Audited → Done (sealed)
```

| State | Meaning | How to detect | Next command |
|-------|---------|---------------|--------------|
| 🗂️ **Backlog** | Idea, not yet catalyzed | No spec folder; only a roadmap entry | `!/catalyze-spec "{seed prompt}"` |
| 📋 **Planned** | Catalyzed, ready to build | `spec.md` exists, no `tasks.md` | `!/forge-spec @{slug}` |
| 🔨 **In Progress** | Being built (TDD) | `tasks.md` exists, no `validation.md` | `!/audit-spec @{slug}` |
| 🔬 **Audited** | Validated, awaiting seal | `validation.md` exists, not sealed | `!/seal-spec @{slug}` |
| ✅ **Done** | Sealed / archived | In `.catalyst/specs/completed/` | (none) |

**Board vs. Done:** the Kanban board shows the **4 active** states (Backlog · Planned · In Progress · Audited) as columns. **Done** is the sealed timeline **below** the board — it is not a column (4 columns is the max that fits comfortably).

## Transition Trigger

Each lifecycle command moves exactly one spec one step to the right:

| Command | Transition | Board effect |
|---------|-----------|--------------|
| `/catalyze-spec` | Backlog → Planned | Remove backlog entry, add Planned entry |
| `/forge-spec` | Planned → In Progress | Move entry to In Progress |
| `/audit-spec` | In Progress → Audited | Move entry to Audited (only if audit PASSED) |
| `/seal-spec` | Audited → Done | Move entry to the Done timeline |

After the transition, the invoking skill calls **Update the Board** below. Do not re-plan or re-order the Backlog on a transition — that is `/plan-project`'s job.

## `▶ Next Up` Resolution

Pick exactly ONE spec for the top pointer, scanning right-to-left (closest to done first):

```
IF anything is Audited      → Next Up = that spec (seal it)
ELSE IF anything In Progress → that spec (finish it)
ELSE IF anything Planned      → highest-priority Planned spec (forge it)
ELSE                          → Backlog #1 (catalyze it)
```

Render as: spec name + one-line why + resolved command.

## Update the Board

Two artifacts stay in sync — `roadmap.md` (source) and `dashboard.html` (view).

1. **`roadmap.md`** — move the spec's entry to its new lifecycle section (see `/plan-project` for the section layout). On a single transition, touch only the moved entry and re-resolve `▶ Next Up`.
2. **`dashboard.html`** — regenerate (see below).

## Generating `dashboard.html`

A self-contained, offline, browser-openable panel covering the **whole `.catalyst/main`**.

1. Read the template `.catalyst/main/temp/temp-dashboard.html`.
2. Copy it verbatim to `.catalyst/dashboard.html`, replacing **only** the block between `// === DATA:START` and `// === DATA:END` with a `const DATA = {…}` object. **Never edit the CSS/JS below the data block.**
3. Build `DATA` from the `.catalyst/main` docs (skip any that don't exist — the tab/section auto-hides):
   - Top: `project`, `tagline` (mission vision one-liner), `generated` (today), `generatedBy` (the command that ran)
   - `roadmap` (from `roadmap.md`): `nextUp {name,why,command}`; and five arrays — `backlog` (ordered `[{rank,name,slug,scope,doneWhen,dependsOn,priority,command}]`), `planned`/`inProgress`/`audited` (`[{name,slug,scope,doneWhen,command}]`), `done` (`[{name,slug,date}]`); plus `vision [{goal,description,prereq}]`
   - `mission` (from `mission.md`): `vision`, `pain[]`, `whoSuffers[]`, `coreValue[]`, `differentiators[]`, `targetUsers[{persona,description,need}]`, `metrics[{metric,target,timeline}]`, `qualitativeGoals[]`, `nonGoals[]`
   - `techStack` (from `tech-stack.md`): `overview`, `groups[{category,items[{name,version,purpose,docs}]}]`, `decisions[{id,title,context,decision,consequences}]`
   - `architecture` (from `architecture.md`): `overview`, `layers[{layer,location,responsibility}]`, `patterns[{name,purpose,location}]`, `entryPoints[{name,location,purpose}]`, `keyFiles[{purpose,file}]`
   - `concerns` (from `concerns.md`): `summary{critical,high,medium,low}`, `issues[{id,title,severity,type,location,description,fix}]`, `techDebt[{id,location,description,effort}]`, `security[{area,status,notes}]`, `knownBugs[{id,description,location,priority}]`
4. Set each item's `command` from the next-command column above (Audited → `!/seal-spec`, etc.).
5. Keep `DATA` a **valid JS object literal** — quote strings, escape embedded quotes. Omit a field with `[]`/`null` rather than inventing content.

On a single spec transition you may keep the other tabs' `DATA` as-is from the existing `dashboard.html` and only update the `roadmap` block + `generated`/`generatedBy` — but a full rebuild from the docs is always safe.
