-- Tier 1 of 4 — eleven tables holding zero rows.
--
-- Nothing to export and nothing to lose: these are schema only, in both
-- staging and production. Run this tier on its own; the later tiers destroy
-- data and deserve separate decisions.
--
-- Why they are dead, and how that was established, is recorded in
-- 20260918030003_drop_abandoned_tier4_orders_column.sql, which closes the set.
--
-- Ordered children first so no statement needs CASCADE. CASCADE would take
-- unnamed dependents with it; being explicit means an unexpected dependency
-- fails the migration instead of being silently destroyed. Three tables here
-- are children of `encounter` and one of `pk_profile`, both of which go in
-- tier 3 — so this tier must run first.

begin;

-- Children of encounter (tier 3).
drop table if exists public.nursing_documentation;
drop table if exists public.vitals;
drop table if exists public.prescription;

-- Child of pk_profile (tier 3).
drop table if exists public.notifications_settings;

-- Child of Appoinments, which stays.
drop table if exists public.doctor_soap_notes;

-- Child of patients, which stays — the bridge writes it as portal.patients.
drop table if exists public.call_logs;

-- Child of Locations, which stays.
drop table if exists public.nurse;

-- emr_patient_detail is a child of emr_profile.
drop table if exists public.emr_patient_detail;
drop table if exists public.emr_profile;

drop table if exists public.sample_features;

-- Not the specials feature: that page reads special_picture.
drop table if exists public."Specials";

commit;
