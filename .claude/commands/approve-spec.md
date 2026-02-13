# /approve-spec

Accept a **fully built and validated** implementation — commit, archive, and propagate learnings.

> **Lifecycle position:** This is the FINAL step. Only use after `/build-spec` and `/validate-spec` have completed successfully.
>
> **Flow:** `/catalyze-spec` → `/build-spec` → `/validate-spec` → **`/approve-spec`**
>
> **This is NOT for approving a spec/plan before building.** There is no "approve plan" step — after catalyzing, you go straight to `/build-spec`.

## Usage

```
/approve-spec @2025-11-29-stripe-integration
/approve-spec @2025-11-29-stripe-integration "Great work!"
```

---

**Invoke skill:** `spec-approval`

**Process skills used:** `verification-before-completion`, `agent-delegation`
