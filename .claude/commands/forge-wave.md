# /forge-wave

**Unattended wave run**: build every spec of one roadmap wave, one after another. Each spec is catalyzed against the code the previous one merged, built end to end by a builder agent (pi by default) in its own terminal (hc or herdr), reviewed, and merged into the autopilot branch. Start it in the evening, read the morning report.

> **Lifecycle position:** `/sync-project` → `/plan-project` (writes the waves) → **`/forge-wave <id>`** → you promote the autopilot branch

## Usage

```
/forge-wave 1
```

The argument is the wave number from `## 🌊 Waves` in `roadmap.md`, not its goal text.

## Pre-computed Context

```bash
echo "=== WAVE ===" && node .catalyst/bin/board.js --wave $ARGUMENTS
echo "=== TERMINAL ===" && echo "HC_TERMINAL_ID=${HC_TERMINAL_ID:-unset} HERDR_ENV=${HERDR_ENV:-unset}" && (command -v hc || echo "hc: not found") && (command -v herdr || echo "herdr: not found")
echo "=== BUILDERS ===" && for b in pi claude codex; do printf "%s: %s, " "$b" "$(command -v $b || echo not found)"; ls -d .$b/agents 2>/dev/null || echo ".$b/: not installed"; done
echo "=== GH ===" && (gh auth status 2>&1 | head -3)
echo "=== BRANCH ===" && git branch --show-current 2>/dev/null || echo "(not a git repo: multirepo root?)"
echo "=== STATUS ===" && git status --short 2>/dev/null
echo "=== WAVE FILE ===" && (tail -30 .catalyst/waves/wave-$ARGUMENTS.md 2>/dev/null || echo "none (fresh run)")
echo "=== PROJECT CONFIG ===" && cat .catalyst/main/project-config.yaml 2>/dev/null
```

---

**Invoke skill:** `wave-orchestration` (it picks the hc or herdr backend and loads `autopilot`)

**Orchestrator:** the current session. It writes briefs, gates specs and PRs, and merges. It never writes feature code; the builder (`autopilot.builder`) builds.

## Execution Mode

Invoking this command authorizes the whole run, including merging PRs into `autopilot.branch`. It stops before starting only when a preflight check fails (see the skill), and during the run only for the stop conditions the skill lists. Every outcome lands in `.catalyst/waves/wave-<id>.md`, ending with `## Morning report`.

**Arguments:** $ARGUMENTS
