---
name: context7-lookup
description: >
  Query Context7 for up-to-date library documentation and API references.
  Use when implementing features that require specific library knowledge.
agent: seer
---

# Context7 Lookup

Query library documentation through Context7 MCP.

## When to Use

- Looking up API documentation
- Finding usage examples
- Checking function signatures

## Process

1. **Resolve library ID**
   ```
   Use mcp_context7_resolve-library-id
   - Input: library name
   - Output: Context7-compatible ID
   ```

2. **Fetch documentation**
   ```
   Use mcp_context7_get-library-docs
   - context7CompatibleLibraryID: from step 1
   - topic: specific topic
   - mode: "code" or "info"
   ```

3. **Extract relevant info**
   - API signatures
   - Code examples
   - Best practices

## Modes

- `code` - API references, code examples
- `info` - Conceptual guides, architecture

## Output Format

```markdown
## Library: {package}

### API Reference
- `function(params)` - Description

### Code Examples
[snippets]

### Best Practices
- [practice]
```
