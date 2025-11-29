---
name: reddit-research
description: >
  Search Reddit for community discussions and real-world experiences.
  Use when seeking community consensus or understanding common pain points.
agent: scout
---

# Reddit Research

Find community insights on Reddit.

## When to Use

- Seeking community opinions
- Finding real-world experiences
- Understanding pain points

## Process

1. **Search Reddit via web**
   ```
   Use web_search with:
   "site:reddit.com [technology] [topic]"
   ```

2. **Target subreddits**
   - r/webdev
   - r/reactjs
   - r/node
   - r/programming

3. **Evaluate discussions**
   - Check upvotes
   - Look for experienced voices

4. **Extract insights**
   - Recommendations
   - Warnings
   - Real-world gotchas

## Output Format

```markdown
## Reddit Research: {Topic}

### Community Consensus
- Most recommend [X] because [reason]

### Real-World Experiences
- [User experience summary]

### Warnings
- [Common mistake mentioned]
```
