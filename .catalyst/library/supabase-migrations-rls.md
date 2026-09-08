# Supabase Migrations + RLS

> Idempotent, up-only SQL migrations; default-deny RLS with a service-role bypass; jsonb-
> returning read RPCs to beat the row cap; SECURITY DEFINER RPCs for destructive resets.
> Pseudo-code / SQL sketches only.

## When to use

- Postgres via Supabase, schema managed as versioned `.sql` files.
- Backend uses the service-role key; RLS is your defense-in-depth backstop.
- You expose some reads/writes as PostgREST RPCs.
- You need repeatable local resets/seeds without `db reset`.

Backs the DB layer of [[api-envelope-fastapi]] and [[supabase-auth]].

## Architecture & why

```
migrations/YYYYMMDDHHMMSS_desc.sql   (up-only, idempotent, ordered by timestamp)
   │  supabase migration up  (local)  |  ./migrate.sh (prod)
   ▼
Postgres
   ├─ RLS: default-deny; "service role bypass" policy on every table
   ├─ owner policies: (SELECT auth.uid()) = user_id  (frontend-safe reads)
   ├─ read RPCs: LANGUAGE sql STABLE, RETURNS jsonb  (dodge the 1000-row cap)
   └─ destructive RPCs: SECURITY DEFINER, service_role only  (resets)
```

**Key decision — default-deny RLS + service-role bypass.** Enable RLS on every table. The backend (service-role key) bypasses RLS and authorizes in app code; the frontend, if it ever connects directly, is default-denied except for explicit owner policies. One leaked anon key can't read the table.

**Key decision — idempotent, up-only migrations.** Every migration re-runs cleanly (`IF NOT EXISTS`, `DROP ... IF EXISTS; CREATE`, `CREATE OR REPLACE`). No down files — rollback lives as a commented block or a new forward migration. This survives partial applies and drift.

**Key decision — return one jsonb blob from read RPCs.** PostgREST caps a read at 1000 rows. An aggregation that returns a single `jsonb` row is one HTTP row — never capped. See [[api-envelope-fastapi]] §7.

**`bypassrls` is narrower than "no security" — decide where an invariant lives before writing its SQL.** The privilege a service-role key carries (see [[supabase-auth]]) bypasses row-security *policy evaluation only*. It has no effect on `GRANT`/`REVOKE` and no effect on trigger execution — those are separate subsystems entirely. If, per the key decision above, every server write goes through the service role, the consequence is architectural, not incidental: **RLS is carrying tenant isolation and nothing else.** Any invariant that must actually hold — immutability, soft-delete-only, column-level protection — has to be a trigger or a `REVOKE`, because RLS alone will not survive the role that does the real writing.

Testing corollary: assert every such invariant from **both** an ordinary authenticated session and the service-role client. The service-role half is the only one that discriminates — an RLS `WITH CHECK` implementation passes cleanly under `authenticated` and is wide open for the role that actually writes.

## Pattern (SQL sketches)

### 1. Migration file conventions

Name: `YYYYMMDDHHMMSS_description.sql` (hand-assign timestamps so related slices sort). Header comment, then lettered DDL sections.

```sql
-- ============================================================
-- Migration: orders module v1
-- Spec: specs/2026-XX-orders   Date: 2026-XX-XX
-- Scope: orders table + RLS + indexes
-- Rollback: DROP TABLE public.orders;   (documented, not automated)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid REFERENCES auth.users(id),
    status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','paid','shipped')),   -- text+CHECK, not PG ENUM
    metadata     jsonb,
    search       tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(note,''))) STORED,
    embedding    vector(1536),
    created_by   uuid REFERENCES auth.users(id),        -- nullable: pollers stamp 'system'
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx  ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_fts_idx   ON public.orders USING gin (search);
CREATE INDEX IF NOT EXISTS orders_vec_idx   ON public.orders
    USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64);
```

Add-column migrations stay tiny and idempotent:

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded boolean DEFAULT false;
```

Constraint evolution = drop + recreate:

```sql
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','shipped','cancelled'));
```

### 2. Reusable updated_at trigger

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
```

> This trigger (touching only `NEW`) is fine — it's row-shaping, not event fan-out. Keep fan-out in pollers, not triggers. See [[celery-polling-architecture]].

### 3. RLS — enable everywhere, bypass for service_role

Blanket-enable across the schema:

