# Rebel Interface Contact API

Express 5 API for the connected React Contact screen. The route validates and
normalizes input before calling an injected email-service adapter. Mock mode is
the safe default; Resend uses Node.js 24 native `fetch()` and no provider SDK.

## Configuration

Copy `.env.example` to `.env` and keep `.env` local.

```dotenv
HOST=127.0.0.1
PORT=3001
FRONTEND_ORIGIN=http://127.0.0.1:4173
EMAIL_PROVIDER=mock
CONTACT_RATE_LIMIT_MAX=5
CONTACT_RATE_LIMIT_WINDOW_MS=900000
RESEND_REQUEST_TIMEOUT_MS=10000
```

`FRONTEND_ORIGIN` must be one exact HTTP or HTTPS origin without a path. Mock
mode always fails closed with HTTP 503 and never reports real provider
acceptance.

For an explicitly authorized Resend run, add the credential only to `.env`:

```dotenv
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_backend_only_key
```

`EMAIL_API_KEY` remains a legacy fallback. Keys are never returned to clients or
included in logs. The current adapter is intentionally pinned to the Resend test
sender `onboarding@resend.dev` and recipient `delivered@resend.dev`; replace both
with approved verified-domain configuration before production use.

## Commands

Run from `server/`:

```powershell
npm ci
npm test
npm run dev
npm start
```

Node.js 24 or newer is required. Tests inject mocked provider responses and do
not require credentials or contact Resend.

## API contract

### `GET /api/health`

Returns HTTP 200 with:

```json
{ "success": true, "status": "ok" }
```

### `POST /api/contact`

Requires `Content-Type: application/json` and only these fields:

```json
{
  "name": "Visitor Name",
  "email": "visitor@example.com",
  "message": "Project enquiry"
}
```

Limits are 80 characters for name, 254 for email, 1,200 for message, and 8 KB
for the full request body. Values are trimmed; email is normalized to lowercase.

Responses:

- `200`: configured provider accepted the request.
- `400`: validation failure or malformed JSON.
- `403`: browser origin is not allowed.
- `404`: unknown API route.
- `413`: request body exceeds 8 KB.
- `415`: content type is not JSON.
- `429`: process-local contact rate limit exceeded; includes `Retry-After`.
- `500`: unexpected internal failure with sanitized client output.
- `502`: provider rejected the request or omitted an acceptance ID.
- `503`: mock mode, provider timeout, network failure, or transient provider
  failure.

A `200` response is acceptance only. Delivery confirmation requires a later
provider event or webhook integration.

## Security behavior

- exact-origin CORS with a narrow method/header allowlist;
- JSON parsing with an 8 KB limit and strict object validation;
- rejection of extra fields, nested values, malformed email, and control
  characters in header-bound fields;
- in-memory rate limiting before body parsing;
- disabled `X-Powered-By`, no-store responses, sanitized errors, and restrictive
  API response headers;
- proxy trust disabled by default so client IP behavior is not silently changed;
- no request payloads, API keys, provider bodies, or provider IDs in logs.

## Production limitations

This service needs persistent Node hosting; it cannot be deployed as part of a
static Vite bundle. Run it behind HTTPS, route the browser's `/api/*` traffic to
it, set the exact production frontend origin, and keep all credentials in the
backend environment. HSTS and frontend document security policy normally belong
at the HTTPS edge.

The rate limiter is single-process memory only and is not sufficient for a
multi-instance deployment. `trust proxy` is disabled; configure it deliberately
only after the production proxy chain is known. The API has no database,
delivery webhook, queue, retry worker, durable audit trail, or centralized error
monitoring.
