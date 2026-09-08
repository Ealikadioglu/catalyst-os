# Supabase Auth System

> Reusable auth pattern for a Supabase-backed stack: FastAPI backend(s) + Next.js frontend.
> Pseudo-code only — swap names/tables for your project.

## When to use

Any project where:
- Supabase is the identity provider (email/password, OAuth, magic link).
- One or more backend services need to trust the Supabase-issued JWT.
- A frontend (Next.js App Router) holds the session and calls your own API.
- You also have an internal/worker service that must call the API without a human JWT.

## Architecture & why

Three trust zones, three mechanisms:

```
Browser ──(cookie session)──► Next.js (SSR)
   │                              │  reads session, attaches Bearer <access_token>
   │                              ▼
   │                         Your API (FastAPI)  ── verifies JWT at the EDGE (middleware)
   │                              │                 stashes payload on request.state
   │                              ▼
   │                         Postgres (RLS) ◄── backend uses SERVICE-ROLE key → bypasses RLS,
   │                                              authorizes in application code instead
   ▼
Worker / AI service ──(static X-API-KEY)──► Your API   (no user JWT; service-to-service)
```

**Key decision — verify once at the edge, read everywhere downstream.** A single HTTP middleware validates the Bearer token and writes the decoded claims to `request.state`. Route handlers depend on a trivial "read the claims" function rather than re-decoding. This keeps verification logic in one place and makes handlers cheap.

**Key decision — service-role on the backend, RLS as a safety net.** The backend uses the service-role key (RLS-bypassing) and enforces authorization in application code (ownership checks against the JWT `sub`). RLS still exists on every table as defense-in-depth, so a direct/frontend connection is default-denied. See [[supabase-migrations-rls]].

## Pattern (pseudo-code)

### 1. Backend — JWT decode with dual-algorithm support

Supabase issues **ES256** (asymmetric, verified via JWKS) on modern projects and **HS256** (symmetric, shared secret) on older ones / in tests. Support both.

```python
# auth/verify_token.py
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL)          # caches keys

def decode_jwt(token: str) -> dict:
    alg = jwt.get_unverified_header(token)["alg"]
    if alg == "ES256":
        try:
            key = jwks_client.get_signing_key_from_jwt(token).key
            return jwt.decode(token, key, algorithms=["ES256"],
                              audience="authenticated")
        except JWKSUnreachable:
            pass  # fall through to HS256
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"],
                      audience="authenticated")
    # ALWAYS enforce audience="authenticated"
```

### 2. Backend — verify at the edge, read downstream

```python
# main.py
PUBLIC_PREFIXES = ("/health", "/v1/public")

@app.middleware("http")
async def enforce_authentication(request, call_next):
    if request.method == "OPTIONS" or request.url.path.startswith(PUBLIC_PREFIXES):
        return await call_next(request)
    token = extract_bearer(request.headers.get("Authorization"))
    try:
        request.state.token_payload = decode_jwt(token)   # verify ONCE
    except Exception:
        return json_envelope(success=False, message="Unauthorized", status=401)
    return await call_next(request)
```

```python
# auth/deps.py  — handlers depend on THIS, not on decode_jwt
def get_token_payload(request) -> dict:
    return request.state.token_payload          # already verified

# usage in a handler
async def get_me(payload: Annotated[dict, Depends(get_token_payload)]):
    user_id = payload["sub"]
    ...
```

### 3. Backend — tiered access via a router-level dependency

Attach the elevated check once to a prefixed router so every sub-route inherits it.

```python
def verify_admin_access(payload = Depends(get_token_payload)) -> dict:
    profile = db.table("user_profiles").select("*").eq("id", payload["sub"]).single()
    assert profile["status"] == "active"
    assert email_domain(payload["email"]) in ADMIN_EMAIL_DOMAINS
    assert profile["role"] == "admin"
    return payload

admin_router = APIRouter(prefix="/admin",
                         dependencies=[Depends(verify_admin_access)])  # applies to ALL sub-routes
AdminUser = Annotated[dict, Depends(verify_admin_access)]              # reusable alias
```

### 4. Backend — the service-role client (singleton)

```python
# services/db.py
class DbClient:
    _instance = None

    @classmethod
    def get(cls):
        if cls._instance is None:
            cls._instance = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        return cls._instance

    @classmethod
    def reset(cls):        # CRITICAL for Celery: call on worker_process_init
        cls._instance = None
```

> **Fork safety.** A prefork worker pool must NOT share one client's httpx socket pool across forked children. Register `DbClient.reset()` on `worker_process_init` so each child builds its own. See [[celery-polling-architecture]].

