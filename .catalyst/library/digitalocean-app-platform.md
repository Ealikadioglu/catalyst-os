# DigitalOcean App Platform Deployment

> One declarative app-spec YAML per environment; the SAME backend image runs as web +
> N Celery workers + beat, differentiated only by `run_command`; path-based ingress puts
> frontend and API on one domain; `deploy_on_push` per branch. Config sketches only —
> **never** commit real secret values (see Gotcha #1).

## When to use

- You want git-push-to-deploy with **no servers to patch** — App Platform builds your Dockerfiles and runs the containers (the managed-PaaS counterpart to the local [[docker-compose-orchestration]] stack).
- A stack of a FastAPI/API service ([[api-envelope-fastapi]]) + a JS frontend + Celery workers/beat ([[celery-polling-architecture]]), each a *component* in one app.
- Managed Postgres/Redis live **outside** the app (Supabase, Upstash) and you connect over TLS — see [[supabase-migrations-rls]].
- You need a **stable outbound IP** because an upstream API allowlists you by IP.

Reach for a **Droplet + your own compose** instead when you need SSH, custom kernels, GPUs, persistent local disk, or long-running non-HTTP daemons App Platform won't host.

## Architecture & why

```
                      ┌──────────────  ONE app = ONE domain  ──────────────┐
   git push main ──►  │  ingress (path-routing):                            │
        │             │    /api  /health  /docs  /openapi.json ─► backend   │
        │             │    /                                    ─► frontend │
        │             │                                                     │
   deploy_on_push ──► │  services (get HTTP + a public URL):                │
   builds Dockerfiles │    backend-api  (uvicorn, http_port 8000)          │
   per component      │    frontend     (node server, http_port 3000)      │
                      │  workers (no ingress, no port):                     │
                      │    celery-worker            run_command: celery … worker
                      │    celery-prediction-worker run_command: celery … worker -Q predictions
                      │    celery-beat              run_command: celery … beat  │
                      │  egress: DEDICATED_IP  ───────────────► upstream API (IP-allowlisted)
                      └─────────────────────────────────────────────────────┘
        managed Postgres (Supabase)  ◄── TLS ──┤   managed Redis (Upstash, rediss://)  ◄──┘
```

**Key decision — one image, many components, `run_command` differentiates.** All four backend components share `dockerfile_path: backend/Dockerfile.prod`. The Dockerfile's `CMD` (uvicorn) is what the web service runs; each **worker overrides it with `run_command`** in the spec. This is the App-Platform equivalent of the `ENVIRONMENT`-gated CMD in [[docker-compose-orchestration]] — one build, N runtime roles, no per-worker Dockerfile.

**Key decision — path-based ingress = single domain, no browser CORS.** `/api` routes to the backend, `/` to the frontend, on the *same* host. So the frontend calls `NEXT_PUBLIC_API_URL=https://site.com/api` (same-origin) and browsers never preflight. The backend still needs a CORS allowlist for the `*.ondigitalocean.app` default hostname and any apex/www variants.

**Key decision — `DEDICATED_IP` egress.** Default egress is a rotating shared pool. A `DEDICATED_IP` gives the whole app one stable outbound address to hand an upstream vendor for their IP allowlist. Without it, an IP-gated upstream intermittently 403s as the shared IP rotates.

**Key decision — spec-as-code, one file per environment.** `app.yaml` (dev-preview, tracks `development`) and `prod-app.yaml` (prod, tracks `main`) are the source of truth, applied with `doctl apps update <id> --spec`. Two files, two apps, no drift between "what's deployed" and "what's in git" — *if* you keep re-exporting (Gotcha #6).

## Pattern (config sketches)

### 1. App spec skeleton (`.do/app.yaml`)

```yaml
name: myapp-dev                     # app name (unique per DO account)
region: fra                         # pick one close to your DB/users
features: [buildpack-stack=ubuntu-22]
egress: { type: DEDICATED_IP }      # stable outbound IP for upstream allowlists
alerts:
  - { rule: DEPLOYMENT_FAILED }
  - { rule: DOMAIN_FAILED }
domains:
  - { domain: dev.example.com, type: PRIMARY }
  # prod also: { domain: www.example.com, type: ALIAS, zone: example.com }

ingress:
  rules:                            # FIRST match wins → list specific prefixes before "/"
    - { component: { name: backend-api }, match: { path: { prefix: /api } } }
    - { component: { name: backend-api }, match: { path: { prefix: /health } } }
    - { component: { name: backend-api }, match: { path: { prefix: /docs } } }
    - { component: { name: backend-api }, match: { path: { prefix: /openapi.json } } }
    - { component: { name: frontend    }, match: { path: { prefix: / } } }   # catch-all LAST
```

### 2. A web service component

```yaml
services:
- name: backend-api
  source_dir: backend
  dockerfile_path: backend/Dockerfile.prod
  github: { repo: org/repo, branch: development, deploy_on_push: true }
  http_port: 8000                   # MUST equal the port the container listens on
  instance_count: 1
  instance_size_slug: basic-xs      # smallest paid tier; scale up per component
  health_check:
    http_path: /health
    initial_delay_seconds: 120      # long enough for cold boot + migrations (see Gotcha #4)
    period_seconds: 10
    failure_threshold: 5
    timeout_seconds: 5
  envs:
    - { key: ENVIRONMENT, value: staging,      scope: RUN_AND_BUILD_TIME }
    - { key: DATABASE_URL, value: ${DATABASE_URL}, scope: RUN_TIME, type: SECRET }   # ← §5
```

### 3. Worker & beat components — same image, different `run_command`

```yaml
workers:                            # workers get NO http_port, NO ingress, NO public URL
- name: celery-worker
  source_dir: backend
  dockerfile_path: backend/Dockerfile.prod          # SAME image as backend-api
  github: { repo: org/repo, branch: development, deploy_on_push: true }
  instance_size_slug: apps-s-1vcpu-2gb
  run_command: celery -A app.celery_app worker
    --queues=default,data_sync,maintenance --concurrency=2 --max-tasks-per-child=100
  envs: [ ... ]                     # workers need DB/Redis/API-key envs; NOT web-only ones

- name: celery-prediction-worker    # heavy queue isolated onto its own component (Gotcha #3)
  dockerfile_path: backend/Dockerfile.prod
  instance_size_slug: apps-s-1vcpu-1gb
  run_command: celery -A app.celery_app worker --queues=predictions
    --concurrency=1 --max-tasks-per-child=50 -n prediction@%h

- name: celery-beat                 # scheduler — exactly ONE instance, ever
  dockerfile_path: backend/Dockerfile.prod
  instance_size_slug: apps-s-1vcpu-0.5gb
  run_command: celery -A app.celery_app beat --loglevel=info
```

### 4. Dockerfiles that App Platform builds

```dockerfile
# backend/Dockerfile.prod — one image, web CMD is the default; workers override via run_command
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ && rm -rf /var/lib/apt/lists/*
COPY requirements.txt . ; RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

```dockerfile
# frontend/Dockerfile.prod — build-time public vars MUST arrive as ARG (Gotcha #2)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json . ; RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL                       # DO injects BUILD_TIME envs as --build-arg
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL  # …so Next can inline it into the bundle
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# NOTE: no ENV PORT here — DO injects PORT at runtime and it must win (Gotcha #5)
CMD ["node", "server.js"]
```

### 5. Deploy commands (`doctl`)

```bash
doctl apps list                                   # find the app id
doctl apps update <app-id> --spec .do/app.yaml    # apply a spec change
doctl apps spec get   <app-id> > .do/app.yaml     # re-export live spec → keep git in sync
doctl apps logs <app-id> <component> --follow      # tail one component
doctl apps create-deployment <app-id>              # force a rebuild without a push
# git push to the tracked branch also triggers a deploy (deploy_on_push: true)
```

## Variations

- **App Platform (shown) vs Droplet + compose** — Platform = zero server management, per-component autoscale, git-push deploy; Droplet = full control, cheaper at scale, but you own patching/monitoring. Same containers either way.
- **Buildpack vs Dockerfile.** Dropping `dockerfile_path` lets DO auto-detect a buildpack (fast for vanilla apps). Dockerfiles win once you need system libs, multi-stage builds, or a shared image across components.
- **Path-routing (one domain) vs subdomain-per-service** (`api.example.com` + `app.example.com`). Subdomains are cleaner to reason about but reintroduce browser CORS and a second cert/DNS record.
- **Managed DO Postgres/Redis vs external (Supabase/Upstash).** External keeps DB portable across hosts and gives you Supabase auth/RLS ([[supabase-auth]]); DO-managed gives VPC-private networking (no public DB endpoint).

## Trade-offs

- **One image for web + workers** keeps builds DRY but every worker ships the web deps (uvicorn, etc.) — a fatter image than a purpose-built worker image.
- **`instance_count > 1` on a worker fans out the queue** (good) but the **same on `celery-beat` double-fires every scheduled task** — beat must stay at 1 (Gotcha #7).
- **`deploy_on_push` is convenient but couples git to prod** — a bad merge to `main` auto-ships. Gate `main` behind PR review/CI; keep the risky iteration on the `development` app.
- **Dedicated egress IP costs extra** and is per-app — worth it only when an upstream truly allowlists you.
- **Per-component sizing** lets you right-size (0.5 GB beat, 2 GB worker) but every bump is a real monthly cost — measure before scaling the prediction worker.

## Env vars

```
Scope decides WHEN a var exists:
  RUN_TIME           → injected into the running container only
  BUILD_TIME         → available during `docker build` (as a build ARG)
  RUN_AND_BUILD_TIME → both  (use for NEXT_PUBLIC_* and anything a build step reads)

type: SECRET  → value is ENCRYPTED at rest (stored as EV[1:...]); use for every credential.
   (no type)  → plaintext in the spec file — fine for flags, NEVER for secrets (Gotcha #1)
```

| Var | Where | Note |
|---|---|---|
| `DATABASE_URL` (web) | backend-api | pgbouncer **transaction** pooler, port **6543**, `?pgbouncer=true` |
| `DATABASE_URL` (workers) | celery-* | **session** pooler / direct, port **5432** — NOT 6543 (Gotcha #8) |
| `REDIS_URL` | all backend | `rediss://` (TLS) for managed Redis; shared broker for all Celery components |
| `NEXT_PUBLIC_*` | frontend | `RUN_AND_BUILD_TIME` + declared as `ARG` in the Dockerfile (Gotcha #2) |
| `NEXT_PUBLIC_API_URL` | frontend | same-origin `https://site.com/api` under path-routing |
| `CORS_ORIGINS_CSV` | backend | include the `*.ondigitalocean.app` default host + apex + www |
| `PORT` | (injected) | DO sets it to `http_port`; your server must read it, not hardcode (Gotcha #5) |

## Gotchas

1. **Never commit real secret values into the spec YAML.** A spec with plaintext `SUPABASE_SERVICE_ROLE_KEY`, DB passwords, or API tokens in git leaks every credential to anyone with repo read. Use `type: SECRET` (DO encrypts to `EV[1:...]`) and inject values out-of-band, or keep secrets only in the DO dashboard and never round-trip them into a committed file. If it already happened: **rotate every exposed key**, then re-commit with `type: SECRET`.
2. **`NEXT_PUBLIC_*` (or any build-time framework var) must be `RUN_AND_BUILD_TIME` AND declared as `ARG` in the Dockerfile.** DO passes build-time envs as `--build-arg`; if the Dockerfile has no matching `ARG … / ENV …`, the value never reaches `npm run build` and the bundle inlines `undefined`. Symptom: frontend calls `undefined/api` in prod.
3. **Isolate a heavy/OOM-prone queue onto its own worker component at low concurrency.** A single worker consuming a memory-heavy queue with `--concurrency=N` fans out N copies of the job and OOM-kills the container. Split that queue to its own component and drop concurrency (→1 for the worst offenders); pair with `--max-tasks-per-child` so leaked memory is reclaimed. See [[celery-polling-architecture]].
4. **Set `health_check.initial_delay_seconds` longer than cold-boot.** DO probes `http_path`; if the app isn't answering before the delay elapses it's declared unhealthy and restarted — a **crash-loop that never gets to serve**. Slow boots (migrations, model load) need 120s+, not the 30s default.
5. **Don't hardcode `ENV PORT` in the frontend Dockerfile.** DO injects `PORT` at runtime set to `http_port`; a hardcoded `ENV PORT=6100` is *overridden* at runtime, so the process listens on DO's port — but the mismatch misleads anyone reading the Dockerfile, and if your server reads the ENV at build time it breaks. Read `process.env.PORT` and let DO set it; make `http_port` match what the server actually binds.
6. **The committed spec drifts from the live app.** Dashboard edits (added env, resized instance) don't flow back to the file. Treat `doctl apps spec get > .do/app.yaml` as a routine — a stale spec silently reverts live changes on the next `doctl apps update`. (This repo already carries a stale `app-spec-on-DO.md` with an old queue layout and a rotated DB password — proof of the drift.)
7. **`celery-beat` must be exactly one instance.** `instance_count > 1` on beat means every schedule fires twice (or N times). Scale workers horizontally, never beat.
8. **Web uses the pgbouncer transaction pooler (6543); workers use the session pooler / direct (5432).** Transaction-mode pooling (great for many short web requests) breaks features that need a session — `LISTEN/NOTIFY`, advisory locks, some prepared-statement paths, long transactions. Point long-running workers at the session pooler (5432) and only the web tier at 6543 `?pgbouncer=true`.
9. **Ingress rules are first-match — order specific prefixes before the `/` catch-all.** Put `frontend` `/` last, or it swallows `/api` and the backend never sees a request.
10. **`deploy_on_push` ships whatever lands on the tracked branch.** Keep a separate app on a `development` branch for iteration; gate the `main`/prod app behind PR review so a stray merge can't auto-deploy to production.

## Checklist

- [ ] One spec file per environment (`app.yaml` dev, `prod-app.yaml` prod), each tracking its own branch.
- [ ] Every credential is `type: SECRET` — **zero plaintext secrets** in any committed file.
- [ ] Backend web + workers + beat all share one `dockerfile_path`; workers set `run_command`.
- [ ] `celery-beat` at `instance_count: 1`; heavy queue isolated to its own low-concurrency worker.
- [ ] Ingress: specific prefixes (`/api`, `/health`, …) listed before the `/` catch-all.
- [ ] `http_port` matches the port the container actually binds; `PORT` read from env, not hardcoded.
- [ ] `NEXT_PUBLIC_*` set `RUN_AND_BUILD_TIME` and declared as `ARG` in the frontend Dockerfile.
- [ ] `health_check.initial_delay_seconds` exceeds real cold-boot time.
- [ ] Web `DATABASE_URL` → 6543 `?pgbouncer=true`; worker `DATABASE_URL` → 5432.
- [ ] `egress: DEDICATED_IP` set (and IP handed to upstream) only if an upstream allowlists you.
- [ ] `CORS_ORIGINS_CSV` includes the `*.ondigitalocean.app` default host + apex + www.
- [ ] After any dashboard edit, re-export with `doctl apps spec get` to keep git in sync.
