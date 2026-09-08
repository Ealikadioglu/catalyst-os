# ElevenLabs Voice Agents (outbound calling)

> Driving a hosted conversational-voice platform from application code: creating agents,
> dialling with per-contact variables, retrieving and *grading* transcripts, and optionally
> multi-phase workflow graphs. Pseudo-code only (TypeScript-flavoured — this pattern was earned
> in Node).
>
> Every gotcha below cost a real, billed phone call to find.

## When to use

- You place outbound calls where an AI agent talks to a human, and the platform (ElevenLabs
  ElevenAgents, or a peer like Vapi) owns the media leg — you never touch audio.
- Each call needs **per-contact personalisation** (a name, an amount, an appointment).
- You need to know afterwards what was actually said, and to judge it programmatically.
- The calls cost money and reach real people, so "it returned 2xx" is not good enough.

Pairs with [[celery-polling-architecture]] (a campaign runner claims rows and submits batches)
and [[api-envelope-fastapi]] (the dial route returns a typed refusal, not a silent success).

**Do not reach for this** to build a dialler from scratch. The platform sells fan-out,
concurrency and scheduling; what you own is everything that makes a campaign *safe* — see
Trade-offs.

## Architecture & why

```
 app code                          vendor
 ────────                          ──────
 buildAgentPayload() ──► POST /agents/create ──────► agent_id
 buildDialPayload()  ──► POST /sip-trunk/outbound-call ► conversation_id + sip_call_id
       │  dynamic_variables                                │
       │                                                   ▼
 validate BEFORE dialling  ◄── the 422 gate            (call happens)
                                                           │
 fetchTranscript()  ◄── GET /conversations/{id} ◄──────────┘
       │  turns · per-turn model · per-turn latency · cost · termination reason
       ▼
 grade the call by MEASUREMENT, not by listening
```

**Key decision — one injectable HTTP client, everywhere.** Every vendor call goes through a
single `createClient({ transport })`. Nothing else in the codebase calls `fetch` directly. This
is the seam that lets the entire suite run with zero network access and zero billed calls, and
it is worth more than any other structural choice here.

**Key decision — validate at the boundary, before anything is billed.** A dial that cannot
satisfy the agent's required variables must be refused with a typed error *before* the call is
placed. Never substitute an empty string: `"1.240,50 TL"` becoming `"TL"` is worse than no call.

**Key decision — read back what you wrote.** Vendor endpoints accept shapes they then ignore.
Treat a 2xx as "the request was accepted", never as "the thing happened".

**Key decision — the agent's LLM is a pinned, verified setting.** It is not a preference knob;
see Gotchas.

## Pattern (pseudo-code)

### 1. The injectable transport (do this first)

```ts
function createClient({ transport = fetchTransport } = {}) {
  return {
    async request({ url, method, headers, body }) {
      const { status, json } = await transport({
        url, method, headers,
        body: typeof body === "string" ? body : JSON.stringify(body),
      });
      if (status < 200 || status > 299) throw new Error(`HTTP ${status} for ${method} ${url}: ${json}`);
      return json;
    },
  };
}

// every module takes it as an explicit argument — never a module-global, never a direct fetch
async function createAgent(draft, httpClient) { ... }
async function dial(args, httpClient) { ... }
```

Tests inject a transport that records the request and returns a canned response. Add one test
per module that poisons `globalThis.fetch` to throw — it proves nothing slipped past the seam.

### 2. Create an agent

```ts
function buildAgentPayload({ name, systemPrompt, firstMessage, language, voiceId }) {
  return {
    name,
    conversation_config: {
      agent: { prompt: { prompt: systemPrompt, llm: PINNED_MODEL },
               first_message: firstMessage, language },
      tts:   { voice_id: voiceId, model_id: TTS_MODEL },
    },
  };
}
```

Keep every vendor field name inside **one** banner-delimited block per module. When a shape is
inferred rather than confirmed, say so in the banner with a `TODO(user)` naming the exact open
question; convert it to a dated *confirmed-live* record once probed. Never delete the banner —
in a repo where specs are gitignored it may be the only versioned proof the check happened.

### 3. Dial with per-contact variables — and refuse when you can't

