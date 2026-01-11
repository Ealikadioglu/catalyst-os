# Pattern Library

Reusable implementation patterns extracted from completed specs.

## Purpose

This library contains battle-tested patterns and guidelines that can help accelerate future projects. Each item captures:

- Key considerations and gotchas
- Architecture patterns
- Common pitfalls to avoid
- Testing strategies
- Dependencies needed

## How Items Are Created

When a spec is approved via `/approve-spec`, you're prompted to extract reusable patterns if the implementation is generic enough to benefit other projects.

**Not every spec becomes a library item** — project-specific implementations are skipped.

## How to Use

1. Browse items relevant to your new feature
2. Review key considerations before starting
3. Use as a checklist during implementation
4. Reference architecture patterns for design decisions

## Item Format

Each library item follows this structure:

```markdown
# Pattern Name

> Category: <category>
> Complexity: Low | Medium | High
> Last Updated: YYYY-MM-DD
> Based on: N implementations

## Overview
## When to Use
## Key Considerations
## Architecture Pattern
## Common Pitfalls
## Dependencies
## Testing Strategy
## Database Considerations
## Related Specs
```

## Categories

| Category | Description |
|----------|-------------|
| Payments | Stripe, billing, subscriptions |
| Authentication | OAuth, SSO, JWT, login flows |
| File Storage | S3, uploads, media handling |
| Real-time | WebSockets, live updates |
| Notifications | Email, push, SMS |
| Search | Full-text search, Elasticsearch |
| Caching | Redis, performance optimization |
| Background Jobs | Queues, workers, async processing |
