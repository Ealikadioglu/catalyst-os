# Logo İşbaşı E-Fatura Integration

> Category: Billing / Turkish Tax Compliance
> Complexity: High
> Last Updated: 2026-02-10
> Based on: 1 implementation

## Overview

Logo İşbaşı is a Turkish e-Fatura (electronic invoice) service provider that enables B2B SaaS platforms to comply with Turkish Revenue Administration (GIB) regulations. This pattern provides a complete integration architecture for automated e-invoice generation, submission, and compliance tracking through the Logo İşbaşı API.

**Legal Context**: Turkish tax law mandates that all B2B transactions must generate electronic invoices through GIB-approved platforms. E-faturas must be retained for 10 years, and non-compliance results in significant penalties.

## When to Use

- Building a B2B SaaS platform serving Turkish customers
- Processing payments from Turkish businesses (VKN) or individuals (TCKN)
- Need to comply with Turkish Revenue Administration (GIB) e-fatura requirements
- Require automated invoice generation with retry mechanisms for failed submissions
- Want to decouple payment processing from e-invoice generation (non-blocking)

## Key Considerations

**Pre-Implementation:**
- [ ] Register with Logo İşbaşı and obtain API credentials
- [ ] Determine if your payment flow can tolerate eventual consistency (e-fatura generated after payment)
- [ ] Plan database schema for tracking invoice submission status separately from payment records
- [ ] Identify required billing information fields for your signup/checkout flow
- [ ] Decide on retry policy for failed API calls (max attempts, backoff strategy)

**Technical Requirements:**
- [ ] Async HTTP client (aiohttp) for Logo API calls
- [ ] Task queue (Celery/similar) for batch processing and retries
- [ ] Distributed lock mechanism (Redis) to prevent duplicate submissions
- [ ] Secure credential storage for Logo API username/password
- [ ] Error tracking system for monitoring failed submissions

**Legal/Business:**
- [ ] Understand VKN (10-digit corporate tax ID) vs TCKN (11-digit individual tax ID)
- [ ] Collect tax office (Vergi Dairesi) name from customers
- [ ] Implement 10-year data retention for e-fatura records
- [ ] Plan for handling incomplete billing information (warnings, re-prompts)
- [ ] Define process for manual intervention when auto-retry fails

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                   USER PAYMENT FLOW                          │
│  1. User completes payment (Stripe/Iyzico/etc)              │
│  2. Payment success → invoice record created                 │
│  3. E-fatura status: "pending" (non-blocking)               │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              DAILY BATCH PROCESSOR (Celery)                  │
│  - Runs daily (e.g., 2 AM)                                  │
│  - Queries invoices with status: pending/failed             │
│  - Validates billing completeness                            │
│  - Submits batch to Logo İşbaşı API                         │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              LOGO İŞBAŞI API CLIENT                         │
│  • Authentication: username/password → access_token         │
│  • Token caching with auto-refresh on 401                   │
│  • Exponential backoff: 1s, 2s, 4s                          │
│  • Retry up to 3 times per invoice                          │
│  • Request/response logging for audit trail                 │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          STATUS TRACKING & ERROR HANDLING                    │
│  ✓ sent        → E-fatura successfully submitted            │
│  ✗ failed      → API error (retry up to 3x)                 │
│  ⚠ incomplete_billing → Missing tax_number/tax_office       │
│  ⏳ pending    → Awaiting batch processing                   │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND HANDLING                           │
│  • Show billing incompleteness banner in dashboard          │
│  • Collect tax ID type (VKN/TCKN radio selector)           │
│  • Required: tax_number, tax_office, address, city          │
│  • Optional: IBAN (for refunds)                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Logo İşbaşı Service (`logo_isbasi_service.py`):**
- Manages authentication and token lifecycle
- Provides `send_efatura(invoice_data)` method
- Handles API retry logic with exponential backoff
- Logs all requests/responses for debugging

**E-Fatura Processor Task (`process_efaturas_task.py`):**
- Scheduled daily via Celery Beat
- Queries pending/failed invoices
- Validates billing completeness before submission
- Updates tracking table with results
- Sends alerts for invoices exceeding retry limit

