# /primer-spec

Quickly load spec context into a fresh conversation.

---

## Purpose

When you start a new conversation (context was full), use this command to:
- Restore awareness of the spec's current state
- Understand what's done and what's pending
- Know which branch you're on
- Continue work without re-explaining everything

**This is NOT an orchestration command.** Read files directly and output a summary.

---

## Usage

```
/primer-spec @2025-11-29-stripe-integration
```

---

## What To Do

### Step 1: Read Spec Files

Read these files from `.catalyst/specs/{slug}/`:

```
1. spec.md      → What is this feature? Requirements?
2. tasks.md     → What's done? What's pending? What's in progress?
3. research.md  → (if exists) Any key technical decisions?
```

### Step 2: Check Git State

```bash
git branch --show-current    # What branch are we on?
git status --short           # Any uncommitted changes?
git log --oneline -3         # Recent commits?
```

### Step 3: Output Brief Summary

Output a **concise** summary (aim for ~20-30 lines max):

```
## Spec Primer: {Feature Name}

**Branch:** feat/{slug}
**Status:** {phase - e.g., "Building", "Testing", "Validating"}

### What It Does
{1-2 sentences from spec.md overview}

### Progress
| Done | In Progress | Pending |
|------|-------------|---------|
| 3    | 1           | 2       |

**Completed:**
- ✓ {task-1}
- ✓ {task-2}

**In Progress:**
- → {task-3}

**Pending:**
- ○ {task-4}
- ○ {task-5}

### Current Focus
{What was being worked on based on tasks.md status}

### Git State
- Branch: feat/{slug}
- Last commit: {commit message}
- Uncommitted changes: {yes/no}

---
Ready to continue. What would you like to work on?
```

---

## Rules

1. **Be brief** - This is a primer, not a full report
2. **Read directly** - Do NOT spawn agents, just read files
3. **Focus on actionable state** - What's done, what's next
4. **Preserve context** - Keep output short to leave room for actual work

---

## Example Output

```
## Spec Primer: Stripe Integration

**Branch:** feat/2025-11-29-stripe-integration
**Status:** Building (Phase 5 - Parallel Implementation)

### What It Does
Integrate Stripe for subscription billing with monthly/annual plans and usage-based pricing.

### Progress
| Done | In Progress | Pending |
|------|-------------|---------|
| 4    | 2           | 1       |

**Completed:**
- ✓ db-schema: Subscription tables
- ✓ api-types: Shared TypeScript types
- ✓ api-auth: Authentication endpoints
- ✓ iter-001: Annual billing discount

**In Progress:**
- → api-billing: Billing service (tests passing)
- → ui-pricing: Pricing page components

**Pending:**
- ○ integration: E2E tests

### Current Focus
Working on api-billing and ui-pricing in parallel.
Annual billing iteration (iter-001) was added and completed.

### Git State
- Branch: feat/2025-11-29-stripe-integration
- Last commit: feat(billing): add annual billing with 20% discount
- Uncommitted changes: no

---
Ready to continue. What would you like to work on?
```

---

## When to Use

| Situation | Command |
|-----------|---------|
| Context full, need to continue building | `/primer-spec` |
| Want to add improvement mid-build | `/iterate-spec` |
| Need full validation | `/review-spec` |
| Check status without loading context | `/status-spec` |

---

## Tips

- Run this FIRST in a new conversation before doing any work
- After primer, you can run `/iterate-spec` or continue with `/build-spec`
- If tasks.md doesn't exist, the spec hasn't been built yet - run `/build-spec`
