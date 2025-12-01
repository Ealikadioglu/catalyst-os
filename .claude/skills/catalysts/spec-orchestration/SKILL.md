---
name: spec-orchestration
description: >
  Orchestrate the spec shaping workflow by coordinating research phases.
  TRIGGERS: /catalyze-spec command, feature request needs specification,
  transforming vague request into structured spec.
---

# Spec Orchestration

Coordinate the spec shaping workflow from feature request to documented specification.

## Process

1. **Initialize spec folder** (structure defined in `.catalyst/specs/spec-config.yaml`)
   ```
   .catalyst/specs/YYYY-MM-DD-{slug}/
   ├── planning/
   │   ├── requirements.md
   │   ├── research.md
   │   └── visuals/
   ├── implementation/
   └── validation/
   ```

2. **Gather requirements** (use `requirement-elicitation`)
   - Ask clarifying questions
   - Document answers

3. **Analyze codebase** (use `codebase-analysis`)
   - Scan relevant existing code
   - Identify patterns to follow

4. **Research** (use `web-research`, `github-research`)
   - Find best practices
   - Document findings

5. **UI research if needed** (use `ui-pattern-hunting`)
   - Find design patterns
   - Save to visuals/

6. **Compile specification** (use `documentation-management`)
   - Create requirements.md
   - Document research.md

## Output

Complete spec folder with:
- Documented requirements
- Research findings
- Visual references (if applicable)
- Clear next steps
