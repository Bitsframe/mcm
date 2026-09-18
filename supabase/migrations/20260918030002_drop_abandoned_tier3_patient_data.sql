-- Tier 3 of 4 — eleven tables holding patient data or clinical records.
--
-- 191 rows in production. This tier destroys health information, so it needs a
-- retention decision before a technical one: abandoned or not, clinical records
-- can carry a statutory retention period. Confirm that before running it, and
-- take an export that is handled as PHI — not into the repository, not into a
-- scratch directory, not through a chat.
--
--   interactions  129 rows  message_body, from_number, to_number, patient_id
--   encounter      20 rows  intake_id, appointment_id, status
--   pre_sales      15 rows  products dispensed against an encounter
--   ai_soapnotes   14 rows  subjective / objective / assessment / plan
--   pk_caregiver    5 rows  caregiver name, relationship, email
--   pk_medication   4 rows  drug, dosage, frequency
--   pk_profile      2 rows  name, gender, weight, height, dob
--   pk_preferences  1 row   alert time, sound, timezone
--   pk_emergency_contact 1 row  contact name, relationship, phone
--   Transcripts     1 row   consultation transcript text
--   Rooms           1 row   daily.co room name and URL for an appointment
--
-- The kiosk tables (pk_) and the EMR tables are independent groups; either can
-- be held back by commenting out its block, as long as tier 1 has already run.
--
-- Ordered children first, no CASCADE.

begin;

-- The patient kiosk. pk_medication, pk_preferences and notifications_settings
-- are children of pk_profile; the first two go here, the third went in tier 1.
drop table if exists public.pk_medication;
drop table if exists public.pk_preferences;
drop table if exists public.pk_profile;
drop table if exists public.pk_caregiver;
drop table if exists public.pk_emergency_contact;

-- The first-generation EMR. pre_sales is a child of encounter; nursing_
-- documentation, vitals and prescription were the other three and went in
-- tier 1, so encounter is free once pre_sales is gone.
drop table if exists public.pre_sales;
drop table if exists public.encounter;

drop table if exists public.ai_soapnotes;
drop table if exists public."Transcripts";
drop table if exists public."Rooms";

-- Child of patients, which stays.
drop table if exists public.interactions;

commit;
