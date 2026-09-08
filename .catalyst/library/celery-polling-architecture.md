# Celery + Polling Architecture

> Event-driven background processing without Postgres triggers: Celery beat pollers scan
> the DB, atomically claim rows, and run work in-process. Plus DB-event dispatch.
> Pseudo-code only.

## When to use

- You need background/async processing (LLM jobs, imports, notifications).
- Multiple services each have their own broker and can't reliably `send_task` across brokers.
- You want event fan-out driven by DB state, and you distrust Postgres triggers for it.
- Jobs vary wildly in duration (fast user-facing vs slow batch) and must not starve each other.

Underpins the triggering half of [[dag-workflows]].

## Architecture & why

```
                 ┌─────────────── Service A (own Redis broker) ───────────────┐
Producer ──insert Event row──► DB          beat scheduler ──every 10-30s──► poller task
                 │                                                   │  SELECT pending
                 │  Pattern A: send_task("process_event", id)        │  atomic CLAIM
                 ▼                                                   ▼  run in-process
             worker: load Event → registry lookup → workflow.run → write result back
                 └────────────────────────────────────────────────────────────┘
```

**Key decision — pollers, not triggers.** Postgres triggers for event fan-out are hard to observe, test, and reason about; they fire inside the writing transaction and couple business logic to the DB. Instead, a Celery **beat** schedule runs poller tasks every N seconds that scan a table for work. Everything is ordinary, debuggable Python.

