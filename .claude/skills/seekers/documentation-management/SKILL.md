---
name: documentation-management
description: >
  Create and maintain project documentation. TRIGGERS: writing specifications,
  compiling research findings, creating requirements.md, updating project docs.
---

# Documentation Management

Create and maintain structured documentation within the spec folder system.

## Output Location

**CRITICAL: All documentation goes to `.catalyst/specs/YYYY-MM-DD-{slug}/`**

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── SPEC.md           # Requirements + overview + status
├── research.md       # All research findings (append-only)
├── tasks.md          # Task breakdown + progress tracking
├── validation.md     # Test results + quality checks
├── HANDOFF.md        # Final walkthrough (generated on completion)
└── assets/           # Images, diagrams, mockups
```

**Rules:**
- UPDATE existing files, never create new random .md files
- Append to research.md, don't create separate research files
- No .md files outside spec folders (except root README.md)

## Document Templates

### SPEC.md

```markdown
# {Feature Name}

> Status: DRAFT | IN_PROGRESS | COMPLETE
> Created: YYYY-MM-DD
> Last Updated: YYYY-MM-DD

## Overview
[1-2 sentence description of what this feature does]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Requirements

### Functional
- [ ] REQ-001: [Testable requirement]
- [ ] REQ-002: [Testable requirement]

### Non-Functional
- [ ] PERF-001: [Performance metric]
- [ ] SEC-001: [Security requirement]

## Acceptance Criteria
1. [Verifiable criterion]
2. [Verifiable criterion]

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
- [Relevant patterns found]
- [Existing code to leverage]

## External Research
[Date: YYYY-MM-DD]
- [Best practices discovered]
- [Library/API findings]

## Decisions
| Decision | Alternatives | Rationale |
|----------|--------------|-----------|
| [Choice] | [Options]    | [Why]     |
```

### tasks.md

```markdown
# Tasks: {Feature}

> Last Updated: YYYY-MM-DD

## Task Breakdown

### Phase 1: [Name]
- [ ] TASK-001: [Description]
- [ ] TASK-002: [Description]

### Phase 2: [Name]
- [ ] TASK-003: [Description]

## Cancelled Tasks
[Tasks removed due to scope changes - keep for history]

## Progress
| Task | Status | Tests | Notes |
|------|--------|-------|-------|
| TASK-001 | Done | unit/task1.test.ts | [Any notes] |

## Changelog
| Date | Change |
|------|--------|
| YYYY-MM-DD | Initial task breakdown |
```

### validation.md

```markdown
# Validation: {Feature}

## Test Results
[Date: YYYY-MM-DD]

### Unit Tests
- [ ] [Test name]: PASS/FAIL

### Integration Tests
- [ ] [Test name]: PASS/FAIL

### E2E Tests
- [ ] [Test name]: PASS/FAIL

## Quality Checks
- [ ] Lint: PASS/FAIL
- [ ] Type check: PASS/FAIL
- [ ] Security scan: PASS/FAIL

## Issues Found
| Issue | Severity | Resolution |
|-------|----------|------------|
```

### HANDOFF.md

```markdown
# {Feature} - Handoff

> Generated: YYYY-MM-DD

## Summary
[2-3 sentences: what was built and why]

## What Changed
- [Key change 1]
- [Key change 2]
- [Key change 3]

## Key Decisions
| Decision | Why |
|----------|-----|
| [Choice made] | [Reasoning] |

## Files Modified
- `path/to/file.ts` - [what changed]

## How to Test
1. [Step-by-step verification]
2. [Key user flows to check]
3. [Edge cases to verify]

## Edge Cases & Gotchas
- [Important behavior to know]
- [Potential pitfalls]

## Follow-up Items
- [ ] [Deferred work if any]
- [ ] [Future improvements]
```

## When to Use Each File

| Situation | File | Action |
|-----------|------|--------|
| New requirements | SPEC.md | Create or update |
| Scope change | SPEC.md | Update + add to Changelog |
| Research findings | research.md | Append new section |
| Task breakdown | tasks.md | Create or update |
| Task changes | tasks.md | Update + add to Changelog |
| Test results | validation.md | Append results |
| Spec complete | HANDOFF.md | Generate summary |
