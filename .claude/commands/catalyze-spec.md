# /catalyze-spec

Shape a new specification from a feature request.

## Usage

```
/catalyze-spec "integrate stripe for subscriptions"
/catalyze-spec @existing-spec  # Continue shaping an existing spec
```

## Workflow

The **Catalyst** agent orchestrates the Seekers to gather all necessary information.

### Phase 0: Roadmap Impact Assessment

**Before** starting the spec process, evaluate if the request impacts the project roadmap.

1. **Read existing roadmap** (if present):
   - Check `.catalyst/main/roadmap.md`
   - Understand current goals, priorities, and timeline

2. **Analyze request scope**:
   - **Small request**: Minor feature, bug fix, or incremental improvement
     - Examples: "Add dark mode toggle", "Fix login button styling", "Add validation to email field"
     - Typically: Single component, isolated feature, quick fix
   - **Large request**: Major feature, architectural change, or strategic initiative
     - Examples: "Integrate Stripe for subscriptions", "Build user authentication system", "Add real-time collaboration"
     - Typically: Multiple components, new services, affects multiple areas, strategic importance

3. **Assess roadmap impact**:
   - Does this align with existing roadmap goals?
   - Does this conflict with planned priorities?
   - Does this require reprioritizing existing goals?
   - Does this introduce new strategic direction?

4. **Update roadmap if needed**:
   - If **large request** AND impacts roadmap:
     - Add/update relevant goal in appropriate timeline (Short/Medium/Long-term)
     - Update priority if needed
     - Document dependencies
     - Update changelog with: `| [DATE] | Added/Updated goal: [Title] | /catalyze-spec` 
   - If **small request** OR doesn't impact roadmap:
     - Proceed directly to spec creation (no roadmap update needed)

5. **Document decision**:
   - Note in spec planning whether roadmap was updated
   - Reference the roadmap goal if applicable

### Phase 1: Initialize Spec Folder

Create the spec structure:
```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── planning/
│   ├── requirements.md
│   ├── research.md
│   └── visuals/
├── implementation/
│   ├── tasks.md
│   ├── tests/
│   └── progress.md
└── validation/
    ├── test-results.md
    ├── quality-report.md
    └── sign-off.md
```

### Phase 2: Requirements Gathering (Oracle)

Use `requirement-elicitation` skill:

1. Identify the core intent of the request
2. Ask 3-5 clarifying questions about:
   - Scope boundaries ("Should this include X?")
   - User personas ("Who will use this?")
   - Success criteria ("How do we know it's done?")
   - Edge cases ("What happens when...?")
   - **Roadmap alignment** (if large request): "How does this fit with our current priorities?"
3. Wait for user responses
4. Document in `planning/requirements.md`
5. Include roadmap context if applicable (reference to roadmap goal)

### Phase 3: Research (Seer + Scout)

**Codebase Analysis** (`codebase-analysis` skill):
- Scan relevant existing code
- Identify patterns to follow
- Find integration points
- Note potential conflicts

**Library Research** (`context7-lookup` skill):
- Query Context7 for relevant library docs
- Document API patterns and best practices

**Web Research** (`web-research`, `github-research` skills):
- Search for implementation examples
- Find common pitfalls
- Gather best practices
- Document in `planning/research.md`

### Phase 4: UI Research (Surveyor) - If Applicable

Use `ui-pattern-hunting` skill:
- Search Dribbble, Mobbin for patterns
- Analyze competitor implementations
- Save references to `planning/visuals/`

### Phase 5: Compile Specification (Scribe)

Use `documentation-management` skill to create:

`planning/requirements.md`:
```markdown
# {Feature Name} Specification

## Overview
[Brief description]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Requirements

### Functional
- [ ] REQ-001: Description
- [ ] REQ-002: Description

### Non-Functional
- [ ] Performance: Response time < 200ms
- [ ] Security: Data encrypted at rest

## Technical Approach
[Based on research findings]

## UI/UX
[If applicable, with visual references]

## Out of Scope
- [Explicitly excluded items]

## Open Questions
- [Any remaining unknowns]
```

## Output

```
✅ Spec shaped successfully!

Created: .catalyst/specs/YYYY-MM-DD-{feature}/
├── planning/requirements.md ← Requirements documented
├── planning/research.md ← Research findings
└── planning/visuals/ ← UI references (if any)

[If roadmap was updated:]
📋 Roadmap updated: .catalyst/main/roadmap.md

Next: Run /build-spec @YYYY-MM-DD-{feature} to implement.
```

## Notes

- **Small requests** typically don't require roadmap updates and proceed directly to spec creation
- **Large requests** should be evaluated against roadmap and updated if they represent strategic changes
- Roadmap updates preserve existing goals and priorities unless explicitly reprioritized

