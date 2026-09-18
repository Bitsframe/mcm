# Dropping the 27 abandoned tables

Four migrations, `20260918030000` to `20260918030003`, remove 27 tables that
nothing reads or writes. They are split by what running them can cost, so each
can be approved separately. Run them in order: tiers 1 and 3 contain
parent/child pairs that are only safe in this sequence, and tier 4 depends on
tier 3.

| tier | tables | production rows | what a mistake costs |
|------|--------|-----------------|----------------------|
| 1 | 11 | 0 | nothing — schema only |
| 2 | 5 | 125 | staff contacts and UI strings |
| 3 | 11 | 191 | patient and clinical records |
| 4 | 1 column | 7 links | a column on the live `orders` table |

## How "dead" was established

Every table name was grepped across all six repositories that reach this
database — mcm, mcm-csa, mcm-bridge, clinica-san-miguel2, qr-csm and MEMR —
then checked against every SQL function, trigger, view and foreign key in the
database, and against all three edge functions. None of the 27 appears in any
of them.

Three groups came out of it:

- **The first-generation EMR.** That work moved to the `myclinicmd` project,
  which models the same data as `encounters` and `prescriptions` — plural. The
  singular tables here never followed it. MEMR code mentioning these names
  talks to its own database, not this one.
- **The patient kiosk**, the `pk_` tables. Referenced nowhere outside the
  schema dump; nothing has written to them since 2025-09.
- **Six one-offs**, including `migration_logs`, which appears in no repository
  at all, and `Specials`, which is not the specials feature — that page reads
  `special_picture`.

## Four tables that look dead and are not

Each holds zero rows but still has a live writer, so a row count alone would
have condemned them:

| table | written by |
|-------|-----------|
| `signed_form` | clinica-san-miguel2 `/api/upload-consent` |
| `promousage` | mcm `/api/promocode/validate`, and `after_order_insert()` |
| `threshold_history` | mcm `/api/bonuses/save` |
| `email_replies` | mcm `/api/email-reply/webhook` |

Three more are written constantly despite their features being hidden from the
UI: `credit_audit`, `patients` (the bridge's `portal.patients`) and
`thresholds`.

## Reversing

The `CREATE TABLE` statements for all 27 are in
`20251225131905_remote_schema.sql`, so the schema is recoverable from this
repository alone. The data in tiers 2 and 3 is not — export it first.

## Status

Applied to csm-staging (`reiogvwjunkdrbhwewvv`) on 2026-09-18, as a single
statement set rather than four; its migration ledger records one entry named
`drop_abandoned_tables`. The four files here produce the same end state on a
fresh database and are the intended path for production, which is untouched.

After the staging run: 97 tables to 70, the public site's home, contact, about
and location pages returned 200, a booking still wrote through to
`Appoinments`, and the security advisors reported nothing new.
