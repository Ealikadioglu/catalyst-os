# API Response Envelope + FastAPI Structure

> A uniform response envelope `{success, message, data, errors}`, layered project structure
> (router → service → db), edge-auth, and one global exception handler. Pseudo-code only.

## When to use

- A FastAPI backend that a frontend and/or other services consume.
- You want every response — success or error — to have the same predictable shape.
- You want business logic out of route handlers and into services.
- You use Supabase/PostgREST and hit its read caps.

Pairs with [[supabase-auth]] (edge middleware) and [[supabase-migrations-rls]] (the DB layer).

## Architecture & why

```
request ──► auth middleware (verify JWT, stash on request.state)   [see supabase-auth]
        ──► router (APIRouter, prefix, tags, role deps)
        ──► handler (reads token payload, builds service, wraps result in envelope)
        ──► service (business logic; talks to DB client)
        ──► DB (Supabase service-role client)
response ◄── APIResponse[T]  or  global exception handler → same envelope
```

**Key decision — one generic envelope.** Every endpoint returns `APIResponse[T]`. Clients write one unwrap path (`if not r.success: showError(r.message)`) instead of guessing per-endpoint shapes. Errors carry the same envelope, never FastAPI's bare `{"detail": ...}`.

**Key decision — thin handlers, fat services.** Handlers do: read auth, validate input, call a service, wrap the result. Services hold the logic and own the DB calls. This keeps handlers uniform and services unit-testable without HTTP.

**Key decision — DB client injected manually, wrapped by a patchable helper.** The service-role client is a singleton (not a `Depends`); a module-level `get_db()` helper wraps it so tests can monkeypatch one function.

## Pattern (pseudo-code)

### 1. The envelope

```python
T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    errors: Optional[dict] = None

def ok(data=None, message="OK"):
    return APIResponse(success=True, message=message, data=data)

def err(message, status_code, detail=None):
    return JSONResponse(status_code=status_code, content=APIResponse(
        success=False, message=message,
        errors={"status_code": str(status_code), "detail": detail}).model_dump(mode="json"))
```

### 2. Project layout

```
app/
  main.py                 # app, middleware, exception handlers, mounts router
  config/settings.py      # pydantic-settings BaseSettings, @lru_cache get_settings()
  api/
    api_response.py        # APIResponse envelope
    api_exception.py       # APIException(message, status_code)
    router.py              # top aggregator: include_router each area under /v1
    verify_token.py        # JWT decode + auth deps  [see supabase-auth]
    v1/
      routers/            # admin.py, web.py — group & prefix endpoint modules
      endpoints/          # actual handlers (admin/, web/, health, webhooks)
      schemas/            # Pydantic request/response models
  services/               # business logic, one module/class per domain
  repositories/           # (optional) thin data-access
```

Versioning is a literal `/v1` string prefix; mount the aggregate router (optionally twice — `/api/v1` primary + bare `/v1` legacy).

### 3. Handler → service → db

```python
# endpoints/web/orders.py
router = APIRouter(prefix="/orders", tags=["orders"])

def get_db():                                   # patchable seam for tests
    return DbClient.get()

@router.get("/{order_id}", response_model=APIResponse[OrderOut])
async def get_order(order_id: int,
                    payload: Annotated[dict, Depends(get_token_payload)]):
    service = OrderService(get_db())
    order = service.get_for_user(order_id, user_id=payload["sub"])   # authz in service
    return ok(order, "Order retrieved")
```

```python
# services/order_service.py
class OrderService:
    def __init__(self, db):
        self.db = db
    def get_for_user(self, order_id, user_id):
        row = self.db.table("orders").select("*").eq("id", order_id).single().execute().data
        if not row:
            raise APIException("Order not found", 404)
        if row["user_id"] != user_id:
            raise APIException("Forbidden", 403)     # app-level authz (service-role bypasses RLS)
        return row
```

### 4. Role-scoped router (auth in one place)

```python
# api/v1/routers/admin.py
admin_router = APIRouter(prefix="/admin", tags=["admin"],
                         dependencies=[Depends(verify_admin_access)])  # ALL sub-routes
admin_router.include_router(accounts_endpoints)   # → /v1/admin/accounts/...
admin_router.include_router(models_endpoints)      # → /v1/admin/models/...
```

