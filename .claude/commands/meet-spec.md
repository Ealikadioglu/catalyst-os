# /meet-spec

Hold a **voice meeting** with Catalyst, then turn the notes into a spec.

Start a local browser meeting room. Talk through a feature; the meeting agent can
investigate the codebase, docs, and web live (via `claude -p` → Seer/Scout). When you
click **End meeting**, a structured, `/catalyze-spec`-ready notes artifact is written.

Default mode is **diy** — free, browser speech + local Claude, no API key. Switch
`voice.mode` to `bundled` for ElevenLabs' nicer (paid) voice.

> **Lifecycle position:** **`/meet-spec`** → `/catalyze-spec` → *(optional)* `/challenge-spec` → `/forge-spec` → `/audit-spec` → `/seal-spec`

## Usage

```
/meet-spec "realtime notifications"
/meet-spec                          # will ask for the meeting topic
```

The output is a meeting artifact, NOT a spec. After the meeting, shape it yourself:

```
/catalyze-spec @.catalyst/meetings/YYYY-MM-DD-{slug}/meeting.md
```

## Pre-computed Context

```bash
echo "=== NODE VERSION ===" && node --version
echo "=== CLAUDE CLI? ===" && command -v claude >/dev/null && echo "claude found" || echo "MISSING claude CLI (needed for the brain)"
echo "=== VOICE CONFIG ===" && sed -n '/^voice:/,/^[^ ]/p' .catalyst/main/project-config.yaml 2>/dev/null || echo "No voice config"
echo "=== VOICE RUNTIME? ===" && test -f .catalyst/voice/meet-server.js && echo "meet-server.js found" || echo "MISSING .catalyst/voice/ (re-install catalyst-os)"
echo "=== SECRETS (bundled mode only) ===" && test -f .catalyst/secrets.local.yaml && echo "secrets.local.yaml found" || echo "no secrets.local.yaml (only needed for bundled mode)"
```

---

**Invoke skill:** `meet-spec`

**Orchestrator:** Catalyst (the meeting persona lives in the ElevenLabs agent prompt; codebase investigation delegates to Seer/Scout via headless `claude -p`)

**Process skills used:** `brainstorming`, `agent-delegation`
