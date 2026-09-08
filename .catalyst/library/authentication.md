# OAuth Token Health Monitoring

> Category: Authentication
> Complexity: Medium
> Last Updated: 2026-02-01
> Based on: 1 implementation

## Overview

Proactive monitoring system for OAuth token health that prevents silent integration failures. Detects token expiration, classifies refresh errors, and provides self-service reconnection flows before users experience disruption.

**Solves:** Silent failures when OAuth tokens expire, lack of visibility into token health, and reactive error handling that only surfaces issues when users attempt operations.

## When to Use

- Application relies on third-party OAuth integrations (Gmail, LinkedIn, Slack, etc.)
- Users experience "authentication failed" errors without context
- Token expiration leads to lost functionality or failed operations
- Need proactive monitoring before tokens expire
- Supporting multiple OAuth providers with different token lifetimes
- Enterprise environment where users may not control token revocation

## Key Considerations

- [ ] Differentiate between PERMANENT failures (user must reauth) and TRANSIENT failures (retry automatically)
- [ ] Use minute-based expiry thresholds for short-lived tokens (e.g., Google OAuth expires in 60 min)
- [ ] Use day-based expiry thresholds for long-lived tokens (e.g., LinkedIn tokens valid for months)
- [ ] Never log full tokens in plain text - only first 10-20 characters for debugging
- [ ] Implement Redis locking for background token operations to prevent race conditions
- [ ] Store token status in database for persistence and querying
- [ ] Provide clear visual status indicators (green/yellow/red badges)
- [ ] Enable self-service reconnection - don't require admin intervention
- [ ] Handle concurrent refresh attempts gracefully
- [ ] Consider Testing vs Production mode OAuth app settings (Testing mode = 7-day token expiry)

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                   BACKGROUND JOB                            │
│  (Celery/Cron: Every 1-24 hours)                            │
│                                                             │
│  1. Query all active OAuth integrations                     │
│  2. Check expiry_date against threshold                     │
│  3. Attempt proactive token refresh                         │
│  4. Classify errors: PERMANENT | TRANSIENT | NONE           │
│  5. Update database status field                            │
│  6. Log summary metrics                                     │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
│  integrations table:                                        │
│  - access_token (encrypted)                                 │
│  - refresh_token (encrypted)                                │
│  - expiry_date (timestamp)                                  │
│  - status (text): active | expiring | refresh_failed |     │
│                   requires_reauth                           │
│  - last_check_time (timestamp)                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND UI                               │
│                                                             │
│  Integration Settings Page:                                 │
│  ┌────────────────────────────────────────────────┐        │
│  │ Gmail Integration    [🟢 Active]   [⚙️]       │        │
│  │ Expires in 6 days                              │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │ LinkedIn Integration [🔴 Disconnected]         │        │
│  │ Requires reconnection  [Reconnect Now]         │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Common Pitfalls

1. **Logging full tokens in error messages** — Tokens are credentials. Only log first 10-20 chars (e.g., `ya29.a0AfB...`) for debugging. Never log refresh tokens.

2. **Not differentiating error types** — `invalid_grant` means user must reauth (PERMANENT). Network errors and 5xx responses are TRANSIENT. Treating all errors the same leads to unnecessary reauth flows or failed retry loops.

3. **Using day-based thresholds for all OAuth providers** — Google OAuth access tokens expire in ~60 minutes. Use minute-based thresholds (>15min=healthy, <=15min=expiring) for short-lived tokens. Day-based thresholds only work for long-lived tokens.

4. **Race conditions during concurrent token refresh** — Multiple processes attempting to refresh the same token simultaneously can exhaust rate limits. Use distributed locking (Redis lock pattern with 7200s timeout).

5. **Ignoring Testing vs Production OAuth mode** — OAuth apps in "Testing" mode have 7-day token expiry. Production mode tokens last months/indefinitely until revoked. Always check OAuth app publishing status.

6. **No visual indicators for token health** — Users don't check logs. Surface token status with color-coded badges (green=healthy, yellow=expiring soon, red=disconnected) in the settings UI.

7. **Assuming token refresh always succeeds** — Tokens can be revoked by users, password resets, or admin policies. Always handle refresh failures gracefully and update database status.

