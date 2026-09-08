# Boilerplate Library

Reusable, **project-agnostic** guides distilled from the most settled patterns across the
catalyst-os projects. This folder is the **canonical, merged copy** — per-project
`.catalyst/library/` folders (CallCentA, GalopSpace, RareEvidence, RaresumSpace, SiemoSpace)
were consolidated here on 2026-09-05; where copies had diverged, the most complete version won.

Each guide is pseudo-code + rationale — a starting point for new projects, not a copy of any one
project's code. When you begin a new project, open the relevant guide and adapt the shapes; the
gotchas are the parts that took real pain to learn.

Most guides follow the same shape: **When to use → Architecture & why → Pattern (pseudo-code)
→ Variations → Trade-offs → Env vars → Gotchas → Checklist.** The three guides that came from
SiemoSpace use an older header (`Category / Complexity / Last Updated / Based on`) followed by
Overview → When to Use → Key Considerations; they are marked below and should be migrated to
the eight-section template when next touched.

## Guides

**14 guides.** Source column = the project the canonical copy was taken from.

### App base & auth

| Guide | What it covers | Reach for it when… | Source |
|---|---|---|---|
| [Next.js SaaS Boilerplate](./nextjs-saas-boilerplate.md) | The `boilerplate-app-main` app base: what you inherit (auth, onboarding, billing, admin, i18n, tests), the 8 patterns worth keeping, and the 10 defects to fix on day one | Starting a project from the template, or telling template code from domain code | CallCentA |
| [Supabase Auth](./supabase-auth.md) | JWT verify-at-edge (ES256/JWKS + HS256), service-role vs anon, tiered admin routers, `@supabase/ssr` frontend triad, service-to-service `X-API-KEY` | Standing up auth on any Supabase project | shared (identical in 4 projects) |
| [OAuth Token Health Monitoring](./authentication.md) † | Proactive token-expiry monitoring for third-party OAuth (Gmail, LinkedIn, Slack…): permanent vs transient refresh failures, per-provider expiry thresholds, self-service reconnect | Any integration that holds user OAuth tokens long-term | SiemoSpace |

### Backend & data

| Guide | What it covers | Reach for it when… | Source |
|---|---|---|---|
| [API Envelope + FastAPI](./api-envelope-fastapi.md) | `{success, message, data, errors}` envelope, router→service→db layering, global exception handler, PostgREST 1000-row workaround | Building a FastAPI backend | shared |
| [Supabase Migrations + RLS](./supabase-migrations-rls.md) | Idempotent up-only migrations, default-deny RLS + service-role bypass, jsonb read RPCs, SECURITY DEFINER resets; gotchas 7–10 on column-level `REVOKE`, `bypassrls` scope, `TRUNCATE`, partial unique indexes | Managing schema & row security | CallCentA (superset of the shared copy) |

### Pipelines & AI

| Guide | What it covers | Reach for it when… | Source |
|---|---|---|---|
| [Celery + Polling](./celery-polling-architecture.md) | Beat pollers over triggers, atomic row claim, per-service brokers, queue partitioning, fork safety | Background jobs / event fan-out | shared |
| [DAG Workflows](./dag-workflows.md) | Declarative node graph, `TaskContext`, routers/concurrent/agent nodes, registry, the 4-artifact Definition of Done | Building a multi-step processing pipeline | shared |
| [AI / LLM Integration](./ai-llm-integration.md) | Provider-agnostic `AgentConfig` + factory, OpenRouter transport, structured output, prompt caching, token accounting, graceful degradation | Calling LLMs from app/worker code | shared |
| [LangSmith Integration](./langsmith-integration.md) | Import-guarded tracing, `@traceable` per call, `workflow.node` run naming, token metadata, prompt hub | Adding LLM observability | shared |
| [ElevenLabs Voice Agents](./elevenlabs-voice-agents.md) | Injectable HTTP seam, create-agent, dialling with per-contact variables, the validate-before-you-bill gate, transcript grading, workflow graphs, buy-vs-build for a campaign engine | Placing outbound AI voice calls to real people | CallCentA |

### Infra & deploy

| Guide | What it covers | Reach for it when… | Source |
|---|---|---|---|
| [Docker Compose Orchestration](./docker-compose-orchestration.md) | `PROJECT_NAME`-driven naming, web+workers+beat+redis per service, `ENVIRONMENT`-gated CMDs, proxy-env blanking | Local multi-service dev setup | shared |
| [DigitalOcean App Platform](./digitalocean-app-platform.md) | One spec-YAML per env, one image → web+workers+beat via `run_command`, path-based ingress, dedicated egress IP, `deploy_on_push`, the plaintext-secret & pgbouncer-port traps | Deploying the stack to a managed PaaS | GalopSpace / RareEvidence |

