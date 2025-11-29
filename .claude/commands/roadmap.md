# /roadmap

Create or update the project roadmap.

## Usage

```
/roadmap              # Create new or update existing
/roadmap "Q1 focus"   # Update with specific direction
```

## Workflow

1. **Read** `.catalyst/main/mission.md` for context
2. **Read existing** `.catalyst/main/roadmap.md` if present
3. **Analyze** codebase for current feature state
4. **Ask** about priorities and timeline:
   - What's most important right now?
   - What's blocking progress?
   - What's the target timeline?
5. **Create/Update** the roadmap

## Output Format

`.catalyst/main/roadmap.md`:

```markdown
# Project Roadmap

## Current State
[Brief assessment of where the project is now]

## Phase 1: Foundation (Now - 1 month)
### Goals
- [Specific, measurable goal]
- [Another goal]

### Key Features
- [ ] Feature 1 - Description
- [ ] Feature 2 - Description

## Phase 2: Growth (1-3 months)
### Goals
- [Goal]

### Key Features
- [ ] Feature

## Phase 3: Scale (3-6 months)
### Goals
- [Goal]

### Key Features
- [ ] Feature

## Long-term Vision
[Where this is heading in 6-12 months]

---
*Last updated: YYYY-MM-DD*
```

