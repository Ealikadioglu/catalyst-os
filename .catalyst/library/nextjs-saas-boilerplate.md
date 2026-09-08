# Next.js SaaS Boilerplate (the app base)

> The template CallCenterA is built on: `boilerplate-app-main` — a Next.js 15 / React 19 /
> Supabase / Stripe starter derived from ShipFast but almost entirely rewritten over 17 commits
> (milestones M2→M12). This guide is the *map* of what you inherit, the patterns worth keeping,
> and the defects to fix before writing a line of product code.
> Unlike the rest of this library it documents a concrete base rather than an abstract pattern —
> read it as an inventory plus earned gotchas.

## When to use

- Standing up a **new** project from this template (as CallCenterA and Kiipup both did).
- Deciding whether a capability is **already there** before building it.
- Onboarding onto an existing derivative and needing to tell *template code* from *domain code*.

Not for: greenfield non-Next.js services. The auth/RLS/envelope thinking generalises —
see [[supabase-auth]], [[supabase-migrations-rls]], [[api-envelope-fastapi]] — the code does not.

## Architecture & why

The template's thesis: **everything that is not your product is already done.** Auth, onboarding,
subscriptions, invoices, support tickets, admin panel, i18n, audit log, tests. You add domain.

```
Request
  └─ middleware.ts ................... runs on EVERY path (except static/webhooks)
      │  supabase.auth.getUser()  → session refresh + validation
      ├─ (auth)/*      → authenticated? bounce to /dashboard
      ├─ /dashboard    → require session
      ├─ /admin        → require session + accounts.account_type = 'admin'
      ├─ /onboarding   → require session + signup_progress.onboarding_complete = false
      └─ impersonation cookie present? → 403 every POST/PATCH/PUT/DELETE
  └─ app/api/** (~77 routes) ......... Zod parse → Supabase → success/errorResponse envelope
  └─ libs/** ........................ supabase | stripe | email | security | cron | pdf | logger
  └─ Postgres (Supabase) ............ 35 tables across 13 migrations, RLS on all of them
```

**Key decision — one gate, at the edge.** Route protection lives *only* in `middleware.ts`,
keyed off URL prefix lists. Layouts re-verify (defence in depth) but never carry the decision.
Adding a protected area = adding a string to one array.

**Key decision — the DB is the source of truth, Stripe is an effect.** `plans` + `plan_pricing`
+ `subscriptions` are authoritative; Stripe webhooks *sync into* them. `config.js` plan data is
display-only fallback. Same posture as [[supabase-migrations-rls]]: authorize in app code,
RLS as backstop.

**Key decision — Postgres owns identity bootstrap.** A trigger on `auth.users` creates the
`accounts` and `signup_progress` rows. There is no "create profile" API route to forget to call.

### What you inherit

| Area | Substance |
|---|---|
| Auth | email/password, Google OAuth, email OTP, phone OTP (Twilio), reset, optional 2FA, brute-force lockout |
| Onboarding | 4-step resumable wizard, plan select, Stripe SetupIntent, voucher + referral capture |
| Billing | subscribe / upgrade (prorated) / downgrade (period-end) / cancel / reactivate, payment methods CRUD, branded invoice PDF, billing history |
| Admin | stats + 30-day revenue chart, user/subscription/payment management (incl. Stripe refunds), voucher campaigns, tickets, job monitor, audit-log viewer, read-only impersonation |
| Support | tickets + comments + RLS-protected attachments, 4 notification emails |
| Platform | DB-backed rate limiting, audit logger, CORS helpers, Sentry (client/server/edge), i18n, cron processors, 18 email templates |
| Tests | 73 Vitest files (796 tests), 10 Playwright specs (41 tests), mock factories for Supabase/Stripe/Twilio, MSW |

## Pattern (pseudo-code)

### 1. Route groups + a single middleware gate

