# /iterate-spec

Continue building a spec with new improvements discovered during development.

## Usage

```
/iterate-spec @2025-11-29-stripe-integration "add support for annual billing"
/iterate-spec @2025-11-29-stripe-integration "handle edge case where user cancels mid-checkout"
```

## Pre-computed Context

```bash
# Current state for iteration
echo "=== BRANCH ===" && git branch --show-current
echo "=== STATUS ===" && git status --short
echo "=== TASKS.MD ===" && cat .catalyst/specs/*$ARGUMENTS*/tasks.md 2>/dev/null | head -80 || echo "No tasks.md for: $ARGUMENTS"
echo "=== SPEC FRONTMATTER ===" && head -30 .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No spec.md"
```

---

**Invoke skill:** `spec-iteration`

**Orchestrator:** Forge-Master (delegates to Oracle, Scribe, Forger, Enforcer, Smith, Shaper, Alchemist)

**Process skills used:** `test-driven-development`, `agent-delegation`, `brainstorming`
