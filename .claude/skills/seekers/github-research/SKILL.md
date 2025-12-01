---
name: github-research
description: >
  Search GitHub for reference implementations, similar projects, and code examples.
  TRIGGERS: looking for production code examples, discovering libraries, finding
  how others implemented a feature.
---

# GitHub Research

Find reference implementations on GitHub.

## When to Use

- Finding reference implementations
- Discovering similar projects
- Learning from production code

## Process

1. **Search repositories**
   ```
   Use mcp_github_search_repositories
   - query: "[technology] [feature]"
   ```

2. **Search code**
   ```
   Use mcp_github_search_code
   - q: "[pattern or function]"
   ```

3. **Analyze findings**
   - Check project quality (stars, activity)
   - Review implementation approach

## Evaluation Criteria

| Factor | Good Sign |
|--------|-----------|
| Stars | >100 for patterns |
| Activity | Recent commits |
| Docs | Clear README |

## Output Format

```markdown
## GitHub Research: {Topic}

### Top Repositories
1. **[owner/repo]** (⭐ stars)
   - Relevant because: [reason]
   - Key pattern: [what to learn]

### Code Patterns Found
[Examples worth following]
```