**Key decision — services don't share a broker; cross-service comms go through the DB (or HTTP).** If Service A and Service B each run their own Redis, `A.send_task(...)` aimed at B's task **silently orphans** (it lands in A's broker, B never sees it). The reliable channel is: A writes a DB row, B's poller reads it. (For same-service dispatch, `send_task` is fine.)

**Key decision — atomic claim to prevent double-processing.** Overlapping beat ticks (or multiple workers) can grab the same row. A conditional `UPDATE ... WHERE claimed_at IS NULL RETURNING id` claims a row atomically; only one tick wins.

## Pattern (pseudo-code)

### 1. Beat schedule

```python
# celery_config.py
beat_schedule = {
    "poll-pending-jobs":  {"task": "poll_pending_jobs",  "schedule": 10.0},   # seconds
    "poll-draft-queue":   {"task": "poll_draft_queue",   "schedule": 30.0},
}
task_default_queue = "default"
worker_prefetch_multiplier = 1        # long tasks: don't hoard messages
```

### 2. A poller with atomic claim (the core idiom)

```python
SYSTEM_ACTOR = "system"      # no JWT in a poller → stamp actor-less writes

@shared_task(name="poll_pending_jobs")
def poll_pending_jobs():
    rows = db.execute(
        "SELECT id FROM jobs WHERE status='pending' AND claimed_at IS NULL "
        "ORDER BY created_at LIMIT 20")
    for r in rows:
        if not _claim(r.id):        # someone else grabbed it → skip
            continue
        try:
            MyWorkflow().run({"job_id": r.id})           # run IN-PROCESS (no cross-broker send)
            db.execute("UPDATE jobs SET status='done' WHERE id=%s", [r.id])
        except Exception as e:
            db.execute("UPDATE jobs SET status='failed', error=%s WHERE id=%s", [str(e), r.id])

def _claim(job_id) -> bool:
    # conditional update = atomic claim; RETURNING tells us if we won
    won = db.execute(
        "UPDATE jobs SET claimed_at=now(), status='running', created_by=COALESCE(created_by,%s) "
        "WHERE id=%s AND claimed_at IS NULL RETURNING id",
        [SYSTEM_ACTOR, job_id])
    return bool(won)
```

### 3. DB-event dispatch (same-service `send_task` is OK)

```python
# producer (same service as the worker → same broker → send_task works)
row = db.insert("events", {"workflow_type": "MY_WORKFLOW", "payload": {...}})
celery_app.send_task("process_incoming_event", args=[str(row.id)])

@shared_task(name="process_incoming_event")
def process_incoming_event(event_id):
    ev = db.get("events", event_id)
    workflow = WorkflowRegistry[ev.workflow_type].value()    # registry → class
    ctx = workflow.run(ev.payload)
    db.update("events", event_id, {"task_context": prune(ctx.model_dump())})
```

### 4. Queue partitioning — isolate long jobs

Run separate worker pools per queue so slow batch jobs never starve fast user-facing ones:

```
worker (user-facing):   celery worker -Q high,default --autoscale=4,1 --prefetch-multiplier=1
worker (batch/slow):    celery worker -Q batch_low   --autoscale=2,1 --prefetch-multiplier=1
```

Route a task to a queue when enqueuing: `send_task("slow_job", queue="batch_low")`.

### 5. Fork safety

```python
from celery.signals import worker_process_init

@worker_process_init.connect
def reset_clients(**_):
    DbClient.reset()      # each forked child gets its own connection/socket pool
```

## Variations

- **Claim column vs advisory locks.** A `claimed_at`/`status` column (shown) is simple and visible. Postgres advisory locks (`pg_try_advisory_lock`) avoid a schema column but are invisible in the data.
- **`FOR UPDATE SKIP LOCKED`** instead of a conditional update — good for high-throughput queues where many workers pull concurrently.
- **Polling interval vs latency.** Tighter intervals (5–10s) cut latency but raise DB load; loosen for cheap/rare work.
- **Cross-service via HTTP** instead of DB polling when the consumer must react instantly and exposes an endpoint — but DB polling is the robust default across brokers.

## Trade-offs

- **Pollers add latency** (up to one interval) vs triggers/instant dispatch — acceptable for most background work, not for sub-second needs.
- **Polling is steady DB load** even when idle — index the `status/claimed_at` predicate and keep `LIMIT` bounded.
- **No triggers** means fan-out logic lives in app code (good for observability) but you must remember to schedule the poller.
- **Autoscale without limits risks OOM** — a pool with `--autoscale=20` and no `--max-tasks-per-child` / `--max-memory-per-child` can leak into SIGKILL/timeout. Set child recycling for memory-heavy tasks.

## Env / config

| Setting | Purpose |
|---|---|
| `REDIS_URL` / broker URL | per-service broker (distinct per service) |
| `beat_schedule` | poller cadence |
| `-Q` queues + `--autoscale` | worker pool partitioning |
| `--prefetch-multiplier=1` | fair dispatch for long tasks |
| `--max-tasks-per-child` / `--max-memory-per-child` | recycle workers to bound memory |

## Gotchas

1. **Cross-broker `send_task` silently orphans** — if the consumer runs its own broker, dispatch via a DB row + poller, not `send_task`.
2. **No atomic claim → double processing** — always claim with a conditional `UPDATE ... WHERE claimed_at IS NULL RETURNING`.
3. **Pollers have no JWT actor** — stamp `created_by = COALESCE(created_by, 'system')`; a NULL on a NOT-NULL column throws 23502 and strands the row mid-flight. See [[supabase-migrations-rls]].
4. **Reset DB clients on `worker_process_init`** or forked children share a socket pool → intermittent hangs. See [[supabase-auth]].
5. **Unbounded autoscale + memory-heavy tasks = OOM SIGKILL** — cap child lifetime/memory.
6. **A workflow with no poller and no same-service dispatch never runs from the UI** — decide the trigger explicitly.

## Checklist

- [ ] Beat schedule entry for each poller, interval matched to latency need.
- [ ] Poller uses atomic claim (`UPDATE ... WHERE claimed_at IS NULL RETURNING`).
- [ ] Work runs in-process in the poller (no cross-broker `send_task`).
- [ ] Actor-less writes stamped `created_by="system"`.
- [ ] Long jobs on a separate queue/pool; `--prefetch-multiplier=1`.
- [ ] `worker_process_init` resets DB clients.
- [ ] Autoscale bounded with `--max-tasks-per-child` / `--max-memory-per-child` for heavy tasks.
