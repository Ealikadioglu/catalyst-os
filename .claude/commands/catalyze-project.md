# /catalyze-project

Initialize the project foundation. Creates project config and all 6 foundation documents.

## Usage

```
/catalyze-project
```

---

## Process

### Phase 1: Detection (Silent)

**Do not announce this phase to the user.** Silently scan the project to determine if greenfield or brownfield:

| Signal | Greenfield | Brownfield |
|--------|------------|------------|
| Source files (`src/`, `app/`, `lib/`) | Few or none | Many |
| Package files | Minimal deps | Established deps |
| Git history | < 10 commits | > 10 commits |
| Lines of code | < 500 | > 500 |

Run these checks in the background and proceed directly to Phase 2 based on the result.

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

**If Brownfield** - Heavy scanning via 3 parallel Seer agents (subagent_type="seer"):

```
Seer 1: Architecture + Tech Stack
Seer 2: Conventions + Patterns
Seer 3: Concerns + TODOs
```

Then ask only what can't be inferred:
1. What's the project's mission? (if no README)
2. What are the current priorities?

### Phase 3: Git Branch Setup

**Ask the user about their development branch preference:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🙋 ASK USER: Development Branch                                │
│  ───────────────────────────────                                │
│                                                                 │
│  "What should we name the development branch for spec work?"    │
│                                                                 │
│  Options:                                                       │
│  ○ development (Recommended)                                    │
│  ○ develop                                                      │
│  ○ staging                                                      │
│  ○ Other (custom name)                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**After user responds:**

1. Check if branch exists:
   ```bash
   git branch --list {branch_name}
   ```

2. If branch doesn't exist, create it from main:
   ```bash
   git checkout -b {branch_name}
   git push -u origin {branch_name}  # Optional: ask user if they want to push
   git checkout main  # Return to main for now
   ```

3. Store preference in `project-config.yaml`:
   ```yaml
   git:
     development_branch: "{user_choice}"
   ```

---

### Phase 4: Generate Config and Documents

Always create in `.catalyst/main/`:

| File | Source |
|------|--------|
| `project-config.yaml` | User preferences from Phase 3 |

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

Located at `.catalyst/main/`:
- `project-config.yaml` (git and project settings template)

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
├── project-config.yaml
├── mission.md
├── roadmap.md
├── tech-stack.md
├── architecture.md
├── conventions.md
└── concerns.md
```

```
✅ Project initialized!

Git Setup:
- Development branch: {branch_name} (created/verified)
- Feature branches will be: feat/{spec-slug}

Created 7 files in .catalyst/main/
- project-config.yaml: Git workflow settings
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