```sql
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format($f$
      DROP POLICY IF EXISTS "Service role bypass" ON public.%I;
      CREATE POLICY "Service role bypass" ON public.%I
        USING ((SELECT auth.role()) = 'service_role')
        WITH CHECK ((SELECT auth.role()) = 'service_role');
    $f$, tbl, tbl);
  END LOOP;
END $$;
```

Per-table owner policy (frontend-safe), one policy per verb:

```sql
CREATE POLICY "owner_select" ON public.orders FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "owner_insert" ON public.orders FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

> **Wrap `auth.uid()` / `auth.role()` in a subselect** — `(SELECT auth.uid())` evaluates once per query, not once per row (big perf win).

### 4. Read RPC — one jsonb row beats the 1000 cap

```sql
CREATE OR REPLACE FUNCTION public.order_counts_by_user()
RETURNS jsonb LANGUAGE sql SECURITY INVOKER STABLE AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('user_id', g.user_id, 'n', g.n)
                            ORDER BY g.n DESC), '[]'::jsonb)
  FROM (SELECT user_id, count(*)::bigint AS n FROM public.orders GROUP BY user_id) g;
$$;
GRANT EXECUTE ON FUNCTION public.order_counts_by_user()
  TO postgres, anon, authenticated, service_role;
```

Idioms: `LANGUAGE sql`, `SECURITY INVOKER`, `STABLE`, `COALESCE(..., '[]'::jsonb)` (always an array), broad GRANT for read RPCs.

### 5. Destructive RPC — SECURITY DEFINER, locked down

```sql
CREATE OR REPLACE FUNCTION public.reset_orders()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$      -- pin search_path for DEFINER safety
BEGIN
  TRUNCATE TABLE public.order_items, public.orders;   -- whole FK closure in one statement
  RETURN json_build_object('ok', true);
END; $$;

REVOKE ALL ON FUNCTION public.reset_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_orders() TO service_role;   -- only the backend
```

> Wrapping TRUNCATE as an RPC lets the backend call it with the normal Supabase client (service-role key) instead of raw psycopg2 with DB host/port/password. Gate the *calling endpoint* to non-production and require an explicit typed confirmation.

### 6. Backfill inside a migration

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency text;   -- 1. nullable
UPDATE orders SET currency = 'USD' WHERE currency IS NULL;    -- 2. backfill
ALTER TABLE orders ALTER COLUMN currency SET NOT NULL;        -- 3. tighten
```

## Applying migrations

```bash
# local
supabase migration new add_orders     # scaffold
supabase migration up                  # apply
# NEVER `supabase db reset` if seed.sql is large — it wipes + reseeds

# prod
./migrate.sh                           # apply, then verify with SELECT ... FROM pg_constraint
```

## Variations

- **text+CHECK vs PG ENUM.** text+CHECK evolves without an ENUM migration dance; PG ENUM is stricter but rigid. Prefer text+CHECK for status fields that grow.
- **Owner policy vs API-only.** Simple apps let the frontend read via owner RLS; API-heavy apps route everything through the service and only keep the service-role bypass.
- **Advisory-locked resets vs typed-confirmation endpoint** — pick based on how catastrophic a wrong reset is.

## Trade-offs

- **Idempotent DDL** is slightly more verbose but immune to partial applies and re-runs.
- **Service-role bypass** centralizes authz in app code (flexible, testable) at the cost of the DB not enforcing it — RLS owner policies are the safety net.
- **Out-of-band `psql`/admin applies** are sometimes necessary (role restrictions) but **bypass the migration ledger** → drift.

## Gotchas

> Gotchas 7–10 came off a real build — ten tables under RLS (nine domain tables plus an audit
> log). Gotcha 7 in particular would have shipped a defense-in-depth layer that looked present
> in the migration and did nothing.

