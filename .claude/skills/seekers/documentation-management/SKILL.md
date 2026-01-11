---
name: documentation-management
description: >
  Create and maintain project documentation. TRIGGERS: writing specifications,
  compiling research findings, updating project docs.
  Scribe is the GATEKEEPER - all spec documentation goes through this skill.
---

# Documentation Management

Scribe is the **gatekeeper** for all spec documentation. Other agents hand off findings; Scribe writes to files.

> **Structure defined in:** `.catalyst/spec-structure.yaml` (single source of truth)

## Gatekeeper Role

**You are the ONLY agent that writes .md files in `.catalyst/specs/`.**

Other agents (Scout, Seer, Oracle) return structured findings to you. You:
1. Validate the target path is correct
2. Format content consistently
3. Write/update the appropriate file
4. Maintain changelogs

## Output Location

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           # You own this
├── research.md       # You compile this (from researcher findings)
├── tasks.md          # Forger owns (exception to gatekeeper rule)
├── validation.md     # Arbiter owns (exception to gatekeeper rule)
├── handoff.md        # You own this (living document)
└── assets/           # Any agent can add files
```

**Exceptions:** Forger writes tasks.md, Arbiter writes validation.md directly.

## Document Templates

### spec.md

```markdown
# {Feature Name}

> Status: DRAFT | IN_PROGRESS | COMPLETE
> Created: YYYY-MM-DD
> Last Updated: YYYY-MM-DD

## Overview
[1-2 sentence description]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Requirements

### Functional
- [ ] REQ-001: [Testable requirement]

### Non-Functional
- [ ] PERF-001: [Performance metric]
- [ ] SEC-001: [Security requirement]

## Acceptance Criteria
1. [Verifiable criterion]

## Out of Scope
- [Explicitly excluded items]

## Changelog
| Date | Change | Reason |
|------|--------|--------|
| YYYY-MM-DD | Initial spec | - |
```

### research.md

```markdown
# Research: {Feature}

## Codebase Analysis
[Date: YYYY-MM-DD]
- [From Seer]

## External Research
[Date: YYYY-MM-DD]
- [From Scout]

## Decisions
| Decision | Alternatives | Rationale |
|----------|--------------|-----------|
| [Choice] | [Options]    | [Why]     |
```

### handoff.md (Living Document)

**Created at spec start, updated throughout - not generated at end.**

```markdown
# {Feature} - Handoff

> Created: YYYY-MM-DD
> Last Updated: YYYY-MM-DD

## Summary
[What this feature does - update as understanding evolves]

## Key Decisions
| Date | Decision | Why |
|------|----------|-----|
| YYYY-MM-DD | [Choice made] | [Reasoning] |

## Architecture Notes
[How it fits into the system - add during research/build]

## Files Modified
[Add as implementation progresses]
- `path/to/file.ts` - [what changed]

## How to Test
[Add during build/validation]
1. [Step-by-step verification]

## Edge Cases & Gotchas
[Add as discovered]
- [Important behavior]

## Follow-up Items
- [ ] [Deferred work]
```

### tasks.md (Forger owns)

```markdown
# Tasks: {Feature}

> Last Updated: YYYY-MM-DD

## Task Breakdown

### Phase 1: [Name]
- [ ] TASK-001: [Description]

## Cancelled Tasks
[Scope changes - keep for history]

## Progress
| Task | Status | Tests | Notes |
|------|--------|-------|-------|

## Changelog
| Date | Change |
|------|--------|
```

### validation.md (Arbiter owns)

```markdown
# Validation: {Feature}

## Test Results
[Date: YYYY-MM-DD]

### Unit Tests
- [ ] [Test name]: PASS/FAIL

### E2E Tests
- [ ] [Test name]: PASS/FAIL

## Quality Checks
- [ ] Lint: PASS/FAIL
- [ ] Security scan: PASS/FAIL

## Issues Found
| Issue | Severity | Resolution |
|-------|----------|------------|
```

## When to Update Each File

| Situation | File | Action |
|-----------|------|--------|
| New spec | spec.md, handoff.md, research.md | Create all three |
| Requirements from Oracle | spec.md | Update requirements |
| Research from Scout/Seer | research.md | Append findings |
| Key decision made | handoff.md | Add to Decisions table |
| Scope change | spec.md, handoff.md | Update + changelog |
| Implementation note | handoff.md | Add to Architecture/Files |
| Gotcha discovered | handoff.md | Add to Edge Cases |
