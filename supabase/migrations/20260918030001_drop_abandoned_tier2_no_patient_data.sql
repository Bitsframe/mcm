-- Tier 2 of 4 — five tables holding data, none of it about a patient.
--
-- 125 rows in production. Export them first if you want them; a plain CSV is
-- enough, none of this is sensitive except loginid, noted below.
--
--   doctors          1 row    clinic staff contact details
--   migration_logs   1 row    appears in no repository at all
--   loginid          2 rows   see the warning below
--   email_log        6 rows   profile_id, location_id, last_sent_at
--   pk_translation 115 rows   UI strings: key, en, es — no patient data
--
-- WARNING, and a reason to run this tier sooner rather than later: loginid
-- stores passwords in plain text. Its two rows, userid Mack890 and Raheeltest,
-- hold 8- and 10-character values that are neither bcrypt nor any hex digest.
-- They are not reachable over the API — RLS is on with no policies, so
-- PostgREST denies every read — but anyone with the service-role key or direct
-- database access can read them. Rotate those two passwords wherever they are
-- still in use, then drop the table.

begin;

drop table if exists public.doctors;
drop table if exists public.migration_logs;
drop table if exists public.loginid;
drop table if exists public.email_log;
drop table if exists public.pk_translation;

commit;