**Tracking Table (`logo_efaturas`):**
```sql
CREATE TABLE logo_efaturas (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'incomplete_billing')),
  logo_invoice_id TEXT,  -- ID returned by Logo API
  retry_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);
```

**Billing Validation (`billing_validator.py`):**
- Checks for required fields: tax_number, tax_office, tax_id_type, address, city
- Validates VKN format (10 digits) vs TCKN (11 digits)
- Returns validation errors for incomplete records

## Common Pitfalls

1. **Blocking Payment on E-Fatura Failure**
   - ❌ Never block payment success on e-fatura submission failure
   - ✅ Use eventual consistency: payment succeeds → e-fatura retries in background
   - **Why**: Logo API downtime shouldn't prevent revenue collection

2. **Missing Token Refresh Logic**
   - ❌ Caching access token without handling 401 re-authentication
   - ✅ Intercept 401 responses → re-authenticate → retry original request
   - **Why**: Logo API tokens expire; hardcoded TTL may not match actual expiry

3. **Insufficient Retry Strategy**
   - ❌ Single retry or immediate retries without backoff
   - ✅ Exponential backoff (1s, 2s, 4s) with max 3 attempts per batch run
   - **Why**: Transient API issues need time to resolve; aggressive retries may trigger rate limits

4. **Tax ID Validation Gaps**
   - ❌ Accepting any numeric string as VKN/TCKN
   - ✅ Validate length (VKN=10, TCKN=11) and format before API submission
   - **Why**: Logo API rejects invalid tax IDs; early validation prevents failed submissions

5. **Race Conditions in Batch Processing**
   - ❌ Multiple workers processing same invoice simultaneously
   - ✅ Use distributed locks (Redis) with invoice_id as key
   - **Why**: Duplicate e-fatura submissions violate GIB rules and cause errors

6. **Hardcoded Organization/Account IDs**
   - ❌ Embedding specific account IDs in service or task code
   - ✅ Pass account context via function parameters or request headers
   - **Why**: Makes code non-reusable across multi-tenant systems

7. **Missing Audit Trail**
   - ❌ Only storing final success/failure status
   - ✅ Log every API request/response with timestamps
   - **Why**: Tax audits require proof of submission attempts and GIB communication

8. **Incomplete Billing UX**
   - ❌ Hiding billing incompleteness from users until they ask
   - ✅ Prominent dashboard banner linking to billing form
   - **Why**: Users may not realize e-fatura submission is failing; proactive prompts improve compliance

## Dependencies

### Backend (Python)
```python
# API Client
aiohttp >= 3.9.0          # Async HTTP for Logo API
tenacity >= 8.2.0         # Retry decorator with exponential backoff

# Task Queue
celery >= 5.4.0           # Batch processing and scheduling
redis >= 5.0.0            # Celery broker + distributed locks

# Data Validation
pydantic >= 2.0.0         # Request/response models

# Database
asyncpg >= 0.29.0         # PostgreSQL async driver (if using raw SQL)
# OR Supabase Python client
```

### Frontend (TypeScript)
```typescript
// Form Handling
react-hook-form >= 7.x
zod >= 3.x                // Tax ID validation schemas

// UI Components
@radix-ui/react-radio-group  // VKN/TCKN selector
@radix-ui/react-alert-dialog // Incomplete billing banner
```

### External Services
- **Logo İşbaşı API**: Credentials from `api.isbasi.com`
- **Redis**: For Celery broker and distributed locks
- **PostgreSQL**: For tracking table (or any RDBMS with transaction support)

### Environment Variables
```bash
LOGO_ISBASI_API_URL=https://api.isbasi.com
LOGO_ISBASI_API_KEY=your_api_key          # If API key is separate from username/password
LOGO_ISBASI_USERNAME=your_username
LOGO_ISBASI_PASSWORD=your_password

# Task Configuration
EFATURA_RETRY_MAX_ATTEMPTS=3
EFATURA_BATCH_SCHEDULE="0 2 * * *"  # Daily at 2 AM (cron format)
```

## Testing Strategy

### Unit Tests
```python
# Logo İşbaşı Service
- test_authentication_success()
- test_authentication_retry_on_401()
- test_send_efatura_success()
- test_send_efatura_with_retry()
- test_exponential_backoff_timing()

# Billing Validator
- test_valid_vkn_10_digits()
- test_valid_tckn_11_digits()
- test_invalid_tax_id_too_short()
- test_missing_required_fields()
```

