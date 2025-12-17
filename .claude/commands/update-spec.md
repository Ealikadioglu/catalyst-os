# /update-spec

Update an existing specification with new requirements, scope changes, or clarifications.

## Usage

```
/update-spec @2025-11-29-stripe-integration "add support for annual billing"
/update-spec @2025-11-29-stripe-integration "remove crypto payment option"
/update-spec @2025-11-29-stripe-integration "clarify refund policy requirements"
```

---

## ORCHESTRATION MODE

**IMPORTANT**: This command operates in orchestration mode. The main agent DELEGATES work to specialized sub-agents.

### Output Location

Updates go to existing spec files. See AGENTS.md "Documentation Output Policy".

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── SPEC.md           # Update requirements here
├── research.md       # Append new research if needed
├── tasks.md          # Update tasks if scope changed
├── validation.md     # (unchanged unless re-validating)
└── HANDOFF.md        # (regenerated on completion)
```

---

## Update Types

| Type | Description | Agents Involved |
|------|-------------|-----------------|
| **Expand** | Add new requirements/features | Oracle → Scribe → Forger |
| **Shrink** | Remove requirements/features | Scribe → Forger |
| **Clarify** | Refine existing requirements | Oracle → Scribe |
| **Research** | Add new technical findings | Scout/Seer → Scribe |
| **Replan** | Restructure tasks | Forger |

---

## Workflow

### Phase 1: Assess Current State

1. **Read existing spec files:**
   - `SPEC.md` - current requirements and status
   - `tasks.md` - current task breakdown (if exists)
   - `research.md` - existing research

2. **Determine spec phase:**
   - `DRAFT` - Still in planning, easy to change
   - `IN_PROGRESS` - Implementation started, changes need task updates
   - `COMPLETE` - Archived, create new spec instead

3. **Classify the update:**
   - Is this expanding scope? (new features)
   - Is this shrinking scope? (removing features)
   - Is this clarification? (same scope, better definition)
   - Does this need new research?

### Phase 2: Gather Requirements (If Expanding/Clarifying)

**Spawn Oracle agent** (if requirements need discussion):

```
"Review the update request for spec {slug}:
'{update description}'

Current requirements are in SPEC.md. Ask clarifying questions if needed.
Hand off refined requirements to Scribe."
```

### Phase 3: Update Documentation (Scribe)

**Spawn Scribe agent**:

```
"Update SPEC.md for spec {slug} with the following change:
'{update description}'

- Add/remove/modify requirements as needed
- Update the Changelog section
- Keep Status as IN_PROGRESS if implementation started"
```

Scribe updates `SPEC.md`:

```markdown
# {Feature Name}

> Status: IN_PROGRESS
> Last Updated: YYYY-MM-DD

## Overview
[Updated description]

## Changelog
| Date | Change | Reason |
|------|--------|--------|
| YYYY-MM-DD | Added annual billing support | User request |
| YYYY-MM-DD | Initial spec | - |

## Requirements
[Updated requirements...]
```

### Phase 4: Research (If Needed)

**Spawn Scout/Seer in parallel** (if update needs research):

```
Seer: "Research codebase impact of: '{update description}'
Append findings to .catalyst/specs/{slug}/research.md"

Scout: "Research best practices for: '{update description}'
Append findings to .catalyst/specs/{slug}/research.md"
```

### Phase 5: Update Tasks (Forger)

**Spawn Forger agent** (if implementation has started or tasks exist):

```
"Update tasks.md for spec {slug} based on spec changes:
'{update description}'

- Add new tasks for expanded scope
- Mark removed scope tasks as CANCELLED
- Preserve completed task history"
```

Forger updates `tasks.md`:

```markdown
# Tasks: {Feature Name}

> Last Updated: YYYY-MM-DD

## Task Breakdown

### Group 1: Database Setup (Alchemist)
- [x] T-001: Create subscription schema (DONE)
- [x] T-002: Add migration for plans table (DONE)
- [ ] T-007: Add annual_billing column (NEW)

### Group 2: Backend API (Smith)
- [x] T-003: Create Stripe service wrapper (DONE)
- [ ] T-004: Implement subscription endpoints (IN PROGRESS)
- [ ] T-008: Add annual billing logic (NEW)

### Cancelled Tasks
- ~~T-005: Crypto payment integration~~ (REMOVED - scope change)

## Change Log
| Date | Change |
|------|--------|
| YYYY-MM-DD | Added T-007, T-008 for annual billing |
| YYYY-MM-DD | Cancelled T-005 (crypto removed from scope) |
```

---

## Handling Different Phases

### If Spec is DRAFT
- Full flexibility to change
- No task impact to consider
- Simple update flow

### If Spec is IN_PROGRESS
- Check which tasks are completed
- New requirements → new tasks added
- Removed requirements → tasks marked CANCELLED (not deleted)
- May need to notify builders of changes

### If Spec is COMPLETE
```
Cannot update completed spec.

Options:
1. Create a follow-up spec: /catalyze-spec "enhance {feature} with {change}"
2. Reopen spec (requires manual status change)

Recommend: Create new spec for significant changes.
```

---

## Output

### Expand Scope
```
Spec updated!

Spec: 2025-11-29-stripe-integration
Change: Added annual billing support

Updated files:
- SPEC.md: Added REQ-009, REQ-010 for annual billing
- research.md: Added billing cycle research
- tasks.md: Added T-007, T-008 (2 new tasks)

Impact:
- 2 new requirements added
- 2 new tasks created
- No existing work affected

Next: Continue with /build-spec @2025-11-29-stripe-integration
```

### Shrink Scope
```
Spec updated!

Spec: 2025-11-29-stripe-integration
Change: Removed crypto payment option

Updated files:
- SPEC.md: Removed REQ-005 (crypto payments)
- tasks.md: Cancelled T-005 (crypto integration)

Impact:
- 1 requirement removed
- 1 task cancelled (was not started)
- Scope reduced

Next: Continue with /build-spec @2025-11-29-stripe-integration
```

### Clarification
```
Spec updated!

Spec: 2025-11-29-stripe-integration
Change: Clarified refund policy requirements

Updated files:
- SPEC.md: Updated REQ-003 with detailed refund rules

Impact:
- 0 new requirements
- 0 tasks affected
- Existing T-004 may need review

Next: Review T-004 implementation against updated requirements
```

---

## Tips

Be specific about what's changing:
- Bad: "update the spec"
- Good: "add support for annual billing with 20% discount"

- Bad: "remove some features"
- Good: "remove crypto payment option, keep card and bank transfer"

- Bad: "fix the requirements"
- Good: "clarify REQ-003: refunds must be processed within 5 business days"
