---
name: meet-spec
description: Talk through a project as free-form chat or a spoken meeting, then shape the result into a spec. Use for /meet-spec.
---

# Meet Spec

> **When to invoke:** When the user wants to talk through their project — either a
>   free-form **chat** about vision/ideas, or a spoken **meeting** to shape a spec.
> **Invoked by:** `/meet-spec` command.
> **Orchestrator:** Catalyst agent.

## Purpose

Open a local, browser-based **project hub**. The hub is the landing page and offers two
ways to talk to the project, both grounded in live codebase access:

- **💬 Chat with your project** — a text-only conversation about the user's vision,
  ideas, and what they'd like to build. A written thinking partner, not a formal
  interview.
- **🎙️ Start a meeting** — the spoken spec-shaping meeting (diy Web Speech or bundled
  ElevenLabs).

If a dashboard has been generated, the hub embeds `.catalyst/dashboard.html` below the
two options. **Both** chat and meeting end by writing the same structured,
`/catalyze-spec`-ready notes artifact.

**This skill does NOT produce a spec.** It produces a meeting artifact. The user runs
`/catalyze-spec @<artifact>` afterwards, when they choose to.

## Output Location

```
.catalyst/meetings/YYYY-MM-DD-{slug}/
└── meeting.md        # Summary + Decisions + Action Items + Open Questions + Research Findings + Transcript
```

## Modes

`voice.mode` in `project-config.yaml` picks how the meeting runs:

- **diy** (default, free) — the browser does speech (Web Speech API) and the brain is a
  local `claude -p`, which reads the codebase/docs and searches the web natively. No
  ElevenLabs, no API key, no per-minute cost. Needs Chrome and the `claude` CLI on PATH.
- **bundled** — ElevenLabs Conversational AI. Nicer voice, but billed per minute (BYOK).
  Requires `elevenlabs_api_key` in `.catalyst/secrets.local.yaml`, `voice.agent_id` in
  config, and an agent that has a `investigate_codebase` client tool. See the README.

`language` sets the spoken meeting language (e.g. `"tr"`); written artifacts stay English.

## Workflow

### Phase 0: Preflight (stop early if not ready)

1. Read `.catalyst/main/project-config.yaml`. If `voice.enabled` is not `true`, stop and
   tell the user how to enable it. Do not proceed.
2. Check `node --version` is >= 18 and `.catalyst/voice/meet-server.js` exists; otherwise
   stop and explain (re-install catalyst-os if the runtime is missing).
3. **Bundled mode only:** check `.catalyst/secrets.local.yaml` has a non-empty
   `elevenlabs_api_key` and `voice.agent_id` is set. If missing, stop with setup
   instructions — do NOT print or echo the key. In **diy** mode, skip this check entirely.

**On any failure: stop gracefully. Voice is optional; never break the rest of Catalyst.**

### Phase 1: Initialize meeting folder

1. Determine the topic from `$ARGUMENTS`; if empty, ask the user one short question.
2. Derive a kebab-case `{slug}` from the topic.
3. Create `.catalyst/meetings/YYYY-MM-DD-{slug}/` (today's date).

### Phase 2: Launch the meeting room

Start the local daemon in the background and open the browser. The server reads config
(and, in bundled mode, the key from `secrets.local.yaml`) itself — never pass the key on
the command line or env.

```bash
PORT=4399 \
MEETING_DIR=".catalyst/meetings/YYYY-MM-DD-{slug}" \
MEETING_TOPIC="{topic}" \
node .catalyst/voice/meet-server.js &
```

Run it from the project root (so `claude -p` investigations resolve against this repo).
Then open `http://localhost:4399` (e.g. `open`, `xdg-open`, or `start`) — this is the
**project hub**. Tell the user: "The project hub is open. Pick **💬 Chat with your
project** to talk through ideas, or **🎙️ Start a meeting** to shape a spec by voice.
Click **End** when you're done and I'll pick up the notes."

### Phase 3: Wait for the artifact

Poll for `.catalyst/meetings/YYYY-MM-DD-{slug}/meeting.md`. It is written when the user
ends the session (**End meeting** in the room, or **End & save notes** in chat) — the
server folds the transcript + live findings into the artifact and shuts itself down.
Whichever path the user chose, the artifact lands in the same place.

### Phase 4: Output

```
Meeting captured.

Artifact: .catalyst/meetings/YYYY-MM-DD-{slug}/meeting.md
  ├── Summary
  ├── Decisions
  ├── Action Items
  ├── Open Questions
  ├── Research Findings   (live codebase investigations from the meeting)
  └── Transcript

Next step — shape it into a spec when you're ready:
  /catalyze-spec @.catalyst/meetings/YYYY-MM-DD-{slug}/meeting.md
```

**Do NOT auto-run `/catalyze-spec`.** The user references the artifact themselves.

## Notes

- **Live codebase access:** in **diy** mode every turn is a headless `claude -p` in this
  repo, so the agent reads the codebase/docs and searches the web natively. In **bundled**
  mode the ElevenLabs agent calls the `investigate_codebase` client tool, which the browser
  relays to the daemon, which runs the same `claude -p`. Either way it loads Catalyst's
  agents and can delegate to Seer/Scout.
- **Typed messages:** the meeting room has a text box; typed messages are sent as user
  turns (handy when speech is misheard) and appear in the transcript.
- **Latency:** investigations take seconds; the meeting room shows a "thinking" indicator
  while the agent says it is looking into it. This is expected meeting behavior.
- **Cost:** billed to the user's ElevenLabs account (~$0.10/min bundled). A 30-min meeting
  is ~$3.
