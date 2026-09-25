---
name: spec-shaping
description: Turn a feature request into a specification with requirements, design, and a build DAG, orchestrating the Seeker agents. Use for /catalyze-spec.
---

# Spec Shaping

> **When to invoke:** When shaping a new specification from a feature request.
> **Invoked by:** `/catalyze-spec` command.
> **Orchestrator:** Catalyst agent.

## Purpose

Orchestrate the full spec-shaping workflow: requirements gathering, research, design validation, and spec compilation.

## Skills Referenced

- `brainstorming` — Oracle uses during requirement gathering
- `agent-delegation` — Orchestrator follows delegation rules

## Output Location

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           # Scribe writes
├── research.md       # Scribe writes, compiled from researcher responses
├── handoff.md        # Living document, updated throughout
└── assets/           # Images, diagrams, mockups
```

**Scribe is the only agent that writes here.** Researchers return findings in their responses.
Give every researcher prompt the sentence "Return findings in your response; write no file",
because a researcher left to choose invents `research-codebase.md` and nothing downstream reads it.

Scribe's own prompts carry the exact path:
- "Compile the findings below into `.catalyst/specs/{slug}/research.md`"
- "Create spec.md at `.catalyst/specs/{slug}/spec.md`"

## Parallel Execution

```
WRONG:  oracle → seer → scout → surveyor (one by one)
RIGHT:  oracle → [seer + scout + surveyor] (parallel research)
```

| Independent (Parallelize) | Dependent (Sequential) |
|---------------------------|------------------------|
| Seer + Scout + Surveyor | Oracle → All (need requirements first) |
| All research agents | Research → Scribe (compile after) |

## Unattended Mode (`--from`)

`/catalyze-spec "<description>" --from <path-to-plan.md>` shapes a spec with nobody watching, for callers (a kanban factory, `claude -p`) whose product decisions already live in a plan file. Without `--from`, skip this section: the phases below run as written.

The plan is the product source of truth. Its decisions are given; never re-ask them. Load the `autopilot` skill (section *Catalyze*): its decision policy and `## Autopilot Decisions` table apply here.

| Phase | Change in unattended mode |
|-------|---------------------------|
| Start | Resolve the path (relative → against cwd; log it as a decision). Unreadable file → stop with one line: `error: cannot read plan <path>`. |
| 0–1 | Unchanged. |
| 2 | Oracle runs in **plan-extraction mode** (prompt below). It asks nothing. |
| 3–4 | Unchanged, parallel. |
| 5 | **Skipped.** Sort every gap Oracle returned (next table). No "Does this look right so far?". |
| 6 | Scribe writes `spec.md` with `plan: <absolute path>` in frontmatter, `research.md`, and `handoff.md` starting with `**Mode:** AUTOPILOT (catalyze)` plus the `## Autopilot Decisions` table. |
| Git | None. No branch, no commit. |
| Board | Unchanged (file-only). |

Oracle prompt: *"PLAN-EXTRACTION MODE — ask the user nothing. Read `<plan path>`. Return requirements in your usual Output format, then `### Gaps`: every question the plan does not answer, one line each, with your recommended answer."*

Sort each gap:

| Gap is… | Do |
|---------|----|
| Technical (library, file layout, pattern, default value) | Decide by autopilot's precedence (plan → conventions/tech-stack → codebase → smallest scope). One table row, Phase `catalyze`. |
| **Blocking**: a product ambiguity the plan leaves open, an irreversible choice, or one with cost impact | Blocking question (below). |

When in doubt, it is technical. A blocking question stops an unattended pipeline; spend one only when a wrong guess would ship the wrong product or cost money.

**Blocking questions.** Scribe writes them to `spec.md ## Open Questions` first, one bullet each. Then ask all of them in **one** message and end the turn. If the answer comes in the same session, patch `spec.md`, mark each bullet `~~question~~ Resolved: <answer>`, add a decision row per answer, and finish. A headless run simply ends there; `/forge-spec` refuses to start until the questions are resolved. With no blocking questions, `## Open Questions` reads `None.`

**Final message** (replaces *Output* below). Key-value lines first, so a caller can grep them; one `spec_dir`/`slug` pair per spec if the plan yields several:

```
spec_dir: .catalyst/specs/YYYY-MM-DD-{slug}
slug: YYYY-MM-DD-{slug}
open_questions: 0
decisions: 4
board: {board.js summary line}

| # | Phase | Decision point | Chosen | Alternatives | Why |
|---|-------|----------------|--------|--------------|-----|
{every row of handoff.md ## Autopilot Decisions}

{if open_questions > 0: the questions, numbered}
```

## Workflow

### Phase 0: Roadmap Impact Assessment

1. Read `.catalyst/main/roadmap.md` if present
2. Analyze request scope:
   - **Small**: Minor feature, bug fix → proceed directly
   - **Large**: Major feature, architectural change → update roadmap first