> **Route ordering:** register routers with literal suffixes after a `/{id}` param BEFORE the catch-all `/{id}` router, or the param route swallows them.
>
> **Prefix trap:** if `API_BASE_URL` already ends in `/v1/admin`, service paths must NOT start with `/admin` (that yields `/v1/admin/admin/...`). Call `fetchApi("/models")`, not `fetchApi("/admin/models")`.

### 5. One global exception handler → envelope

```python
# main.py
@app.exception_handler(APIException)
async def handle_api_exception(request, exc):
    return JSONResponse(status_code=exc.status_code,
        content={"success": False, "message": exc.message, "data": None,
                 "errors": {"status_code": str(exc.status_code)}})

@app.exception_handler(Exception)                  # catch-all → 500 envelope
async def handle_unexpected(request, exc):
    log.exception(exc)
    return JSONResponse(status_code=500,
        content={"success": False, "message": "Internal error", "data": None})
```

Services raise `APIException("msg", 404)`; the handler renders it into the envelope. Feature routers can also wrap a raised `HTTPException` into the envelope so FastAPI's `{"detail": ...}` never leaks.

### 6. Settings (pydantic-settings)

```python
class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=True, extra="allow")
    PROJECT_NAME: str                 # required → fail-fast at startup
    SUPABASE_URL: str
    ENVIRONMENT: str = "production"    # optional with default

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### 7. Pagination — beat the PostgREST 1000-row cap

PostgREST silently truncates a single read at 1000 rows. For full scans, loop with `.range()` until a short page:

```python
PAGE = 1000
def fetch_all(query_factory):
    out, offset = [], 0
    while True:
        rows = query_factory(offset, PAGE).range(offset, offset + PAGE - 1).execute().data
        out.extend(rows)
        if len(rows) < PAGE:
            break
        offset += PAGE
    return out
```

> Never count rows in Python for correctness. Use an exact-count query or a jsonb-aggregating RPC (one row → never capped). See [[supabase-migrations-rls]].

## Variations

- **Typed `response_model=APIResponse[T]`** (happy path) vs explicit `JSONResponse` (when the status code must vary). Use the model where you can; drop to `JSONResponse` for error branches.
- **Lightweight variant:** an internal/worker API can return the envelope as a plain dict with always-200 (`{"success": True, "data": ...}`) and skip the generic model — same *convention*, less ceremony. See the worker service in [[dag-workflows]].
- **`Depends`-injected DB** vs singleton + patchable helper. The helper wins when the client is a process-wide singleton (Supabase service-role).

## Trade-offs

- **A uniform envelope** costs a tiny wrap on every handler but gives clients one code path and consistent errors.
- **Always-200 dict variant** is simplest but loses HTTP semantics (caching, client retries keyed on status) — fine for internal RPC, wrong for a public API.
- **Service layer** adds a file per domain but is the difference between testable logic and HTTP-bound spaghetti.

## Env / config

| Var | Purpose |
|---|---|
| `PROJECT_NAME`, `ENVIRONMENT` | settings / gating |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | DB client → [[supabase-auth]] |
| `API_BASE_URL` (frontend) | note the `/v1/admin` prefix trap above |

## Gotchas

1. **Return the envelope for errors too** — a raw `HTTPException` leaks `{"detail": ...}` and breaks the client's unwrap path.
2. **Route ordering** — literal-suffix routes before `/{id}` catch-alls.
3. **`/v1/admin` double-prefix** — don't prefix service calls with `/admin` if the base URL already includes it.
4. **PostgREST 1000-row cap** — `.range()`-loop or use an RPC; never trust a single unbounded `.select()` for counts/full scans.
5. **Two config styles drift** — decide: everything through `Settings`, or `os.getenv` in low-level clients — don't scatter both.

## Checklist

- [ ] `APIResponse[T]` envelope + `ok()`/`err()` helpers.
- [ ] Handlers thin: auth → validate → service → wrap.
- [ ] Services own DB access and app-level authz.
- [ ] Role-scoped router with `dependencies=[...]`; route ordering respected.
- [ ] Global `APIException` handler + catch-all → envelope.
- [ ] `pydantic-settings` with required (no-default) fields fail-fast.
- [ ] `.range()`-loop / RPC for reads that can exceed 1000 rows.