### Payments & Turkish compliance

| Guide | What it covers | Reach for it when… | Source |
|---|---|---|---|
| [Payment Integration Patterns](./payment-integration.md) † | PayTR gateway + credit-based subscriptions, webhook signature validation (400 not 200), max-refund limits, account-scoped card ops, recurring billing | Taking payments or metering usage in a TR-market SaaS | SiemoSpace |
| [Logo İşbaşı E-Fatura](./logo-isbasi-efatura.md) † | GIB-compliant e-invoice generation via Logo İşbaşı API, VKN/TCKN handling, decoupled (eventually consistent) invoice submission with retries, 10-year retention | Legally invoicing Turkish businesses or individuals | SiemoSpace |

† Older SiemoSpace template — see note above.

## How the guides relate

```
   digitalocean-app-platform ── deploys the same image/services that ─┐
                                docker-compose runs locally           │
                 ┌─────────────────── docker-compose-orchestration ───────────────────┐
                 │  runs every service; ENVIRONMENT-gated; per-service Redis           │
                 │                                                                     │
   supabase-auth ──► api-envelope-fastapi ──► supabase-migrations-rls                  │
   (verify @ edge,   (router→service→db,      (RLS + service-role + RPCs)              │
    service-role)     envelope, 1000-cap)                                              │
        │                    ▲                                                         │
        │                    │ triggers                                               │
        ▼                    │                                                         │
   celery-polling-architecture ──► dag-workflows ──► ai-llm-integration ──► langsmith  │
   (pollers claim rows,          (node graph,        (AgentConfig +          (traces   │
    run in-process)               registry, 4 arts)   provider factory)       per node)│
        │                                                    │                         │
        │ submits batches                                    │ authors the prompt      │
        ▼                                                    ▼                         │
   elevenlabs-voice-agents ──────────────────────────────────┘                         │
   (one HTTP seam, 422 gate before billing, grade from transcripts)                     │
                 └─────────────────────────────────────────────────────────────────────┘

   Side rails (plug into api-envelope-fastapi + supabase-migrations-rls, driven by celery pollers):

   authentication (OAuth token health) ── monitors 3rd-party tokens the app holds for users
   payment-integration ──► logo-isbasi-efatura
   (PayTR + credits ledger,  (e-fatura issued *after* payment, retried by a poller,
    webhook sig = 400)        never blocks checkout)
```

Guides cross-link with `[[guide-name]]` markers pointing at each other's slugs.

`nextjs-saas-boilerplate` sits *upstream* of this whole diagram for any project started from the
template: it is the concrete base that already answers auth, envelope and migration questions in
Next.js terms, and it tells you which of the guides above you still need.

## Recurring principles across the stack

These show up in more than one guide — they're the house style worth carrying to any project:

- **Verify/validate once at the boundary, trust downstream** (auth middleware; envelope; DAG event parsing).
- **Service-role on the backend, RLS as a backstop** — authorize in app code, default-deny at the DB.
- **Pollers, not Postgres triggers**, for event fan-out — observable, testable, in-process.
- **Atomic claim** any row a poller/worker picks up (`UPDATE ... WHERE claimed_at IS NULL RETURNING`).
- **Actor-less writes get a `"system"` sentinel** on NOT-NULL `created_by` columns.
- **Idempotent, additive changes** — migrations re-run cleanly; provider/tracing layers degrade to no-ops.
- **One knob per concern** — `PROJECT_NAME` for infra naming, `ENVIRONMENT` for dev/prod behavior, one envelope shape, one LLM abstraction.
- **Graceful degradation with loud logs** — partial-JSON recovery, zero-vector embeddings, tracing no-op — keep the pipeline alive but never silent.
- **A 2xx is not proof it happened** — vendors accept shapes they then ignore; read back what you wrote.
- **Never spend money on unvalidated input** — refuse at the boundary; a billed side effect cannot be undone.
- **Money and legal side effects are decoupled and eventually consistent** — take the payment, then issue the e-fatura from a retrying poller; never make compliance block checkout.
- **Reject bad webhooks loudly** — invalid signature → 400, never a polite 200 that hides the problem.
- **Beware the local-dev traps** — OrbStack proxy env crashing httpx, `--reload` masking crash-loops, PostgREST's 1000-row cap, cross-broker `send_task` orphaning.

## Adding a new guide

Keep it project-agnostic (pseudo-code, generic names), follow the eight-section template, and
add a row to the table above plus any `[[links]]` to related guides. Prefer extracting a pattern
only once it has **settled** across at least one real project — the value is in the earned gotchas.
