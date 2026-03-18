# /commit-spec

Commit, archive, and propagate learnings from a **fully built and validated** implementation.

> **Lifecycle position:** This is the FINAL step. Only use after `/build-spec` and `/review-spec` have completed successfully.
>
> **Flow:** `/catalyze-spec` → `/build-spec` → `/review-spec` → **`/commit-spec`**

## Usage

```
/commit-spec @2025-11-29-stripe-integration
/commit-spec @2025-11-29-stripe-integration "Great work!"
```

---

**Invoke skill:** `spec-approval`

**Process skills used:** `verification-before-completion`, `agent-delegation`
