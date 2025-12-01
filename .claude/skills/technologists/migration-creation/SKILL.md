---
name: migration-creation
description: >
  Create database migrations for schema changes. TRIGGERS: applying new schema,
  modifying tables, adding indexes, after schema-design skill.
---

# Migration Creation

Create database migrations.

## When to Use

- Applying new schema
- Modifying tables
- Adding indexes

## Process

1. **Plan migration**
   - What changes
   - Up migration
   - Down migration

2. **Generate migration**
   - Use project's tool
   - Name descriptively

3. **Test migration**
   - Run up
   - Verify state
   - Run down
   - Verify rollback

## Migration Pattern

```sql
-- Up
CREATE TABLE subscriptions (...);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- Down
DROP TABLE IF EXISTS subscriptions;
```

## Best Practices

- Always write down migration
- Small changes per migration
- Test locally first
- No data loss

## Checklist

- [ ] Up migration
- [ ] Down migration
- [ ] Tested locally
- [ ] No data loss
