---
name: documentation-management
description: >
  Create and maintain project documentation. Use when specs need to be written,
  when compiling research into structured documents, or updating project docs.
agent: scribe
---

# Documentation Management

Create and maintain structured documentation.

## When to Use

- Compiling spec requirements
- Documenting research findings
- Updating project files

## Document Templates

### requirements.md

```markdown
# {Feature Name} Specification

## Overview
[1-2 sentence description]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Requirements

### Functional
- [ ] REQ-001: [Testable requirement]

### Non-Functional
- [ ] Performance: [Metric]

## Technical Approach
[Strategy]

## Out of Scope
- [Excluded items]
```

### research.md

```markdown
# Research Findings: {Feature}

## Codebase Analysis
- [Patterns found]

## External Research
- [Best practices]

## Recommendations
[Approach]
```

## Output Location

```
.catalyst/specs/{spec-name}/planning/
```
