---
name: schema-design
description: >
  Design database schemas and data models. Use when creating new tables
  or defining relationships.
agent: alchemist
---

# Schema Design

Design database schemas and models.

## When to Use

- Creating new tables
- Defining relationships
- Planning data structure

## Process

1. **Understand requirements**
   - Data entities
   - Relationships
   - Access patterns

2. **Design schema**
   - Tables/collections
   - Fields/columns
   - Relationships
   - Indexes

3. **Validate design**
   - Query patterns
   - Data integrity

## Schema Patterns

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
```

## Checklist

- [ ] All entities identified
- [ ] Relationships defined
- [ ] Indexes planned
- [ ] Constraints added
