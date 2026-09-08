# Docker Compose + Local Multi-Service Orchestration

> One `PROJECT_NAME` knob drives everything; each Python service splits into web + N celery
> workers + beat + its own Redis; `ENVIRONMENT`-gated CMDs; blanket proxy-env blanking.
> Pseudo-code / config sketches only.

## When to use

- A multi-service stack (API + AI/worker service + frontend + DB) run locally with one command.
- Each Python service = a web process plus Celery workers and a beat scheduler.
- You develop on macOS with OrbStack/Docker Desktop and hit the httpx proxy bug.
- You want the same images to run dev (hot-reload) and prod (baked code) by env alone.

Runs the services from [[api-envelope-fastapi]], [[dag-workflows]], and [[celery-polling-architecture]].

## Architecture & why

```
root start.sh  ── [1] DB (Supabase)  ── [2] API svc  ── [3] AI svc  ── [4] frontend (npm)
                        │                    │              │
                        │            per-svc start.sh: ensure network → compose up --build -d
                        ▼                    ▼              ▼
                   supabase start     ┌── api web ──┐  ┌── ai web ──┐
                                      │  worker×N   │  │  worker×N  │   (own Redis each)
                                      │  beat       │  │  beat      │
                                      │  redis      │  │  redis     │
                                      └─────────────┘  └────────────┘
root stop.sh  ── reverse order: frontend → AI → API → DB
```

**Key decision — one `PROJECT_NAME` env drives naming.** It names the compose project (`-p`), every container (`${PROJECT_NAME}_api`), and the shared external network (`${PROJECT_NAME}_network`). One knob, no collisions between projects on the same machine.

**Key decision — one Python service = web + workers + beat + broker.** Web serves HTTP; workers run Celery tasks; beat schedules pollers ([[celery-polling-architecture]]); each service runs **its own Redis** (distinct host ports). Cross-service comms go through the DB/HTTP, never a shared broker.

**Key decision — dev vs prod by `ENVIRONMENT`, same image.** The container CMD branches on `ENVIRONMENT`: dev gets file-watching hot-reload over a bind-mounted source tree; prod/staging runs the baked code with no reload. One Dockerfile, two behaviors.

## Pattern (config sketches)

### 1. Root orchestration script

```bash
#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "[1/4] Database";  command -v supabase >/dev/null && supabase start
echo "[2/4] API";       ( cd "$ROOT/api"  && ./start.sh )
echo "[3/4] AI";        ( cd "$ROOT/ai"   && ./start.sh )
echo "[4/4] Frontend";  lsof -ti:3001 | xargs -r kill -9; rm -rf "$ROOT/web/.next"
                        ( cd "$ROOT/web" && PORT=3001 npm run dev > .pids/web.log 2>&1 & \
                          echo $! > .pids/web.pid )
# stop.sh tears down in REVERSE order.
```

### 2. Per-service start.sh (the reusable idiom)

```bash
#!/usr/bin/env bash
set -a; source ./.env; set +a                 # export vars for compose interpolation
NET="${PROJECT_NAME}_network"
docker network ls | grep -q "$NET" || docker network create "$NET"   # ensure external net
docker compose -p "$PROJECT_NAME" up --build -d
# stop: docker compose -p "$PROJECT_NAME" down
```

### 3. Compose — one worker base, many workers (YAML anchor)

```yaml
services:
  api:
    build: { context: ., dockerfile: Dockerfile.api }
    ports: ["127.0.0.1:8081:8080"]        # bind localhost only
    env_file: [.env]
    volumes: ["./app:/app"]                # dev live-code mount
    depends_on: [redis]

  celery_worker_base: &celery_worker
    build: { context: ., dockerfile: Dockerfile.celery }
    depends_on: [redis]
    volumes: ["./app:/app"]
    environment: &no_proxy_env             # ← see §5, the proxy gotcha
      - REDIS_URL=redis://redis:6379
      - HTTP_PROXY=
      - HTTPS_PROXY=
      - NO_PROXY=
      - http_proxy=
      - https_proxy=
      - no_proxy=
  celery_worker_1: { <<: *celery_worker, container_name: "${PROJECT_NAME}_worker_1" }
  celery_worker_2: { <<: *celery_worker, container_name: "${PROJECT_NAME}_worker_2" }

  celery_beat:
    build: { context: ., dockerfile: Dockerfile.celerybeat }
    depends_on: [redis, celery_worker_1, celery_worker_2]   # beat after workers
    environment: *no_proxy_env
    volumes: ["celery_data:/celery_data"]   # NOTE: no ./app bind — beat runs baked code

  redis:
    image: redis:7
    ports: ["127.0.0.1:6379:6379"]          # AI service would use 6380:6379
    volumes: ["redis_data:/data"]

networks:
  default: { driver: bridge, external: true, name: "${PROJECT_NAME}_network" }
volumes: { redis_data: {}, celery_data: {} }
```

Queue-partitioned worker pools (isolate slow jobs) — see [[celery-polling-architecture]] §4.

### 4. Dockerfile — layer cache + ENVIRONMENT-gated CMD

