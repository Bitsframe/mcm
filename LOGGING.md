# Logging rules

This application handles patient data. Logging is a disclosure channel, so it
has rules.

## Why `warn` and `error` are the risk

`next.config.js` sets `compiler.removeConsole` for production builds, excluding
`error` and `warn`. That is deliberate — losing them would leave production
undiagnosable.

The consequence is that **`console.warn` and `console.error` reach production**,
while `console.log` does not. Anything passed to them is retained:

- server-side, in the deployment's log stream
- client-side, in the user's browser console — readable via devtools, browser
  extensions, screen shares and session recordings

## The rule

| Allowed | Forbidden |
| --- | --- |
| Operational status | Patient data |
| Error classification / code | Appointment data |
| HTTP status | Email, phone, name, DOB, address |
| Correlation / request id | Request or response bodies |
| Counts and aggregates | Tokens, API keys, secrets |
| | Supabase rows or error `message` / `details` |

The goal is not to log less, it is to log the same *events* without the
payloads. A count of failed sends plus an error code diagnoses an outage as well
as a recipient list, and cannot leak.

## How

Use `utils/logging/safe-log.ts`:

```ts
import { classifyError, logError, logWarn } from '@/utils/logging/safe-log';

logWarn('reminder.skipped', { code: 'NO_EMAIL_ADDRESS' });
logError('reminder.email_send_failed', { code: 'UPSTREAM_NON_200', status: response.status });
logError('reminder.job_failed', classifyError(err));
```

`SafeFields` is a **whitelist** — `code`, `status`, `correlationId`, `count`.
Anything else is dropped, and non-scalars are dropped even under an allowed key,
so a payload cannot ride in on `code`.

`classifyError(err)` returns `{ code, kind }` and never the message. Supabase's
`PostgrestError` embeds row values in `details` — *"Key (email)=(a@b.com)
already exists"* — so the message is never safe to log.

## Specifically do not

**Do not downgrade `console.warn`/`console.error` to `console.log`** to make
`removeConsole` delete them. That hides the disclosure instead of fixing it and
throws away the production diagnostics that justify keeping those levels.
Sanitize the data instead.

**Do not log an upstream response body.** `error.response?.data` and
`response.data` come from systems we do not control and routinely echo the
request — including the recipient — back at us.

**Do not log identifiers that resolve to a patient**, including
`appointment.id` and `patient_id`. Per-item detail belongs in the response to an
authenticated caller, not in the log stream.

## Audited 2026-09-21

314 `warn`/`error` calls reviewed by parsing each call's arguments rather than
keyword matching. 15 were passing payloads or identity fields; 8 are fixed, and
the remainder are listed in `qr-csm/control/next-upgrade.md` for the next pass.
