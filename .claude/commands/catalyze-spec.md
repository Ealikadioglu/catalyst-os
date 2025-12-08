# /catalyze-spec

Shape a new specification from a feature request.

## Usage

```
/catalyze-spec "integrate stripe for subscriptions"
/catalyze-spec @existing-spec  # Continue shaping an existing spec
```

---

## ORCHESTRATION MODE

**IMPORTANT**: This command operates in orchestration mode. The main agent DELEGATES work to specialized sub-agents.

**You MUST:**
- Spawn **Oracle** agent for requirement gathering (not do it yourself)
- Spawn **Seer** agent for codebase analysis (not grep yourself)
- Spawn **Scout** agent for web research (not search yourself)
- Spawn **Scribe** agent for documentation (not write specs yourself)

**The main agent coordinates, sub-agents execute.**

### Output Location Rule

**CRITICAL**: When spawning research agents, you MUST instruct them to save outputs in the spec folder:

```
.catalyst/specs/YYYY-MM-DD-{slug}/planning/
```

**In your agent prompts, include:**
- "Save your findings to `.catalyst/specs/{spec-folder}/planning/research.md`"
- "Document requirements in `.catalyst/specs/{spec-folder}/planning/requirements.md`"

**Do NOT** allow agents to create files in the root directory (AGENTS.md, RESEARCH_SUMMARY.md, etc.).

### ⚡ PARALLEL EXECUTION

**Spawn research agents in parallel, not sequentially!**

```
WRONG:  oracle → seer → scout → surveyor (one by one)
RIGHT:  oracle → [seer + scout + surveyor] (parallel research)
```

| Independent (Parallelize) | Dependent (Sequential) |
|---------------------------|------------------------|
| Seer + Scout + Surveyor | Oracle → All (need requirements first) |
| All research agents | Research → Scribe (compile after) |

---

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

Create the spec structure (see `.catalyst/specs/spec-config.yaml` for configuration):
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

**Spawn Oracle agent** with explicit output location:

```
"Gather requirements for [feature]. Save findings to:
.catalyst/specs/{YYYY-MM-DD-slug}/planning/requirements.md"
```

Oracle will:
1. Identify the core intent of the request
2. Ask 3-5 clarifying questions about:
   - Scope boundaries ("Should this include X?")
   - User personas ("Who will use this?")
   - Success criteria ("How do we know it's done?")
   - Edge cases ("What happens when...?")
   - **Roadmap alignment** (if large request): "How does this fit with our current priorities?"
3. Wait for user responses
4. Document in `.catalyst/specs/{spec-folder}/planning/requirements.md`
5. Include roadmap context if applicable (reference to roadmap goal)

### Phase 3: Research (Seer + Scout)

**Spawn Seer + Scout agents in parallel** with explicit output location:

```
Seer: "Analyze codebase for [feature]. Save findings to:
.catalyst/specs/{YYYY-MM-DD-slug}/planning/research.md (section: Codebase Analysis)"

Scout: "Research best practices for [feature]. Save findings to:
.catalyst/specs/{YYYY-MM-DD-slug}/planning/research.md (section: Web Research)"
```

**Codebase Analysis** (Seer):
- Scan relevant existing code
- Identify patterns to follow
- Find integration points
- Note potential conflicts

**Library Research** (Seer with `context7-lookup`):
- Query Context7 for relevant library docs
- Document API patterns and best practices

**Web Research** (Scout):
- Search for implementation examples
- Find common pitfalls
- Gather best practices
- Document in `.catalyst/specs/{spec-folder}/planning/research.md`

### Phase 4: UI Research (Surveyor) - If Applicable

**Spawn Surveyor agent** with explicit output location:

```
"Research UI patterns for [feature]. Save findings and references to:
.catalyst/specs/{YYYY-MM-DD-slug}/planning/visuals/"
```

Surveyor will:
- Search Dribbble, Mobbin for patterns
- Analyze competitor implementations
- Save references to `.catalyst/specs/{spec-folder}/planning/visuals/`

### Phase 5: Compile Specification (Scribe)

**Spawn Scribe agent** with explicit output location:

```
"Compile specification from gathered research. Create final spec at:
.catalyst/specs/{YYYY-MM-DD-slug}/planning/requirements.md"
```

Scribe will create:

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

### Testability Requirements
- [ ] TEST-001: What tests are needed for this feature?
- [ ] TEST-002: What edge cases should be tested?
- [ ] TEST-003: What integration points need testing?

> ⚠️ **Note**: All requirements above will need corresponding tests
> written BEFORE implementation (TDD mandatory).

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

⚠️ REMINDER: /build-spec follows strict TDD
   1. Tests written FIRST (Enforcer)
   2. Tests must FAIL (red phase)
   3. Then implement (Builders)
   4. Tests must PASS (green phase)

Next: Run /build-spec @YYYY-MM-DD-{feature} to implement.
```

## Notes

- **Small requests** typically don't require roadmap updates and proceed directly to spec creation
- **Large requests** should be evaluated against roadmap and updated if they represent strategic changes
- Roadmap updates preserve existing goals and priorities unless explicitly reprioritized