1. **Never self-reference a table in its own RLS policy** — infinite recursion. Use a plain `user_id = auth.uid()` check or a service-role `FOR ALL` policy.
2. **`psql`/MCP-applied migrations bypass `schema_migrations`** — the CLI ledger diverges from real DB state. Reconcile before any prod push; track which files were applied out-of-band.
3. **Pollers write `created_by='system'`** on NOT-NULL actor columns (nullable ones stay NULL) — a NULL there throws 23502. See [[celery-polling-architecture]].
4. **`SECURITY DEFINER` without `SET search_path`** is a privilege-escalation hazard — always pin it.
5. **`supabase db reset` reloads a large `seed.sql`** — it can wipe your working data; use reset RPCs, not `db reset`.
6. **Local role restrictions** — some DDL must run as `supabase_admin`, not `postgres`; note it in the migration header.
7. **A column-level `REVOKE` is a no-op against a table-wide grant.** Postgres column privileges are *additive*: `REVOKE UPDATE (col) ON t FROM role` cannot subtract a column from an existing table-wide `UPDATE` grant. It reports `REVOKE` and changes nothing.

   ```sql
   GRANT UPDATE ON t TO some_role;
   REVOKE UPDATE (a) ON t FROM some_role;   -- reports REVOKE
   SELECT has_column_privilege('some_role','t','a','UPDATE');  -- still true
   ```

   The only form Postgres honours is table-wide `REVOKE UPDATE` followed by `GRANT UPDATE (<the allowed columns>)`. Accepted cost: that column list must be extended whenever a column is added, so pair it with a catalog-driven test comparing `information_schema.columns` against `information_schema.column_privileges` — and that test must hard-code no column list of its own, since the hazard being guarded is precisely a hard-coded list going stale.
8. **`bypassrls` bypasses row security only** — no effect on `GRANT`/`REVOKE`, no effect on trigger execution. See "Architecture & why" above for the consequence (RLS carries tenant isolation and nothing else, once every write goes through the service role) and the testing corollary (assert from both an authenticated session and the service-role client).
9. **`TRUNCATE` fires no `BEFORE DELETE FOR EACH ROW` trigger, and ignores RLS entirely.** Any append-only or soft-delete guarantee built on such a trigger — or on a `REVOKE DELETE` — is defeated by `TRUNCATE` unless the `TRUNCATE` privilege is separately revoked. This bites hardest on soft-delete tables, where `DELETE` is deliberately revoked to force writes through a `deleted_at` column: the role cannot delete one row but can empty the table, tombstones and all. `TRUNCATE ... CASCADE` reaches dependent tables, but Postgres checks the `TRUNCATE` privilege on *each* cascaded table, so revoking it on the children holds even against a cascade launched from an unhardened parent. Compare pattern §5 above, which uses TRUNCATE deliberately as a reset tool inside a locked-down RPC — this gotcha is the opposite case, an *unrevoked* privilege left open by accident.
10. **A plain unique index permits unlimited NULLs.** "I inserted two rows with NULL and both succeeded" never proves an index is *partial* — a plain unique index behaves identically, since `NULL <> NULL`.

    ```sql
    CREATE TEMP TABLE t(x text UNIQUE);
    INSERT INTO t VALUES (NULL),(NULL);  -- both succeed: NULL <> NULL
    ```

    The genuine discriminator for a `WHERE deleted_at IS NULL` partial unique index: insert, insert a duplicate (must violate), soft-delete the first, insert a third with the same key — that third insert succeeding is the only thing a plain unique index would fail.

## Checklist

- [ ] File named `YYYYMMDDHHMMSS_desc.sql`, header comment, idempotent DDL.
- [ ] UUID PK + `now()` timestamps + reusable `set_updated_at_timestamp()` trigger.
- [ ] text+CHECK for status; jsonb for flexible metadata.
- [ ] RLS enabled on every table; service-role bypass; owner policies use `(SELECT auth.uid())`.
- [ ] Read RPCs return one jsonb blob; broad GRANT.
- [ ] Destructive RPCs: `SECURITY DEFINER` + `SET search_path` + service_role-only GRANT.
- [ ] No table self-reference in its own policy.
- [ ] Ledger reconciled if anything was applied via `psql`/MCP.
- [ ] Column-level privilege changes use table-wide `REVOKE` + `GRANT (<cols>)`, never `REVOKE (col)`; guarded by a catalog-driven test that hard-codes no column list.
- [ ] Every invariant that must survive `bypassrls` is a trigger or a table/column `REVOKE`, not an RLS policy alone — and its test asserts from both an authenticated client and the service-role client.
- [ ] `TRUNCATE` revoked from `authenticated`/`anon` anywhere a `BEFORE DELETE` trigger or a `REVOKE DELETE` guarantee must hold, including on tables reachable by cascade from an unhardened parent.
- [ ] Partiality of a partial unique index is proved by insert → duplicate rejected → soft-delete → re-insert succeeds, not by inserting two NULLs.