3. Update roadmap if large request impacts it

### Phase 1: Initialize Spec Folder

Create the spec structure:
```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md
├── research.md
├── handoff.md
└── assets/
```

### Phase 2: Requirements Gathering (Oracle)

> `--from`: plan-extraction mode instead. See *Unattended Mode*.

Spawn Oracle agent:
```
"Gather requirements for [feature]. Hand off findings to Scribe for spec.md creation at:
.catalyst/specs/{YYYY-MM-DD-slug}/spec.md"
```

Oracle will use the `brainstorming` skill:
1. Ask questions one at a time
2. Present multiple choice with recommendations
3. Maximum 3 rounds of 3 questions
4. Hand off synthesized requirements

### Phase 3: Research (Seer + Scout) — PARALLEL

Researchers **return findings in their response**. They write no file. Scribe compiles `research.md`
in Phase 6, and Scribe is the only writer. A researcher that writes its own file produces something
nothing downstream reads: `build-orchestration` does not read `research.md`, `spec-validation` does
not mention it, and `/primer-spec` reads its first 30 lines.

Spawn in parallel, and put the shape in the prompt:

```
Seer: "Analyze the codebase for [feature]. Return findings in your response;
write no file. Each finding: one claim, one `file:line`, one line on what it
changes for the spec. Report the integration points and the patterns this
feature must follow. Skip anything the spec will not act on."

Scout: "Research [specific question] for [feature]. Return findings in your
response; write no file. Each finding: one claim, one URL to a primary source
(official docs, source, spec), one line on what it changes for the spec.
Skip anything the spec will not act on."
```

Give Scout a **question**, not a topic. "Research best practices for X" has no stopping condition,
which is how a researcher ends up returning an essay.

### Phase 4: UI Research (Surveyor) — If Applicable

```
Surveyor: "Research UI patterns for [feature]. Return findings in your response;
write no file. Put any image or mockup under .catalyst/references/ and cite the
path. Each finding: the pattern, where you saw it, what it changes for the spec."
```

### Phase 5: Design Validation (Orchestrator — Direct)

> `--from`: skipped. See *Unattended Mode*.

**Before compiling the final spec, validate the proposed design with the user.**

This phase is handled directly (no agent spawn):

1. Synthesize findings from Oracle, Seer, Scout, Surveyor
2. Present the proposed design in sections (200-300 words each):
   - Architecture overview
   - Key components and data flow
   - Technical approach (based on research)
   - Edge cases and error handling
3. After each section, ask: "Does this look right so far?"
4. If pushback: adjust and re-present that section
5. If approved: proceed to Scribe compilation

**Why:** Catches misunderstandings before they become a full spec document.

### Phase 6: Compile Specification (Scribe)

Spawn Scribe:
```
"Compile specification from gathered research and VALIDATED design. Create spec.md at:
.catalyst/specs/{slug}/spec.md"
```

### Spec Template

```markdown
# {Feature Name}

> Status: DRAFT

## Overview
[Brief description]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Requirements

### Functional
- [ ] REQ-001: Description

### Non-Functional
- [ ] PERF-001: Response time < 200ms
- [ ] SEC-001: Data encrypted at rest

## Acceptance Criteria
1. [Verifiable criterion]

## Technical Approach
[Based on research findings]

## Out of Scope
- [Explicitly excluded items]

## Open Questions
- [Any remaining unknowns]
```

## Output

```
Spec shaped successfully!

Created: .catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md      <- Requirements documented
├── research.md  <- Research findings
├── handoff.md   <- Living document
└── assets/      <- UI references (if any)

REMINDER: /forge-spec follows strict TDD
  1. Tests written FIRST (Enforcer)
  2. Tests must FAIL (red phase)
  3. Then implement (Builders)
  4. Tests must PASS (green phase)

Next steps:
- /challenge-spec @YYYY-MM-DD-{slug} (optional) to interrogate every branch before tests are written
- /forge-spec @YYYY-MM-DD-{slug} to start TDD build
```

**IMPORTANT: Do NOT suggest `/seal-spec` after spec shaping.** `/seal-spec` is only for committing a fully built and validated implementation — it is the FINAL step, not a plan-approval step. The correct flow is: `/catalyze-spec` → *(optional)* `/challenge-spec` → `/forge-spec` → `/audit-spec` → `/seal-spec`.

## Board Sync (final step)

The spec just moved **Backlog → Planned**. Run the board script — it derives the state from disk and regenerates `roadmap.md` + `dashboard.html` deterministically. Never hand-write either file.

```bash
node .catalyst/bin/board.js --by "/catalyze-spec"
```
Paste its 4-line summary into your report. If it prints `skipped — no roadmap.md`, say so in one line and move on.
