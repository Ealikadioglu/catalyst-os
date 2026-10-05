# /roadmap-json

Create `.catalyst/main/roadmap.json`: a flat, machine-readable view of the roadmap for orchestrators that run the lifecycle unattended (catalyze → forge → audit → seal, then review → merge outside Catalyst).

## Usage

```
/roadmap-json
```

## Workflow

Run one command and paste its summary:

```bash
node .catalyst/bin/board.js --by "/roadmap-json" --json
```

If it prints `Board: skipped — no roadmap.md`, say the project has no roadmap yet and point to `/plan-project`. Do nothing else.

Once `roadmap.json` exists, every lifecycle command refreshes it through the same `board.js` call. Running `/roadmap-json` again is only needed to recreate a deleted file.

## What it contains

`roadmap.md` stays the planning source. `roadmap.json` is derived from it and from disk on every run. Never edit it by hand.

| Field | Meaning |
|-------|---------|
| `context` | Paths to `mission.md`, `tech-stack.md`, `architecture.md`, the plan, `.catalyst/references`… (paths only, never content) |
| `autopilot` | `base_branch` autopilot PRs target and `auto_merge` (from `project-config.yaml → autopilot`) |
| `next` | The single next spec and the command to run for it |
| `specs[]` | Every spec in one flat list: `id`, `status` (`done` · `audited` · `in-progress` · `planned` · `backlog` · `vision`), `title`, `goal`, `requires`, `ready`, `blocked_by`, `folder`, `sealed`, `command` |

`ready: true` means every `requires` entry is `done`. An orchestrator may start any ready spec, not only `next`. Backlog entries keep their roadmap order.