### 5. Service-to-service (worker → API, no user)

```python
# worker calls the API with a static key, never a user JWT
requests.post(f"{API_URL}/v1/internal/notify",
              headers={"X-API-KEY": PUBLIC_API_TOKEN}, json=payload)

# API side
def verify_api_token(key = Security(APIKeyHeader(name="X-API-KEY"))):
    if key != PUBLIC_API_TOKEN:
        raise HTTPException(401)
```

### 6. Frontend — the `@supabase/ssr` triad (Next.js App Router)

Three client factories, one per execution context:

```ts
// utils/supabase/client.ts   — browser components
createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

// utils/supabase/server.ts    — RSC / server actions (wired to cookies())
createServerClient(url, anonKey, { cookies: { get, set, remove } })

// utils/supabase/middleware.ts — session refresh in middleware
createServerClient(url, anonKey, { cookies: fromRequestResponse })
```

Route protection in `middleware.ts` — use `getUser()` (network-validated), not `getSession()`:

```ts
export async function updateSession(request) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()   // validated, not just decoded
  if (!user && !isPublicRoute(request.nextUrl.pathname))
    return redirect(`/${locale}/login`)
  return response  // carries refreshed cookies
}
```

Attach the token to your API calls in one central server-action wrapper:

```ts
// services/rest_client.ts  ("use server")
export async function fetchApi(path, init) {
  const supabase = await createServerClient(...)
  const { data: { session } } = await supabase.auth.getSession()  // cookie read, no network
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${session.access_token}` },
  })
}
```

Login/logout are server actions: `supabase.auth.signInWithPassword({email,password})`, `supabase.auth.signOut()`. OAuth/PKCE + email verification land on `app/auth/callback/route.ts`.

## Variations

- **User-session backend mode (fallback).** If you can't use the service-role key, sign a service account in with anon key + email/password, cache the session, refresh on expiry (with ~5-min skew). Prefer service-role for server code.
- **Per-route auth instead of middleware.** Simpler apps can skip the middleware and use `Depends(decode_and_read)` on each route. The edge-middleware pattern wins once you have many routes and want a single skip-list.
- **Internal service with no auth at all.** A worker-only FastAPI (no public surface) can run with no inbound auth and only *outbound* `X-API-KEY`. Never expose such a service publicly.

## Trade-offs

- **Service-role everywhere** means one leaked key = full DB access. Mitigate: never ship service-role to the frontend, keep it server-only, and keep RLS enabled as a backstop.
- **`getUser()` vs `getSession()`** in middleware: `getUser()` hits Supabase (slower, secure); `getSession()` only reads the cookie (fast, trusts the cookie). Use `getUser()` for gating decisions, `getSession()` for reading the token to forward.
- **Edge middleware** verifies *every* request — keep the skip-list tight and the decode fast (cache JWKS).

## Env vars

| Var | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | backend + frontend (`NEXT_PUBLIC_`) | project URL, JWKS endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | backend only | RLS-bypass client |
| `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | frontend | browser/SSR client |
| `JWT_SECRET` | backend | HS256 verify / JWKS fallback |
| `PUBLIC_API_TOKEN` | worker + API | service-to-service `X-API-KEY` |
| `ADMIN_EMAIL_DOMAINS` | backend | admin gate |

## Gotchas

1. **Always enforce `audience="authenticated"`** — a token without it may be a different Supabase token type.
2. **Never send the service-role key to the browser.** Frontend gets the anon key only.
3. **Reset the DB client on Celery fork** (`worker_process_init`) or children share a socket pool and you get intermittent hangs.
4. **`getUser()` for gating, `getSession()` for forwarding** — mixing them up either slows every request or trusts an unvalidated cookie.
5. **Elevated routes: put the dependency on the router, not each handler** — one place, no drift.

## Checklist (new project)

- [ ] `decode_jwt` supports ES256 (JWKS) + HS256 fallback, enforces `aud`.
- [ ] Edge middleware verifies once, stashes `request.state.token_payload`, has a public skip-list.
- [ ] `get_token_payload` reader dependency; handlers use it, never re-decode.
- [ ] Elevated router carries `dependencies=[Depends(verify_admin_access)]`.
- [ ] Service-role singleton with `.reset()` for Celery.
- [ ] Static `X-API-KEY` channel for worker→API.
- [ ] Frontend: browser/server/middleware client triad; central `fetchApi` attaches Bearer.
- [ ] RLS enabled on every table as a backstop → see [[supabase-migrations-rls]].
