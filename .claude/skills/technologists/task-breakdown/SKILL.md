---
name: task-breakdown
description: >
  Break specifications into implementable tasks with dependencies. TRIGGERS:
  /build-spec command, spec ready for implementation, planning task order,
  creating implementation/tasks.md.
---

# Task Breakdown

Break specifications into implementable tasks.

## When to Use

- Starting spec implementation
- Planning task order
- Creating tasks.md

## Process

1. **Read requirements**
   - Load requirements.md
   - Identify all deliverables

2. **Identify task types**
   - Database (schema, migrations)
   - Backend (APIs, services)
   - Frontend (components, pages)
   - ML/AI (pipelines, integrations)

3. **Create task groups**
   - Group by dependency
   - Order by execution

4. **Document in tasks.md**

## Task Structure

```markdown
### Group N: [Category]
Dependencies: [Previous groups]

- [ ] **T-XXX**: Task title
  - Details
  - Acceptance: [How to verify]
```

## Guidelines

- Tasks < 2 hours each
- One task = one testable unit
- Clear dependencies
- Testable acceptance criteria

## Output

`implementation/tasks.md` with:
- Task groups
- Dependencies
- Acceptance criteria
