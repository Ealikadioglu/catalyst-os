# /forge-wave

**Unattended wave run**: build every spec of one roadmap wave, one after another. Each spec is catalyzed against the code the previous one merged, built end to end by a pi agent in its own herdr tab, reviewed, and merged into the autopilot branch. Start it in the evening, read the morning report.

> **Lifecycle position:** `/sync-project` → `/plan-project` (writes the waves) → **`/forge-wave <id>`** → you promote the autopilot branch

## Usage

```
/forge-wave 1
```

The argument is the wave number from `## 🌊 Waves` in `roadmap.md`, not its goal text.

## Pre-computed Context

```bash
echo "=== WAVE ===" && node .catalyst/bin/board.js --wave $ARGUMENTS
echo "=== HERDR ===" && echo "HERDR_ENV=${HERDR_ENV:-unset}" && (command -v herdr || echo "herdr: not found")
echo "=== PI ===" && (command -v pi || echo "pi: not found") && (ls -d .pi/agents 2>/dev/null || echo ".pi/: not installed")
echo "=== GH ===" && (gh auth status 2>&1 | head -3)
echo "=== BRANCH ===" && git branch --show-current 2>/dev/null || echo "(not a git repo: multirepo root?)"
echo "=== STATUS ===" && git status --short 2>/dev/null
echo "=== WAVE FILE ===" && (tail -30 .catalyst/waves/wave-$ARGUMENTS.md 2>/dev/null || echo "none (fresh run)")
echo "=== PROJECT CONFIG ===" && cat .catalyst/main/project-config.yaml 2>/dev/null
```

---

**Invoke skill:** `wave-orchestration` (it loads `herdr` and `autopilot`)

**Orchestrator:** the current session. It writes briefs, gates specs and PRs, and merges. It never writes feature code; pi builds.

## Execution Mode

Invoking this command authorizes the whole run, including merging PRs into `autopilot.branch`. It stops before starting only when a preflight check fails (see the skill), and during the run only for the stop conditions the skill lists. Every outcome lands in `.catalyst/waves/wave-<id>.md`, ending with `## Morning report`.

**Arguments:** $ARGUMENTS
