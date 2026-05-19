# /seal-spec

Commit, archive, and propagate learnings from a **fully built and audited** implementation.

> **Lifecycle position:** This is the FINAL step. Only use after `/forge-spec` and `/audit-spec` have completed successfully.
>
> **Flow:** `/catalyze-spec` → `/forge-spec` → `/audit-spec` → **`/seal-spec`**

## Usage

```
/seal-spec @2025-11-29-stripe-integration
/seal-spec @2025-11-29-stripe-integration "Great work!"
```

---

**Invoke skill:** `spec-approval`

**Process skills used:** `verification-before-completion`, `agent-delegation`

---

## Execution Mode

`/seal-spec` is the user's explicit authorization to run the **full ceremony end-to-end**:

> commit → archive → push → **create PR** → self-document

Do **not** stop and ask for confirmation between phases. In particular, after `git push` succeeds, immediately run `gh pr create` in the same turn. The only valid reasons to halt are:

- A hard gate from Phase 1 fails (TDD missing, validation not passed, handoff missing)
- A `git` or `gh` command returns an error
- The working tree contains unexpected uncommitted state

If everything is clean, the entire flow runs to completion and reports the PR URL at the end.