```ts
// middleware.ts
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/verify-email"]
const PROTECTED_ROUTES = ["/dashboard", "/settings", "/billing", "/tickets"]
const ADMIN_ROUTES = ["/admin"]
const SKIP_AUTH_ROUTES = ["/api/webhook", "/api/lead"]   // signature-verified, not session-verified

if (skip(pathname)) return next()
const { user } = await supabase.auth.getUser()            // also refreshes the cookie

if (impersonationCookie && isMutation(method)) return json(403, "IMPERSONATION_ACTIVE")
if (admin(pathname) && (await accountType(user)) !== "admin") return redirect("/dashboard")
// …one branch per zone, each returning the cookie-carrying response
```

### 2. Identity bootstrap in the database, not the app

```sql
-- trigger on auth.users AFTER INSERT, SECURITY DEFINER
create function handle_new_user() returns trigger as $$
  loop ref := generate_referral_code();               -- retry until unique
      exit when not exists (select 1 from accounts where referral_code = ref);
  end loop;
  full_name := coalesce(meta->>'full_name', meta->>'name', split_part(email,'@',1));
  insert into accounts (id, referral_code, display_name, first_name, last_name, account_type)
       values (new.id, ref, full_name, …, 'individual');
  insert into signup_progress (user_id, current_step, onboarding_complete)
       values (new.id, 1, false) on conflict do nothing;
$$;
```

Companions worth knowing: `is_admin()` (SECURITY DEFINER, avoids RLS recursion),
`update_updated_at()` (on every table), `generate_invoice_number()` / `generate_ticket_number()`,
`log_transaction()`, `validate_voucher_code()`, `get_current_plan_pricing()`.

### 3. API route shape — Zod in, envelope out

```ts
export const dynamic = "force-dynamic";
const schema = z.object({ subject: z.string().min(3).max(200), category: z.enum(CATEGORIES) });

export async function POST(req) {
  try {
    const { user } = await (await createClient()).auth.getUser();
    if (!user) return unauthorizedResponse();

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return validationErrorResponse(parsed.error);   // field-level errors

    const { data, error } = await supabase.from("tickets").insert({ user_id: user.id, ... })
                                          .select("external_id, ticket_number").single();
    if (error) { captureError(error, { tags: { api: "ticket-create" } }); return internalErrorResponse(); }

    try { await sendTicketCreatedEmail(...) } catch { warn("email failed") }   // non-fatal side effect
    return createdResponse({ external_id: data.external_id });
  } catch (err) { captureError(err, { tags: { api: "ticket-create" } }); return internalErrorResponse(); }
}
```

Envelope: `{ success: true, data }` | `{ success: false, error: { code, message, details? } }`.
Same contract as [[api-envelope-fastapi]], different runtime. Public identifiers are
`external_id`; internal `bigint id` never crosses the API boundary.

### 4. Onboarding as a resumable state machine

```ts
// libs/onboarding/redirect.ts — pure, unit-testable, the single authority on "where am I?"
function calculateCorrectStep(progress, plan) {
  if (!progress) return 1;
  if (!progress.phone_verified_at)   return 1;   // verify
  if (!progress.selected_plan_id)    return 2;   // plan
  if (!isFree(plan) && !progress.checkout_completed_at) return 3;  // billing+payment, skipped on free
  return 4;                                      // review & finalize
}
// each page calls validateOnboardingStep(myStep, progress, plan)
//   → forward-jump attempts redirect back; back-navigation allowed
// isProgressExpired(): older than 7 days → reset and restart
```

