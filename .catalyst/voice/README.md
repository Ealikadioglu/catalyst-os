# Catalyst Voice Runtime

Local browser **project hub** for `/meet-spec`. **Zero npm dependencies** — Node stdlib
only. Requires **Node >= 18** and the `claude` CLI on your PATH.

The hub (served at `/`) is the landing page and offers two ways to talk to the project,
both reading the codebase live:

- **💬 Chat** (`/chat`) — a text-only conversation about vision and ideas. Runs on local
  `claude -p` regardless of mode.
- **🎙️ Meeting** (`/meeting`) — the spoken spec-shaping meeting (diy or bundled).

If `.catalyst/dashboard.html` exists, the hub embeds it (also served at `/dashboard`).
Both chat and meeting write the same `meeting.md` artifact on end.

The **meeting** has two modes, set by `voice.mode` in `.catalyst/main/project-config.yaml`:

| | **diy** (default) | **bundled** |
|---|---|---|
| Speech | Browser Web Speech API | ElevenLabs Conversational AI |
| Brain | Local `claude -p` | ElevenLabs agent (Claude LLM) |
| Voice quality | Robotic (browser TTS) | Natural |
| Cost | **Free** (uses your Claude) | ~$0.10–$1/min (ElevenLabs, BYOK) |
| Setup | None — just Chrome | API key + agent (see below) |

Both modes give the agent full read access to the codebase, docs, and web search, and
both write the same `meeting.md` artifact. **Artifacts are always in English**, whatever
language the meeting is spoken in (set `voice.language`, e.g. `"tr"`).

## DIY mode (default — nothing to set up)

```yaml
voice:
  enabled: true
  language: "tr"      # or "en", etc.
  mode: diy
```

Open the room (via `/meet-spec`), click **Start meeting**, and talk. Chrome transcribes
your speech, `claude -p` answers from the real repo, and the browser speaks the reply.
You can also **type** in the text box at any time (great when speech is misheard). Needs
Chrome/Chromium for speech; in other browsers, the text box still works.

## Bundled mode (optional — nicer voice, paid)

1. **Get an ElevenLabs API key** at https://elevenlabs.io. Conversational AI is billed
   **per minute** (~1,000 credits/min on credit plans), so prefer a plan with included
   agent-minutes. Paste the key into `.catalyst/secrets.local.yaml`:
   ```yaml
   elevenlabs_api_key: "your-key-here"
   ```
2. **Create a Conversational AI agent** (dashboard): LLM = Claude; a spec-shaping
   interviewer system prompt; a **client tool** named exactly **`investigate_codebase`**
   with one **string** parameter **`query`**. For non-English, enable the **language
   override** (Security/Overrides → Language) and use a multilingual TTS model
   (`eleven_flash_v2_5`).
3. **Point Catalyst at it**:
   ```yaml
   voice:
     enabled: true
     language: "tr"
     mode: bundled
     agent_id: "your-agent-id"
   ```
   The key is read server-side by `meet-server.js` and never reaches the browser, argv,
   or env. Signed URLs are minted server-side; client tools run in the browser so they
   reach `localhost` — nothing is exposed to the internet.

## How it works

```
chat:     Browser (text)  ──text──►  meet-server /turn (kind:chat)  ──►  claude -p (repo)  ──►  reply
diy:      Browser (Web Speech)  ──text──►  meet-server /turn  ──►  claude -p (repo)  ──►  reply ──► browser TTS
bundled:  Browser (ElevenLabs SDK)  ◄─voice─►  ElevenLabs agent
              └─ investigate_codebase ─► meet-server /tool ─► claude -p (repo)
```

Ending a session (**End meeting** in the room, **End & save notes** in chat) sends the
transcript to the daemon, which folds it into `.catalyst/meetings/YYYY-MM-DD-{slug}/meeting.md`
via one `claude -p` pass, then shuts down.

## Run it manually

```bash
PORT=4399 \
MEETING_DIR=".catalyst/meetings/2026-01-01-test" \
MEETING_TOPIC="Test meeting" \
node .catalyst/voice/meet-server.js
# then open http://localhost:4399
```
