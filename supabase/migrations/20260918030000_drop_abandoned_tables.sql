-- Drop 27 tables that nothing reads or writes.
--
-- Verified before writing this: every table name was grepped across mcm,
-- mcm-csa, mcm-bridge, clinica-san-miguel2, qr-csm and MEMR; checked against
-- every SQL function, trigger and foreign key in this database; and against
-- all three edge functions. None of the 27 appears in any of them.
--
-- Their CREATE TABLE statements are in 20251225131905_remote_schema.sql, so
-- this is reversible from the repository alone.
--
-- Deliberately NOT dropped, though they hold zero rows — each still has a live
-- writer, which is why row count alone was not enough to decide:
--   signed_form        clinica-san-miguel2 /api/upload-consent
--   promousage         mcm /api/promocode/validate, and after_order_insert()
--   threshold_history  mcm /api/bonuses/save
--   email_replies      mcm /api/email-reply/webhook
--
-- Tables are dropped children first, so no statement needs CASCADE. CASCADE
-- would take unnamed dependents with it; being explicit means an unexpected
-- dependency fails the migration instead of being silently destroyed.

begin;

-- ---------------------------------------------------------------------------
-- 1. The first-generation EMR, superseded by the myclinicmd project.
--
-- That project models the same clinical data as "encounters" and
-- "prescriptions" — plural. The singular tables here are the earlier attempt
-- and never followed it. MEMR code mentioning these names talks to its own
-- database, not this one.
-- ---------------------------------------------------------------------------

-- orders is live, but this column points at the abandoned encounter table.
-- Populated on 7 of 21,873 rows in production, none of them in staging.
alter table if exists public.orders drop column if exists encounter_id;

drop table if exists public.nursing_documentation;
drop table if exists public.vitals;
drop table if exists public.prescription;
drop table if exists public.pre_sales;
drop table if exists public.encounter;

drop table if exists public.doctor_soap_notes;
drop table if exists public."Rooms";
drop table if exists public."Transcripts";
drop table if exists public.ai_soapnotes;

drop table if exists public.emr_patient_detail;
drop table if exists public.emr_profile;

drop table if exists public.nurse;
drop table if exists public.doctors;

-- ---------------------------------------------------------------------------
-- 2. The patient kiosk ("pk_") tables. Referenced nowhere outside the schema
--    dump; nothing has written to them since 2025-09.
-- ---------------------------------------------------------------------------

drop table if exists public.notifications_settings;
drop table if exists public.pk_medication;
drop table if exists public.pk_preferences;
drop table if exists public.pk_profile;

drop table if exists public.pk_caregiver;
drop table if exists public.pk_emergency_contact;
drop table if exists public.pk_translation;
drop table if exists public.loginid;

-- ---------------------------------------------------------------------------
-- 3. One-offs.
--
-- "Specials" is not the specials feature: that page reads special_picture.
-- call_logs and interactions hang off patients, which stays — the bridge
-- writes it as portal.patients.
-- ---------------------------------------------------------------------------

drop table if exists public.call_logs;
drop table if exists public.interactions;
drop table if exists public.migration_logs;
drop table if exists public.sample_features;
drop table if exists public."Specials";
drop table if exists public.email_log;

commit;