Adding a domain step = one predicate here + one route. Persist wizard state in a jsonb column
so it is resumable (Kiipup's `setup_wizard_state`).

### 5. Billing: webhook syncs, cron reconciles

```
POST /api/webhook/stripe   (signature-verified, session-exempt)
  invoice.paid                    → payments row, extend period
  customer.subscription.updated   → status/plan sync + subscription_history
  customer.subscription.deleted   → cancel
  invoice.payment_failed          → grace period + dunning email
  checkout.session.completed|expired

POST /api/cron/subscriptions   (Bearer CRON_SECRET)
  processPendingDowngrades()   expireCancelledSubscriptions()
  sendRenewalReminders()       sendTrialExpiryWarnings()
```

Downgrades are a DB flag applied at period end — deliberately not an instant Stripe flip.

### 6. i18n — strings-as-keys

```ts
// The English sentence IS the key. Only messages/tr.json is maintained (1045 keys).
// EN resources are built as an identity map: { key: key }
i18next.init({ keySeparator: false, nsSeparator: false,
               interpolation: { prefix: "{", suffix: "}" },   // {name}, NOT {{name}}
               parseMissingKeyHandler: (k) => k })            // missing key → renders English

t("Welcome back, {name}", { name })
// locale resolution: cookie → Accept-Language → default; middleware seeds the cookie
// once per session from accounts.preferred_language
```

Cheap to adopt, near-impossible to retrofit. Do it from commit one.

### 7. Impersonation that cannot write

```
admin → POST /api/admin/impersonate → impersonation_sessions row + signed cookie
dashboard layout: effectiveUserId = target ?? self;  dbClient = target ? supabaseAdmin : supabase
middleware:       any mutation while the cookie is set → 403 (except the impersonate endpoint)
banner:           always visible; session has an expiry, checked and auto-ended on read
```

The safety property lives at the edge, not in each handler — so a new route inherits it.

### 8. Domain goes in a service layer, not in components

The lesson from Kiipup (the other derivative of this template, now ~1100 tests deep):

```
components/  →  libs/services/*.ts  →  mock JSON  ⇢ later ⇢  Supabase
                       ▲
                 types.ts = frozen contract; components never see the swap
```

Build screens against mock providers, freeze the data shape, *then* write migrations. Components
importing `supabase` directly is the boundary violation that costs the most later.

## Variations

- **Skip verticals you don't sell.** Vouchers, referrals and 2FA are behind `ENABLE_*` flags and
  default off; their tables can stay unused with zero cost. Tickets can be dropped outright.
- **Keep or cut the landing page.** `app/page.js` + the ShipFast marketing components are
  independent of everything else — CallCenterA replaces them with the Brillance prototype.
- **Two currencies of truth for plans.** Simple products can live on `config.js` alone; anything
  multi-currency or seat-based needs `plans` + `plan_pricing` (Kiipup added per-seat pricing there).
- **Cron host.** No `vercel.json` ships. Vercel Cron is fine for the subscription job; a real
  worker is required for anything long-running (see `concerns.md` C-1).

## Trade-offs

| Choice | Buys | Costs |
|---|---|---|
| Middleware on every path | one place to reason about access | `getUser()` per request, +1 DB query on admin/onboarding paths |
| DB-backed rate limiting | works serverless, no extra infra | a write per counted request; move to Redis under load |
| Strings-as-keys i18n | zero-ceremony authoring, English always renders | long keys; renaming English copy silently orphans a translation |
| Business logic in SQL functions | atomic, callable from anywhere | logic split across TS and SQL; harder to grep |
| Mixed TS/JS | template shipped that way | `libs/` and older API routes are untyped JS |
| ShipFast ancestry | mature marketing/landing components | dead code to delete, two of everything in places |

## Env vars

```bash
# App
NEXT_PUBLIC_APP_NAME=            NEXT_PUBLIC_APP_URL=

# Supabase  (2025 naming: anon → publishable, service_role → secret)
NEXT_PUBLIC_SUPABASE_URL=        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=             # server only
DATABASE_URL=                    # seed script only

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   STRIPE_SECRET_KEY=   STRIPE_WEBHOOK_SECRET=

# Mailtrap SMTP  — see gotcha #1, the code does NOT read the names .env.example uses
MAILTRAP_SMTP_HOST=  MAILTRAP_SMTP_PORT=  MAILTRAP_SMTP_USERNAME=  MAILTRAP_SMTP_PASSWORD=
MAILTRAP_SENDER_EMAIL=  MAILTRAP_SENDER_NAME=  MAILTRAP_SANDBOX=

# Optional
TWILIO_ACCOUNT_SID= TWILIO_AUTH_TOKEN= TWILIO_PHONE_NUMBER=
SENTRY_DSN= NEXT_PUBLIC_SENTRY_DSN=
CRON_SECRET=                     # openssl rand -hex 32
ENABLE_2FA=false ENABLE_REFERRALS=false ENABLE_VOUCHERS=false
```

## Gotchas

Verified in the source, not inferred. Fix 1–3 before writing product code.

1. **Mailtrap env names disagree with the code.** `.env.example` and the README say
   `MAILTRAP_SMTP_USER` / `_PASS`; `libs/email.js` reads `MAILTRAP_SMTP_USERNAME` /
   `_PASSWORD`. Copy the example verbatim and every email fails SMTP auth, quietly.
2. **`libs/supabase/admin.ts` has no `server-only` guard**, and it reads the secret key at module
   scope (throwing if absent). One stray import from a client component leaks it into the browser
   bundle. Add `import "server-only"` to it and to the Stripe server module.
3. **Two parallel API-response modules.** `libs/api/index.ts` and `libs/api/responses.ts` define
   overlapping helpers and `index.ts` does *not* re-export the other. Admin routes import from
   `responses.ts`, everything else from `index.ts`. Collapse to one.
4. **`config.js` `stripe.plans` is decorative** — landing-page fallback only. Real plans live in
   `plans` + `plan_pricing`. Editing the config expecting billing to change is the classic slip.
5. **Email verification is not in the onboarding state machine.** `calculateCorrectStep()` only
   checks `phone_verified_at`; the email-OTP step is enforced by page-level logic in
   `app/(onboarding)/onboarding/page.tsx`. Restructure the wizard and it is easy to lose.
6. **`accounts.account_type` is `'individual' | 'admin'` only** — the README mentions a `business`
   type that no CHECK constraint allows. Multi-tenancy needs a workspace table (Kiipup added one).
7. **ShipFast dead weight** ships enabled: `libs/gpt.js`, `libs/resend.js`, `libs/stripe.js`,
   `app/api/lead`, `app/api/stripe/create-checkout|create-portal`, `app/blog/**`, and the
   marketing components in `components/` root. Delete on day one or they rot into the codebase.
8. **Soft-delete and audit are not universal.** `transactions` is the audit log but only some
   flows call `log_transaction()`; most tables hard-delete. Decide the convention *before*
   adding domain tables (Kiipup retrofitted `deleted_at` + audit triggers across 13 migrations).
9. **First admin is a manual SQL step** — `update accounts set account_type='admin' where id=…`.
   No bootstrap script.
10. **`console.*` is banned by convention**, enforced only socially. `@/libs/logger`:
    `log/warn/error` are silent in production, `captureError` reports to Sentry in all envs.

## Checklist (new project)

- [ ] Template → new repo; `npm install`
- [ ] `.env.local` from `.env.example`, **with `MAILTRAP_SMTP_USERNAME/PASSWORD`** (gotcha #1)
- [ ] `supabase link` → `npm run db:push` → `npm run seed` → `npm run db:types`
- [ ] `npm run test` green *before* any edit — that is your regression baseline
- [ ] Fixes: `server-only` on admin/stripe modules; collapse `libs/api`; delete ShipFast dead code
- [ ] Brand: `config.js` (appName, colors), DaisyUI theme, font, landing page
- [ ] Promote yourself to admin via SQL; confirm `/admin` loads
- [ ] Decide and write down: soft-delete? audit-every-mutation? multi-tenant workspace table?
- [ ] Domain: `libs/services/` with a frozen `types.ts`, mock-first, Supabase later (pattern #8)
- [ ] i18n from the first string — `t()` everywhere, `messages/tr.json` maintained
- [ ] Cron host chosen and firing; Stripe webhook endpoint registered + secret set

---

*Distilled 2026-08-14 from `boilerplate-app-main` (17 commits) and its two derivatives:
Kiipup (M0→M7.3, shipped) and CallCenterA (in progress).*