### Integration Tests
```python
# E-Fatura Processor Task
- test_process_pending_invoices()
- test_skip_incomplete_billing()
- test_retry_failed_invoices()
- test_max_retry_limit_reached()
- test_distributed_lock_prevents_duplicates()

# API Client (with mocked Logo API)
- test_api_call_with_valid_token()
- test_token_refresh_on_401()
- test_rate_limit_handling()
```

### Manual Testing Checklist
- [ ] Submit test invoice with valid VKN → verify Logo portal shows invoice
- [ ] Submit with invalid tax ID → verify error logged and status = failed
- [ ] Kill Logo API mid-request → verify retry logic triggers
- [ ] Process same invoice from 2 workers → verify only one submission
- [ ] Check dashboard banner appears for incomplete billing
- [ ] Update billing info → verify next batch run succeeds

### Monitoring
- **Alert on**: Invoices with retry_count >= 3
- **Dashboard metric**: Pending e-fatura count (should trend to zero daily)
- **Log analysis**: Track Logo API response times and error rates

## Database Considerations

### Core Tables

**Invoices Table** (existing payment records):
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'TRY',
  status TEXT,  -- paid, pending, failed
  paid_at TIMESTAMPTZ,
  -- Other payment fields
);
```

**Logo E-Fatura Tracking Table**:
```sql
CREATE TABLE logo_efaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) UNIQUE,
  account_id UUID NOT NULL,  -- Denormalized for faster queries

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'incomplete_billing')),
  retry_count INT DEFAULT 0,
  last_error TEXT,

  -- Logo API response
  logo_invoice_id TEXT,      -- External ID from Logo İşbaşı
  logo_response JSONB,       -- Full API response for debugging

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_status (status) WHERE status IN ('pending', 'failed'),
  INDEX idx_account_id (account_id),
  INDEX idx_created_at (created_at)
);
```

**Billing Information** (extended user/account table):
```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  tax_id_type TEXT CHECK (tax_id_type IN ('VKN', 'TCKN')),
  tax_number TEXT,
  tax_office TEXT,  -- Vergi Dairesi
  billing_address TEXT,
  billing_city TEXT,
  iban TEXT;  -- Optional for refunds

-- Index for incomplete billing queries
CREATE INDEX idx_incomplete_billing ON accounts (id)
WHERE tax_number IS NULL OR tax_office IS NULL;
```

### Query Patterns

**Find Pending E-Faturas**:
```sql
SELECT le.*, i.amount, i.currency, a.tax_number
FROM logo_efaturas le
JOIN invoices i ON le.invoice_id = i.id
JOIN accounts a ON le.account_id = a.account_id
WHERE le.status IN ('pending', 'failed')
  AND le.retry_count < 3
  AND a.tax_number IS NOT NULL
  AND a.tax_office IS NOT NULL
ORDER BY le.created_at ASC
LIMIT 100;  -- Batch size
```

**Find Incomplete Billing**:
```sql
SELECT i.id, i.account_id, i.amount
FROM invoices i
LEFT JOIN logo_efaturas le ON i.id = le.invoice_id
JOIN accounts a ON i.account_id = a.account_id
WHERE i.status = 'paid'
  AND (le.status IS NULL OR le.status = 'incomplete_billing')
  AND (a.tax_number IS NULL OR a.tax_office IS NULL);
```

### Data Retention
- **E-Fatura records**: Keep for 10 years (Turkish tax law requirement)
- **API logs**: Keep for 1 year minimum (for debugging/audit)
- **Partition strategy**: Partition `logo_efaturas` by year if volume exceeds 1M records

## Related Specs

- **2026-01-26-logo-isbasi-efatura** (2026-02-10) - Original implementation for B2B sales platform
- Pattern extracted from: SiemoSpace/siemo-api v1.0 (FastAPI + Celery architecture)

---

**Maintenance Notes:**
- Logo İşbaşı API documentation: Contact Logo support for latest API reference
- GIB regulations: Check Turkish Revenue Administration website for updates to e-fatura requirements
- Update this document when implementing in new projects with lessons learned
