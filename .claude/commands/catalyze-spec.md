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

**CRITICAL**: All outputs go to the spec folder. See AGENTS.md "Documentation Output Policy".

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── SPEC.md           # Scribe owns
├── research.md       # Scout, Seer, Oracle append to
├── tasks.md          # Forger owns (created in /build-spec)
├── validation.md     # Arbiter owns (created in /validate-spec)
├── HANDOFF.md        # Arbiter generates on completion
└── assets/           # Images, diagrams, mockups
```

**In your agent prompts, include the exact file path:**
- "Append your findings to `.catalyst/specs/{slug}/research.md`"
- "Create SPEC.md at `.catalyst/specs/{slug}/SPEC.md`"

**Do NOT** allow agents to create random files anywhere else.

### PARALLEL EXECUTION

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
   - **Large request**: Major feature, architectural change, or strategic initiative
     - Examples: "Integrate Stripe for subscriptions", "Build user authentication system"

3. **Update roadmap if needed**:
   - If **large request** AND impacts roadmap: Update `.catalyst/main/roadmap.md`
   - If **small request**: Proceed directly to spec creation

### Phase 1: Initialize Spec Folder

Create the spec structure:
```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── SPEC.md
├── research.md
└── assets/
```

### Phase 2: Requirements Gathering (Oracle)

**Spawn Oracle agent**:

```
"Gather requirements for [feature]. Hand off findings to Scribe for SPEC.md creation at:
.catalyst/specs/{YYYY-MM-DD-slug}/SPEC.md"
```

Oracle will:
1. Identify the core intent of the request
2. Ask 3-5 clarifying questions about scope, users, success criteria, edge cases
3. Wait for user responses
4. Hand off synthesized requirements to Scribe

### Phase 3: Research (Seer + Scout) - PARALLEL

**Spawn Seer + Scout agents in parallel**:

```
Seer: "Analyze codebase for [feature]. Append findings to:
.catalyst/specs/{YYYY-MM-DD-slug}/research.md under '## Codebase Analysis'"

Scout: "Research best practices for [feature]. Append findings to:
.catalyst/specs/{YYYY-MM-DD-slug}/research.md under '## External Research'"
```

### Phase 4: UI Research (Surveyor) - If Applicable

**Spawn Surveyor agent**:

```
"Research UI patterns for [feature]. Save references to:
.catalyst/specs/{YYYY-MM-DD-slug}/assets/"
```

### Phase 5: Compile Specification (Scribe)

**Spawn Scribe agent**:

```
"Compile specification from gathered research. Create SPEC.md at:
.catalyst/specs/{YYYY-MM-DD-slug}/SPEC.md"
```

Scribe will create `SPEC.md`:
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
- [ ] REQ-002: Description

### Non-Functional
- [ ] PERF-001: Response time < 200ms
- [ ] SEC-001: Data encrypted at rest

## Acceptance Criteria
1. [Verifiable criterion]
2. [Verifiable criterion]

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
├── SPEC.md      <- Requirements documented
├── research.md  <- Research findings
└── assets/      <- UI references (if any)

[If roadmap was updated:]
Roadmap updated: .catalyst/main/roadmap.md

REMINDER: /build-spec follows strict TDD
  1. Tests written FIRST (Enforcer)
  2. Tests must FAIL (red phase)
  3. Then implement (Builders)
  4. Tests must PASS (green phase)

Next: Run /build-spec @YYYY-MM-DD-{slug} to implement.
```