8. **Blocking critical operations with health checks** — Token health monitoring is low-priority work. Use separate queue/priority to avoid blocking user-facing operations.

## Token Error Classification

### Error Types

| Error Type | Meaning | User Action | System Action |
|------------|---------|-------------|---------------|
| **NONE** | Token valid and refreshed successfully | None | Continue operations |
| **TRANSIENT** | Temporary failure (network, 5xx, rate limit) | None | Auto-retry with exponential backoff |
| **PERMANENT** | Token revoked/invalid (`invalid_grant`) | Reconnect account | Block operations, show reconnect button |

### Detection Logic

**PERMANENT Errors:**
- HTTP 401 with `invalid_grant` error
- User revoked access from OAuth provider
- Password reset (for Gmail scopes)
- Token limit exceeded (50-100 tokens per client)

**TRANSIENT Errors:**
- HTTP 5xx server errors
- Network timeouts
- HTTP 429 rate limiting
- Temporary service outages

**Return Type Pattern:**
```typescript
interface TokenRefreshResult {
  success: boolean;
  error_type: 'NONE' | 'TRANSIENT' | 'PERMANENT';
  token_data: {
    access_token: string;
    refresh_token: string;
    expiry_date: Date;
  } | null;
}
```

## Background Job Implementation

### Scheduling Strategy

**Check Frequency:**
- **Hourly (3600s):** For tokens expiring in hours (Google OAuth)
- **Daily (86400s):** For tokens expiring in months (LinkedIn, Slack)
- **Custom:** Match check frequency to token lifetime

**Queue Priority:**
- Use low-priority queue to avoid blocking critical operations
- Token health is important but not urgent

### Redis Locking Pattern

```python
# Pseudo-code example
def check_token_health_with_lock(integration_id):
    lock_key = f"token_health_lock:{integration_id}"
    lock_timeout = 7200  # 2 hours

    if redis.set(lock_key, "locked", nx=True, ex=lock_timeout):
        try:
            result = check_and_refresh_token(integration_id)
            update_database_status(integration_id, result)
        finally:
            redis.delete(lock_key)
    else:
        # Another process is already checking this token
        pass
```

### Proactive Refresh Thresholds

| Token Type | Lifetime | Refresh Threshold | Example |
|------------|----------|-------------------|---------|
| Short-lived | 1 hour | 15 minutes before expiry | Google OAuth |
| Medium-lived | 24 hours | 6 hours before expiry | Custom APIs |
| Long-lived | 60 days | 7 days before expiry | LinkedIn |

## UI Status Badge Design

### Visual Indicators

**Color Coding:**
- 🟢 **Green "Active"**: Token valid, sufficient time until expiry
- 🟡 **Yellow "Expiring"**: Token expires soon, action recommended
- 🔴 **Red "Disconnected"**: Token expired/failed, reconnection required

**Accessibility:**
- Don't rely on color alone - include icon + text label
- Use high contrast ratios (WCAG AA: 4.5:1 minimum)
- Support screen readers with proper ARIA labels

### Status Badge Logic

**For short-lived tokens (minute-based):**
```typescript
function getHealthStatus(expiryDate: Date, status: string) {
  const minutesUntilExpiry = (expiryDate.getTime() - Date.now()) / 60000;

  if (status === 'requires_reauth' || status === 'refresh_failed') {
    return 'disconnected';  // Red
  }
  if (minutesUntilExpiry <= 0) {
    return 'disconnected';  // Red
  }
  if (minutesUntilExpiry <= 15) {
    return 'expiring';  // Yellow
  }
  return 'healthy';  // Green
}
```

**For long-lived tokens (day-based):**
```typescript
function getHealthStatus(expiryDate: Date, status: string) {
  const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / 86400000;

  if (status === 'requires_reauth' || status === 'refresh_failed') {
    return 'disconnected';  // Red
  }
  if (daysUntilExpiry <= 0) {
    return 'disconnected';  // Red
  }
  if (daysUntilExpiry <= 7) {
    return 'expiring';  // Yellow
  }
  return 'healthy';  // Green
}
```

## Self-Service Reconnection Flow

### Reconnect Button Logic

