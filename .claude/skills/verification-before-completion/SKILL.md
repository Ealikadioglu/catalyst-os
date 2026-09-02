# Verification Before Completion

> **When to invoke:** Before claiming work is complete, fixed, or passing. Before committing, creating PRs, or reporting task status.
> **Used by:** ALL agents. This standard is universal.

## Purpose

Ensure every completion claim is backed by fresh evidence. No assumptions, no "should work", no trust without verification.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in THIS response, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, not cached)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = the claim is unverified.
```

## What Verification Looks Like

**Tests:**
```
CORRECT:  [Run test command] [See: 34/34 pass] "All tests pass"
WRONG:    "Should pass now" / "Looks correct" / "Tests are passing"
```

**Build:**
```
CORRECT:  [Run build command] [See: exit 0] "Build succeeds"
WRONG:    "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
CORRECT:  Re-read spec → Create checklist → Verify each → Report gaps or completion
WRONG:    "Tests pass, therefore task is complete"
```

**Regression tests (TDD Red-Green):**
```
CORRECT:  Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
WRONG:    "I've written a regression test" (without red-green verification)
```

**Agent delegation:**
```
CORRECT:  Agent reports success → Check VCS diff → Verify changes exist → Report actual state
WRONG:    Trust agent report at face value
```

## Evidence Tiers — how much proof, decided up front

Evidence has a **stop rule**. Without one it escalates without bound: in one measured cycle every restored assertion was mutation-proved (mutate → run → revert → run), uniformly, at 2+ full runs per assertion. The tier is set **per task, in the task row, before the work starts** — by Forger in a full DAG, by the orchestrator in direct mode. A builder may not raise its own tier.

| Tier | Written as | Proof required | Use for |
|------|-----------|----------------|---------|
| **Red-then-green** | `rg` | Test seen failing before the change, passing after. One run each. | **Default.** Everything not listed below. |
| **Mutation-prove** | `mut` | `rg` **plus**: mutate the guarded line → run → assertion fails → revert → run → passes. | Assertions guarding a **named invariant**, a **security or tenant boundary**, or a requirement the spec marks **load-bearing**. |

Rules:
- The tier applies to the *task*, not to every assertion in it. In a `mut` task, mutation-prove only the assertions that guard the invariant named in the row; the rest are `rg`.
- `rg` is not "less rigorous". It is the TDD cycle. `mut` is for the handful of lines whose silent removal would be a security or correctness incident.
- If a builder believes a task needs `mut` and the row says `rg`, it writes that in its journal and reports it — it does not escalate on its own.
- Regression tests for a bug fix are `rg` with revert-check (the "Red-Green Verification for Regression Tests" pattern above). That is still one tier below `mut`.

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| "Tests pass" | Test command output showing 0 failures | Previous run, "should pass" |
| "Linter clean" | Linter output showing 0 errors | Partial check, extrapolation |
| "Build succeeds" | Build command exit 0 | Linter passing, logs look good |
| "Bug fixed" | Test original symptom: passes | Code changed, assumed fixed |
| "Regression test works" | Red-green cycle verified | Test passes once |
| "Invariant is guarded" (`mut` row) | Mutation fails the test, revert passes it | Red-green alone |
| "Fully verified" | Proof at the task's stated tier | Mutation-proving everything because it felt safer |
| "Agent completed task" | VCS diff shows changes | Agent reports "success" |
| "All requirements met" | Line-by-line spec checklist | Tests passing |

## Red Flags — STOP

If you catch yourself:
- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Done!")
- About to commit/push without verification
- Trusting agent success reports without checking
- Relying on partial verification ("linter passed = build works")
- Thinking "just this once"
- **ANY wording implying success without having run verification**

## For Orchestrators (Forge-Master, Catalyst, Arbiter)

Orchestrators have an additional responsibility: **verify agent claims before propagating them.**

```
Agent reports "task complete, tests pass":

1. Check: Did the agent actually run tests? (look for test output in report)
2. Check: Does VCS diff show the expected changes?
3. Run: Execute the test command yourself to verify
4. ONLY THEN: Mark the task as complete in tasks.md
```

**Never update tasks.md Progress to "Done" based solely on an agent's self-report.**

## For Builder Agents (Smith, Shaper, Alchemist)

Before reporting completion to the orchestrator:

```
1. Run the specific tests for your scope
2. Verify ALL pass (not just the ones you wrote)
3. Check: Did you implement everything in the task description?
4. Check: Did you add anything NOT in the task description?
5. Report: actual test output, files changed, any concerns
```

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence is not evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter is not the compiler |
| "Agent said success" | Verify independently |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |
| "I already tested this earlier" | Earlier is not now. Run it again. |

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- Committing, PR creation, task completion
- Moving to the next task
- Reporting status to orchestrator or user

**This is non-negotiable.**

Run the command. Read the output. THEN claim the result.
