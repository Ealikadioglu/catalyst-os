---
name: build-orchestration
description: >
  Orchestrate the build workflow using TDD principles. Use when /build-spec
  command is invoked or when a specification needs to be implemented.
agent: forge-master
---

# Build Orchestration

Coordinate the build workflow from specification to working code.

## Process

1. **Load spec context**
   ```
   Read from .catalyst/specs/{spec}/planning/:
   - requirements.md
   - research.md
   ```

2. **Break down tasks** (use `task-breakdown`)
   - Create implementation/tasks.md
   - Identify dependencies

3. **Write tests first** (use `unit-test-writing`)
   - Create tests for each task
   - Verify tests fail (red phase)

4. **Execute tasks by type**
   - Database → use `schema-design`, `migration-creation`
   - Backend → use `api-development`, `service-implementation`
   - Frontend → use `react-development`, `ui-component-building`
   - ML/AI → use `ml-pipeline`, `ai-integration`

5. **Track progress**
   - Update implementation/progress.md
   - Run tests continuously

## TDD Enforcement

```
For each task:
1. Test exists → ❌ FAIL
2. Implement → ✅ PASS
3. Refactor → ✅ PASS
4. Next task
```

## Output

- All tasks completed
- All tests passing
- Progress documented
- Ready for validation