```ts
function requiredTokens(firstMessage, systemPrompt) {  // {{name}} → ["name"]
  return unique(matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, firstMessage + systemPrompt));
}

async function placeCall({ agentId, toNumber, variables }, httpClient) {
  const missing = requiredTokens(...).filter(t => isBlank(variables[t]));
  if (missing.length) return { ok: false, code: 422, missing };   // ← nothing billed

  return httpClient.request({
    url: OUTBOUND_CALL_URL, method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: { agent_id: agentId, agent_phone_number_id: PHONE_ID, to_number: toNumber,
            conversation_initiation_client_data: { dynamic_variables: variables } },
  });
}
```

Persist the variables you sent **as a snapshot on the call row**. What the agent said is
immutable history; the contact's current name is not.

### 4. Retrieve and grade

```ts
const call = await httpClient.request({ url: `${CONVERSATIONS_URL}/${id}`, headers: { "xi-api-key": KEY } });

// the transcript carries far more than text:
call.transcript[i].producing_llm            // which model ACTUALLY ran
call.transcript[i].agent_metadata           // active workflow node, when graphs are used
call.transcript[i].conversation_turn_metrics // per-turn ASR / LLM TTFB / TTS TTFB
call.metadata.termination_reason            // why it ended
call.metadata.cost                          // what it cost

// grade programmatically — e.g. "did the agent actually ask every required question?"
const asked = new Set(call.transcript.filter(t => t.role === "agent" && t.message).map(nodeOf));
const skipped = REQUIRED_STEPS.filter(s => !asked.has(s));
```

### 5. Multi-phase workflow graphs (optional)

```ts
// semantic phases in → vendor graph out. Keep raw field names in THIS module only.
buildWorkflow([{ label, prompt, entryCondition }, ...])
  → { nodes: { start_node, phase_1…phase_N, end_node }, edges: { … } }

await httpClient.request({ url: agentUrl(id), method: "PATCH",
  body: { workflow } });                      // TOP-LEVEL. see Gotchas.
const back = await getRaw(agentUrl(id));      // verify the nodes landed
```

Node and edge ids should be deterministic human-readable slugs so the graph round-trips
key-for-key and a human can review it before it goes live.

## Variations

- **Single-prompt agent** (no graph). Correct default. Reach for a graph only when a phase is
  genuinely distinct — a different objective, its own entry condition, content that would be
  wrong to say earlier.
- **Batch/fan-out** instead of one-call-per-request when the vendor offers it: one submit, N
  recipients, each with its own variables. Buy this; do not loop the single-dial endpoint.
- **Prompt-driven platforms (e.g. Vapi)** build a transient assistant per call from a persona,
  with no graph. Every graph failure mode below disappears — at the cost of no structural
  guarantee that a phase is entered.
- **Authoring-time LLM ≠ call-time LLM.** Generating a prompt from a plain-language scenario is
  a separate, cheaper concern ([[ai-llm-integration]]); the agent's own model is configured
  inside the agent.

## Trade-offs

| Capability | Buy from the platform | Build yourself |
|---|---|---|
| Fan one submit out to N concurrent dials | ✅ | |
| Per-recipient dynamic variables | ✅ | |
| Per-recipient status + conversation id | ✅ | |
| Scheduled start, self-throttled concurrency | ✅ | |
| Daily call windows / quiet hours | | ✅ only a *start* time exists |
| Suppression / DNC list | | ✅ no such concept in the API |
| Per-row validation before submit | | ✅ **highest leverage** — failures surface as one opaque status |
| Retry policy (backoff, caps) | | ✅ the retry endpoint is a manual one-shot |
| Cost attribution per campaign | | ✅ per-call cost exists; no roll-up |

**The campaign engine is not a dialler.** The dialler is bought. What you build is the layer that
makes a campaign safe and repeatable — a materially smaller job, and it changes what your worker
has to be: it slices lists and submits batches on a schedule, it does not hold N calls open.

## Env vars

```
ELEVENLABS_API_KEY            # header xi-api-key — NEVER a ?key= query param (URLs land in logs)
ELEVENLABS_PHONE_NUMBER_ID    # the imported Verimor SIP trunk number; server-side only, never from the browser
VERIMOR_SMS_USERNAME          # platform-owned Verimor credentials for SMS / 2FA
VERIMOR_SMS_PASSWORD
VERIMOR_SMS_SOURCE_ADDR
```

Voice ids, agent ids and phone-number ids are **account-scoped**. If the API key ever changes
account, re-check every one of them before assuming a config is portable.

## Gotchas

1. **A 2xx can mean nothing happened.** Writing a workflow graph nested under
   `conversation_config.workflow` (as the docs showed) returns **HTTP 200 and silently discards
   it**; the write must be a **top-level `workflow` key**. A fully green test suite coexisted
   with a feature that had never once worked, because the tests encoded the documented shape.
   **Always read back what you wrote.**
