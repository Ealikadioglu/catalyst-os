# /catalyze-project

Initialize the project foundation by creating mission, roadmap, and tech-stack documents.

## Workflow

This command activates the **Catalyst** agent to orchestrate project initialization.

### Phase 1: Discovery

Scan the existing codebase to understand:
- Project structure and architecture
- Package files (package.json, requirements.txt, etc.)
- Existing documentation (README, docs/)
- Git history and contribution patterns
- Configuration files

### Phase 2: Mission Creation

Use the **Oracle** skill to gather information:

1. Ask 3-5 clarifying questions about:
   - What problem does this project solve?
   - Who are the primary users?
   - What makes this unique?
   - What are the key success metrics?

2. Create `.catalyst/main/mission.md`:
   - Project vision
   - Core value proposition
   - Target users
   - Success criteria

### Phase 3: Roadmap Creation

Based on the mission and codebase analysis:

1. Identify existing features and their maturity
2. Ask about planned features and priorities
3. Create `.catalyst/main/roadmap.md`:
   - Current state assessment
   - Short-term goals (1-3 months)
   - Medium-term goals (3-6 months)
   - Long-term vision

### Phase 4: Tech Stack Documentation

Analyze existing code to document:

1. Create `.catalyst/main/tech-stack.md`:
   - Frontend framework and libraries
   - Backend framework and services
   - Database and storage
   - Infrastructure and deployment
   - Development tools
   - Key architectural decisions

## Output

```
✅ Project initialized!

Created:
├── .catalyst/main/mission.md
├── .catalyst/main/roadmap.md
└── .catalyst/main/tech-stack.md

Next: Run /catalyze-spec "feature description" to shape your first spec.
```