**Show "Reconnect" button when:**
- `status === 'requires_reauth'` (permanent failure)
- `status === 'refresh_failed'` (transient failure persisting)
- `expiryDate < now()` (expired)

**Button action:**
- Trigger existing OAuth flow (redirect to provider)
- After successful OAuth callback, update database status to 'active'
- Redirect user back to settings page
- Show success toast notification

### User Communication

**Good:**
- "Your Gmail integration needs to be reconnected. Click 'Reconnect' to restore email sending."

**Bad:**
- "Token refresh failed: invalid_grant error 401"

**Best:**
- "Gmail Disconnected — Your Gmail authorization expired. Reconnect now to resume sending emails. (Takes 30 seconds)"

## Dependencies

**Backend (Python example):**
- Celery or APScheduler for background jobs
- Redis for distributed locking
- OAuth client library (e.g., `google-auth`, `authlib`)

**Backend (Node.js example):**
- Bull or Agenda for job scheduling
- ioredis for Redis locking
- OAuth client library (e.g., `googleapis`, `passport`)

**Frontend:**
- UI component library with Badge/Alert components (e.g., shadcn/ui, Radix UI)
- Date formatting library (e.g., date-fns, dayjs)
- Toast notification system

## Testing Strategy

### Unit Tests

**Token Refresh Error Classification:**
- Test `invalid_grant` error → Returns `PERMANENT`
- Test network error → Returns `TRANSIENT`
- Test HTTP 5xx → Returns `TRANSIENT`
- Test HTTP 429 rate limit → Returns `TRANSIENT`
- Test successful refresh → Returns `NONE`

**Status Badge Logic:**
- Test token expiring in 30 days → Green badge
- Test token expiring in 5 days → Yellow badge
- Test token expiring in 12 hours → Yellow badge
- Test token expired 2 days ago → Red badge
- Test status `requires_reauth` → Red badge + Reconnect button

**Security:**
- Verify full tokens never logged (only first 10-20 chars)
- Verify tokens encrypted at rest
- Verify status updates respect authorization

### Integration Tests

**Background Job:**
- Mock OAuth provider refresh endpoint
- Test job updates database status correctly
- Test Redis lock prevents concurrent execution
- Test job completes within expected time (e.g., 30s for 100 tokens)

**Reconnect Flow:**
- Test "Reconnect" button triggers OAuth flow
- Test OAuth callback updates status to 'active'
- Test user redirected back to settings page
- Test success notification displayed

## Database Considerations

### Schema Pattern

```sql
CREATE TABLE oauth_integrations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  provider VARCHAR(50) NOT NULL,  -- gmail, linkedin, slack, etc.
  access_token TEXT NOT NULL,     -- Encrypt this column
  refresh_token TEXT,             -- Encrypt this column
  expiry_date TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',  -- active, expiring, refresh_failed, requires_reauth
  last_check_time TIMESTAMPTZ,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, email)
);

CREATE INDEX idx_oauth_health_check
  ON oauth_integrations(provider, status)
  WHERE status != 'requires_reauth';
```

### Status Values

| Status Value | Meaning | UI Display |
|--------------|---------|------------|
| `active` | Token valid and working | Green badge |
| `expiring` | Token expires soon | Yellow badge |
| `refresh_failed` | Transient error, auto-retry | Yellow badge |
| `requires_reauth` | Permanent failure, user must reconnect | Red badge + Reconnect button |

## Performance Considerations

- **Batch queries:** Query all integrations at once, don't loop with individual queries
- **Parallelization:** Refresh multiple tokens concurrently (but with rate limiting)
- **Caching:** Cache valid tokens to avoid unnecessary refresh attempts
- **Monitoring:** Track health check duration, refresh success rate, error types

## Security Best Practices

- [ ] Encrypt `access_token` and `refresh_token` columns at rest
- [ ] Never expose full tokens in API responses
- [ ] Only log first 10-20 characters of tokens for debugging
- [ ] Implement rate limiting on reconnect endpoints
- [ ] Validate OAuth callback state parameter to prevent CSRF
- [ ] Use HTTPS for all OAuth redirects
- [ ] Store tokens in secure backend, never in frontend localStorage

## Related Specs

- 2026-01-30-oauth-token-health-monitoring (source implementation)
