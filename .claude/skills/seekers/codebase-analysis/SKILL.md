---
name: codebase-analysis
description: >
  Analyze existing codebase for patterns, conventions, and integration points.
  TRIGGERS: new feature implementation, understanding existing code, finding patterns,
  identifying where new code should connect.
---

# Codebase Analysis

Analyze existing code to inform new development.

## When to Use

- Before implementing new features
- Finding existing patterns
- Identifying integration points

## Process

1. **Scan project structure**
   - Directory organization
   - File naming conventions
   - Module boundaries

2. **Identify patterns**
   - Component patterns
   - API patterns
   - Data patterns
   - Testing patterns

3. **Find integration points**
   - Related features
   - Shared utilities
   - Database connections

4. **Check for conflicts**
   - Naming collisions
   - Route conflicts

## Analysis Checklist

- [ ] Framework and version
- [ ] State management
- [ ] Routing strategy
- [ ] API patterns
- [ ] Naming conventions
- [ ] Test structure

## Output Format

```markdown
## Codebase Analysis: {Feature}

### Project Structure
- Framework: [e.g., Next.js 14]

### Relevant Patterns
- Components: [pattern]
- API: [pattern]

### Integration Points
- [Where this connects]

### Recommendations
- Follow existing pattern for [X]
```
