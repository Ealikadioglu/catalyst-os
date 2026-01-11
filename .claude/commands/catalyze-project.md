# /catalyze-project

Initialize the project foundation. Always creates all 6 documents.

## Usage

```
/catalyze-project
```

---

## Process

### Phase 1: Detection

Scan the project to determine if greenfield or brownfield:

| Signal | Greenfield | Brownfield |
|--------|------------|------------|
| Source files (`src/`, `app/`, `lib/`) | Few or none | Many |
| Package files | Minimal deps | Established deps |
| Git history | < 10 commits | > 10 commits |
| Lines of code | < 500 | > 500 |

### Phase 2: Gather Information

**If Greenfield** - Heavy questioning via Oracle:

1. What problem are you solving?
2. Who is the primary user?
3. What's the core value proposition?
4. What are the must-have features for v1?
5. What's explicitly out of scope?
6. Any technical constraints?
7. Any existing designs or wireframes?
8. What's the timeline pressure?
9. Are there similar products to reference?

**If Brownfield** - Heavy scanning via 3 parallel Explore agents:

```
Agent 1: Architecture + Tech Stack
Agent 2: Conventions + Patterns
Agent 3: Concerns + TODOs
```

Then ask only what can't be inferred:
1. What's the project's mission? (if no README)
2. What are the current priorities?

### Phase 3: Generate All 6 Documents

Always create all documents in `.catalyst/main/`:

| Document | Greenfield Source | Brownfield Source |
|----------|-------------------|-------------------|
| `mission.md` | Questions | README + questions |
| `roadmap.md` | Questions | TODOs + questions |
| `tech-stack.md` | Recommended based on requirements | Detected from code |
| `architecture.md` | Planned architecture | Analyzed from code |
| `conventions.md` | Best practice standards | Learned from code |
| `concerns.md` | Empty (fresh start) | Issues found in code |

---

## Templates

Located at `.catalyst/main/temp/`:
- `temp-mission.md`
- `temp-roadmap.md`
- `temp-tech-stack.md`
- `temp-architecture.md`
- `temp-conventions.md`
- `temp-concerns.md`

---

## Output

```
.catalyst/main/
├── mission.md
├── roadmap.md
├── tech-stack.md
├── architecture.md
├── conventions.md
└── concerns.md
```

```
✅ Project initialized!

Created 6 documents in .catalyst/main/
- Architecture: [summary]
- Conventions: [count] patterns
- Concerns: [count] issues

Next: Run /catalyze-spec "feature description" to shape your first spec.
```

---

## Refresh

To refresh analysis docs after major changes:

```
/catalyze-project --refresh
```

Re-analyzes codebase and updates architecture, conventions, concerns.
