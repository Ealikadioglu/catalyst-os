# Payment Integration Patterns

> Category: Payments & Billing
> Complexity: High
> Last Updated: 2026-02-01
> Based on: 2 implementations (PayTR, Credits System)

## Overview

Patterns and best practices for integrating payment gateways, managing subscriptions, and handling billing securely.

## When to Use

- Implementing credit-based subscription systems
- Integrating third-party payment gateways
- Building recurring billing automation
- Managing payment cards and refunds

## Key Considerations

### Security (Critical)

- [ ] **Webhook signature validation** - Return 400 for invalid signatures, not 200
- [ ] **Max refund limits** - Prevent large unauthorized refunds (e.g., 100,000 currency units)
- [ ] **Authorization on card operations** - Always filter by account_id
- [ ] **Environment-based configuration** - Never hardcode test/live mode
- [ ] **Rate limiting** - Protect payment endpoints from abuse

### Architecture

- [ ] **Idempotent credit granting** - Check status before granting (prevent duplicates)
- [ ] **Separate services** - SubscriptionService, RefundService, InvoiceService
- [ ] **Async processing** - Use Celery/background tasks for renewals
- [ ] **Retry logic** - Exponential backoff for failed payments (Day 0, 2, 7)

### Database

- [ ] **payment_attempts table** - Track all payment attempts with status
- [ ] **payment_notifications table** - Store webhook payloads for audit
- [ ] **payment_cards table** - Store tokenized cards (never raw card data)
- [ ] **refunds table** - Track all refunds with reason codes

### Credit Consumption (Usage-Based Billing)

- [ ] **Optimistic locking** - Use balance_version column to handle concurrent deductions
- [ ] **Immutable ledger** - credit_ledger table with triggers preventing UPDATE/DELETE
- [ ] **Non-blocking deductions** - Log failures but don't fail the main operation
- [ ] **Context propagation** - Pass account_id through pipeline/task context
- [ ] **Token-based calculation** - Simple conversion rate (e.g., 1 credit = 1000 tokens)

## Architecture Pattern

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Layer     │────▶│  Payment        │
│   (iFrame)      │     │   (Endpoints)   │     │  Gateway        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                       │
                               ▼                       │
                        ┌─────────────────┐            │
                        │   Services      │◀───────────┘
                        │   - Subscription│   (Webhooks)
                        │   - Refund      │
                        │   - Credit      │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Database      │
                        │   - payments    │
                        │   - cards       │
                        │   - credits     │
                        └─────────────────┘
```

## Common Pitfalls

1. **Returning 200 for invalid webhooks** — Attackers can forge webhooks. Always validate signatures and return 400 for failures.

2. **Hardcoded test mode** — Forgetting to change `test_mode=1` causes production failures. Use environment variables.

3. **Missing authorization checks** — Card deletion without account_id filter allows cross-account attacks.

4. **Duplicate credit grants** — Webhook retries can grant credits multiple times. Always check payment status before granting.

5. **No refund limits** — Missing max amount validation allows massive unauthorized refunds.

6. **Blocking webhook responses** — Long-running operations in webhook handlers cause timeouts. Use async processing.

7. **TOCTOU in preflight checks** — Balance can change between check and deduction. Use reservation (RESERVE/BURN/REFUND) or accept the race.

8. **Synchronous vs async deduction** — Synchronous is simpler but adds latency. Async is faster but complicates error handling.

## Testing Strategy

```python
# Key test scenarios
def test_webhook_rejects_invalid_signature():
    """Webhook returns 400 for forged requests"""

def test_webhook_idempotent_on_retry():
    """Duplicate webhooks don't grant duplicate credits"""

def test_refund_respects_max_limit():
    """Refunds above MAX_AMOUNT are rejected"""

def test_card_deletion_requires_ownership():
    """Cannot delete another account's card"""

def test_proration_calculation_accuracy():
    """Upgrade proration is accurate to smallest currency unit"""
```

## Environment Variables

```bash
# Required
PAYMENT_GATEWAY_MERCHANT_ID=
PAYMENT_GATEWAY_MERCHANT_KEY=
PAYMENT_GATEWAY_MERCHANT_SALT=
PAYMENT_GATEWAY_TEST_MODE=1  # 0 for production
PAYMENT_GATEWAY_DEBUG_MODE=0

# Optional
MAX_REFUND_AMOUNT=10000000  # In smallest currency unit
DAILY_REFUND_LIMIT=50000000
```

## Webhook Security Checklist

- [ ] Validate HMAC signature before processing
- [ ] Return appropriate status codes (200 OK, 400 Invalid, 500 Error)
- [ ] Log all webhook payloads for audit
- [ ] Implement idempotency (check status before state changes)
- [ ] Use constant-time comparison for signatures (`hmac.compare_digest`)
- [ ] Consider IP whitelist for production

## Related Specs

- 2026-01-13-paytr-payment-integration (2026-01-26) - Turkish market PayTR integration
- 2025-12-11-credits-system (2026-02-01) - Usage-based credit consumption for AI operations

---
*Updated from spec: 2025-12-11-credits-system on 2026-02-01*
