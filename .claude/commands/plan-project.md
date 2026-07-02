# /plan-project

Plan the future of the project: maintain `roadmap.md` as a **queue of specs grouped by lifecycle state**, with a single clear next action.

> **Companion to `/sync-project`.** `/plan-project` plans what's *not yet started* (Backlog, ordering, Next Up direction); `/sync-project` reconciles what's *already done* (archives finished specs). Plan the future, sync the past.

## Usage

```
/plan-project              # Create new or update existing
/plan-project "Q1 focus"   # Update with specific direction
```

## Core Principle

**The roadmap is a queue of specs, not a checklist of tasks.**

- One entry = one spec = one forge cycle (one PR-sized unit of work).
- Tasks belong in each spec's `tasks.md` — never in the roadmap.
- Sections are **lifecycle states**, not time horizons. A spec moves across the board as it progresses: `Backlog → Planned → In Progress → Audited → Done`.
- There is always exactly **one `▶ Next Up`** so "what's the next spec?" is answerable at a glance.

> The lifecycle, state detection, next-command resolution, and dashboard generation are defined once in the **`spec-lifecycle-board`** skill — load it and treat it as the source of truth. This command owns the *planning* judgment (backlog ideas, ordering, Next Up direction).

## Workflow

1. **Read** `.catalyst/main/mission.md` for context
2. **Read existing** `.catalyst/main/roadmap.md` if present
3. **Scan specs** in `.catalyst/specs/` and `.catalyst/specs/completed/` to determine the state of each
4. **Analyze** codebase for current feature state
5. **Ask** about priorities and ordering:
   - What's the single most important thing next?
   - What's blocking progress?
   - In what order should the backlog be built?
6. **Classify** each spec into a lifecycle bucket (see State Detection below)
7. **Resolve** the next command for each entry
8. **Order the Backlog** — it is a ranked queue; #1 is what becomes Next Up once the board clears
9. **Set `▶ Next Up`** using the resolution rule below
10. **Create/Update** the roadmap using the template at `.catalyst/main/temp/temp-roadmap.md`
11. **Regenerate the dashboard** — write `.catalyst/main/dashboard.html` (see Dashboard below)

## State Detection & Next Up

Use the **State Detection** table and **`▶ Next Up` Resolution** rule from the `spec-lifecycle-board` skill (the single source). In short: five states — 🗂️ Backlog · 📋 Planned · 🔨 In Progress · 🔬 Audited · ✅ Done — detected from the spec folder's files, and Next Up = the spec closest to Done (Audited → In Progress → Planned → Backlog #1).

## Granularity Guardrail

Before writing any entry, check its size:

- If it would need **more than ~5-8 tasks**, or spans **multiple subsystems** (e.g. backend + frontend + migrations as separable pieces), it is **too big for one spec** → split it into multiple ordered Backlog entries.
- Replace task checklists with a one-line **Scope** + a **Done when** acceptance criterion. Detailed tasks are `tasks.md`'s job, produced later by `/forge-spec`.
- Every Backlog entry gets a `Catalyze as: {slug}` hint so naming is decided up front, plus a seed prompt ready to hand to `/catalyze-spec`.

## Backlog Ordering

The Backlog is a **ranked queue** — the number is the priority. Order by:
1. Dependencies (a spec can't precede what it depends on — note `Depends on:` per entry)
2. Unblocking value (what makes the product usable / lets other work proceed)
3. Priority label (🔴 → 🟢)

## Output Format

`.catalyst/main/roadmap.md` — uses the structure defined in `.catalyst/main/temp/temp-roadmap.md`:

- `▶ Next Up` — the single next action
- `🗂️ Backlog` — ordered queue of not-yet-catalyzed specs
- `📋 Planned` — catalyzed, ready to forge
- `🔨 In Progress` — being built (keep to 0-1, WIP limit)
- `🔬 Audited` — validated, awaiting seal
- `✅ Done` — sealed specs, for closure and history
- `Vision / Someday` — strategic goals not yet ready to be specs

## Dashboard

Also (re)generate the visual, browser-openable panel at `.catalyst/main/dashboard.html` — a **whole-`.catalyst/main` control panel** tabbed across **Roadmap / Mission / Tech Stack / Architecture / Concerns**. Follow **Generating `dashboard.html`** in the `spec-lifecycle-board` skill for the full `DATA` schema and steps (set `generatedBy: "/plan-project"`). The board shows the 4 active states as collapsible columns; **Done** is the timeline below it.
