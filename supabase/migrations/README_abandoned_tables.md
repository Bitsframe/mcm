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

| environment | tier 1 | tier 2 | tier 3 | tier 4 |
|-------------|--------|--------|--------|--------|
| csm-staging (`reiogvwjunkdrbhwewvv`) | done | done | done | done |
| production (`vsvueqtgulraaczqnnvh`) | done | done | **not run** | **not run** |

Staging ran all four on 2026-09-18 as a single statement set rather than as
four files, so its migration ledger records one entry named
`drop_abandoned_tables`. 97 tables to 70. Afterwards the public site's home,
contact, about and location pages returned 200, a booking still wrote through
to `Appoinments`, and the security advisors reported nothing new.

Production ran tiers 1 and 2 on 2026-09-18, 97 tables to 81. The pre-flight
re-confirmed all eleven tier 1 tables were still empty, that no function or
trigger referenced any of the sixteen, and that the only foreign key pointing
at a table named `doctors` was `test_mcm.patient_appointments` pointing at
`test_mcm.doctors` — a different schema these migrations do not touch.
Afterwards all sixteen were gone, the seventeen tables that were meant to stay
were all present, `allpatients` (15,807), `Appoinments` (4,703) and `orders`
(21,873) were unchanged, PostgREST still served every kept table, and
clinicsanmiguel.com, portal.myclinicmd.com and csa.myclinicmd.com all
returned 200.

### What tier 2 held, for the record

Nothing of business value, which the export confirmed:

- `doctors` — one test row: "Raheel", Cardiologist, mcm@mail.com, location 2.
- `migration_logs` — one row, a DDL script for tables this set is dropping.
- `loginid` — two test accounts, Mack890 and Raheeltest, each with a short
  password stored in plain text. The values are not reproduced here; if either
  was ever reused elsewhere, rotate it.
- `email_log` — six rows, all `last_sent_at` 2025-06-28.
- `pk_translation` — 115 UI strings for the kiosk's medication reminders, all
  English and Spanish pairs like "Refill Alerts" / "Alertas de recarga".