2. **A missing variable does not fail synchronously.** The dial returns 200; the conversation
   later resolves to `failed`, **credits are consumed and the recipient hears silence**. This is
   why the 422 gate exists and why it must sit *before* the billed call.
3. **Validate before you bill.** Malformed input that reaches a paid call can create a real agent
   and *then* throw, losing its id. Gate at the route boundary (reject, zero outbound calls) and
   make the module total (never throws) as defence in depth. Neither is the other's safety net.
4. **A graph edge is a tool the model may fire at any instant.** "Unconditional" does not mean
   "taken when this node's work is done" — an unconditional edge into the end node let the model
   hang up before the last phase spoke. Every edge needs a condition that is explicitly false
   until the caller has answered *this* step.
5. **The agent LLM is a correctness choice, not a preference.** Same prompt, same graph, same
   voice: one model asked every required question; other models silently skipped one or two, and
   one **invented a customer record** and read the conversation transcript back aloud. An
   anti-hallucination rule in the prompt does not survive a model that cannot hold it. Pin the
   model, and verify per call via `producing_llm` — a console change that was never *published*
   silently does not take effect.
6. **A smooth call may be the call that did less work.** A short call that "felt successful" had
   skipped two required questions; a longer one had asked them all. Fluency and completeness pull
   in opposite directions. Grade by measurement — never by listening alone.
7. **Undocumented account gates exist.** Batch calling required a one-time Terms acceptance in
   the vendor console (an opaque `403` until then) and could not be combined with zero-retention
   mode. Expect at least one of these per feature, and surface the vendor's error text in your
   logs — a generic 500 hides exactly the message you need.
8. **When a call never connects, the vendor cannot tell you why.** The conversation sits at
   `initiated` with no error; the reason (`busy`, `no-answer`, an error code) lives in the
   carrier's own call log. Health checks must read both sides.
9. **Voice quality is mostly turn-taking, not the voice.** Turn timeout, patience, and filler
   behaviour dominate perceived naturalness. Check the default filler's *language* — a platform
   default in English fires mid-call in another language.
10. **ASR is weak on proper nouns in non-English languages.** Echo names back for correction, and
    never record an unconfirmed name as fact.

## Checklist

- [ ] Every vendor call goes through one injected HTTP client; a fetch-poisoning test proves it
- [ ] Raw vendor field names live in one banner-delimited block per module
- [ ] Inferred shapes carry a `TODO(user)`; confirmed ones carry a dated live record
- [ ] A dial that cannot satisfy required variables is refused before it is billed
- [ ] Variables sent are snapshotted on the call row
- [ ] Every write that matters is read back and verified
- [ ] The agent LLM is pinned and asserted per call
- [ ] Call quality is graded from the transcript, not from listening
- [ ] Vendor error text reaches the logs (never collapsed into a generic 500)
- [ ] Campaign safety — windows, suppression, per-row validation, retry, cost roll-up — is owned

---

## Reference implementation

Not pseudo-code — a working, live-verified POC in this workspace:

**`/Users/effa/Documents/Github-Inactives/_experiments/siemo-voice-agent`** (branch
`development`, all specs archived, 352 tests passing, zero npm dependencies).

| What | Where |
|---|---|
| Injectable transport | `lab/lib/http-client.js` |
| Create agent · attach a workflow | `lab/lib/eleven-create.js` |
| Dial with dynamic variables | `lab/lib/dial.js` |
| Transcript fetch / normalise / poll | `lab/lib/transcript.js` |
| `{{token}}` extraction + substitution | `lab/lib/variables.js` |
| Phases → workflow graph (pure) | `lab/lib/workflow.js` |
| Batch calling + CSV | `lab/lib/batch.js`, `lab/lib/csv.js` |
| Scenario → agent draft (authoring LLM) | `lab/lib/generator.js` |

**Read before porting:** `CallCenterA/.catalyst/migration.md` — module-by-module port plan, what
deliberately does not move, and the phase order.

**Evidence for every gotcha above:** the POC's sealed specs under `.catalyst/specs/completed/`,
in particular `2026-08-12-lab-workflow-graph-generation/live-tuning-log.md` (model comparison,
turn-taking settings, what makes a non-English call sound human) and
`2026-08-06-lab-batch-calling/research.md` (the build-or-buy analysis behind the table above).
