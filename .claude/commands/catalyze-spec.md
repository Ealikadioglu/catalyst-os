# /catalyze-spec

Shape a new specification from a feature request.

## Usage

```
/catalyze-spec "integrate stripe for subscriptions"
/catalyze-spec @existing-spec  # Continue shaping an existing spec
/catalyze-spec "password reset" --from /abs/path/to/plan.md  # Unattended: plan file is the source of truth
```

`--from <path>` switches on **unattended mode** (spec-shaping, *Unattended Mode*): no brainstorming questions, no section approvals, no git. Without `--from` the flow is interactive as below.

---

**Invoke skill:** `spec-shaping`

**Orchestrator:** Catalyst (delegates to Oracle, Seer, Scout, Surveyor, Scribe)

**Process skills used:** `brainstorming`, `agent-delegation` (with `--from`: `autopilot` instead of `brainstorming`)