```dockerfile
FROM python:3.12-slim-bookworm
# system libs only where needed (e.g. cv2/OCR): libgl1 libglib2.0-0 libxcb1 libgomp1 ...
RUN apt-get update && apt-get install -y --no-install-recommends git libpq-dev gcc

# dependency layer FIRST (cache), then code
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # (or: uv pip install --system -r pyproject.toml)
COPY app/ /app                                        # baked code (prod uses this)
WORKDIR /app

# non-root worker user
RUN groupadd -r celery && useradd -r -g celery celery && chown -R celery:celery /app
USER celery

ENV ENVIRONMENT=dev
# gate hot-reload on ENVIRONMENT — one image, dev+prod behavior
CMD sh -lc 'case "$ENVIRONMENT" in \
  prod|production) celery -A worker worker --autoscale=20,1 --prefetch-multiplier=1 ;; \
  staging)         celery -A worker worker --autoscale=10,1 --prefetch-multiplier=1 ;; \
  *)               watchmedo auto-restart -d /app -p "*.py" -- \
                     celery -A worker worker --autoscale=4,1 --prefetch-multiplier=1 ;; \
  esac'
```

> Gate `uvicorn --reload` the same way for the web container. `--reload` in prod masks crash-loops (the reloader restarts a crashing process, so a health probe may see "up" while every request 502s). Only enable it for dev.

### 5. The proxy-env gotcha (macOS / OrbStack)

OrbStack injects an **unbracketed IPv6 CIDR into `NO_PROXY`**, which crashes `httpx` on every outbound call. Blank **all six** proxy vars (upper + lower case — httpx reads either) on every Python service that makes outbound HTTP:

```yaml
environment:
  - HTTP_PROXY=
  - HTTPS_PROXY=
  - NO_PROXY=
  - http_proxy=
  - https_proxy=
  - no_proxy=
```

Apply it on the worker anchor (inherited) AND on beat. Services with no outbound httpx traffic don't need it, but blanking is harmless.

### 6. Env, ports, mounts

```
.env (repo root):  PROJECT_NAME, ENVIRONMENT, ports, REDIS_URL, DB creds
loaded twice:  (a) `set -a; source .env` in start.sh → compose ${VAR} interpolation
               (b) `env_file: [.env]` in compose → injected into containers
```

| Service | host:container |
|---|---|
| API web | 8081:8080 |
| AI/worker web | 8080:8080 |
| Frontend (npm) | 3001 |
| Supabase API / Studio / DB | 54321 / 54323 / 54322 |
| API Redis | 6379:6379 |
| AI Redis | 6380:6379 |

- **Dev bind-mount** `./app:/app` + hot-reload; **prod** = no mount, baked `COPY app/ /app`.
- **beat mounts only its data volume**, not the source tree → it runs baked code. Keep worker/beat images self-contained.

## Variations

- **Single-repo compose** (one `docker-compose.yml`, all services) vs **per-service compose** orchestrated by a root script (shown). Per-service scales to a multi-repo workspace and lets each service start/stop independently.
- **`pip` vs `uv`** for installs — `uv` is dramatically faster; either fits the layer-cache pattern.
- **Shared vs per-service broker.** Shared broker simplifies dispatch but couples deploys and breaks the "separate brokers" isolation; per-service is the robust default here (see [[celery-polling-architecture]] gotcha #1).

## Trade-offs

- **Per-service Redis** avoids cross-team coupling but means cross-service work must go through the DB, adding latency.
- **YAML anchors** keep N workers DRY but obscure per-worker overrides — document any worker that diverges.
- **Bind-mount hot-reload** is great in dev but can **mask a missing prod dependency** (code importable via the mount but not baked into the image). Test the built image without the mount before shipping.
- **Autoscale=20 with no child limits** risks OOM — pair with `--max-tasks-per-child` for memory-heavy tasks.

## Gotchas

1. **Blank all six `*_PROXY` vars for Python services under OrbStack** or httpx crashes on every outbound call — the single most common local-dev failure here.
2. **`--reload` / `watchmedo` in prod masks crash-loops** — a container can report "Running" while every request 502s. Gate reload on `ENVIRONMENT`.
3. **Worker must not import a co-mounted sibling service's tree** — it works in dev via the mount but the module is absent in the baked prod image (`No module named ...`). Keep shared code in a package baked into the worker image.
4. **Distinct host Redis ports per service** (6379 vs 6380) or the second service's broker collides.
5. **Beat runs baked code (no source mount)** — a poller change needs a rebuild, not just a file save, in beat.
6. **Bind everything to `127.0.0.1`** in local compose so nothing leaks onto the LAN.

## Checklist

- [ ] `PROJECT_NAME` drives `-p`, container names, external network.
- [ ] Per-service `start.sh`: ensure network → `compose up --build -d`; `stop.sh` = `down`.
- [ ] Root `start.sh` orders DB → API → AI → frontend; `stop.sh` reverses.
- [ ] Worker base as a YAML anchor; beat `depends_on` workers.
- [ ] Own Redis per service, distinct host ports.
- [ ] Dockerfile: deps layer before code; non-root user; `ENVIRONMENT`-gated CMD.
- [ ] All six proxy vars blanked on Python services (worker anchor + beat).
- [ ] `.env` loaded for interpolation (`set -a; source`) and injection (`env_file`).
- [ ] Built image tested WITHOUT the dev bind-mount before shipping.
