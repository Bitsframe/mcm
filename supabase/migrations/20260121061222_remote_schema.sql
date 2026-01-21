create type "public"."block_type" as enum ('heading', 'paragraph', 'list', 'table', 'field', 'signature', 'spacer');

create type "public"."encounter_status" as enum ('appointment_initiated', 'provider_assigned', 'vitals_assessed', 'in_consultation', 'consultation_concluded', 'final_review', 'completed');

create type "public"."exam_status_enum" as enum ('Never', 'Don’t remember', 'Month & Year');

create type "public"."form_type" as enum ('telemedicine', 'hipaa', 'surgery');

drop trigger if exists "after_appoinments_insert" on "public"."Appoinments";

drop trigger if exists "before_insert_set_date_and_time_null" on "public"."Appoinments";

drop trigger if exists "trg_set_new_patient" on "public"."Appoinments";

drop policy "Enable edit access for all users" on "public"."Specials";

drop policy "Enable read access for all users" on "public"."Specials";

drop policy "Allow" on "public"."pk_medication";

drop policy "get medications" on "public"."pk_medication";

drop policy "insert allow" on "public"."pk_medication";

drop policy "update medication" on "public"."pk_medication";

drop policy "allow insert" on "public"."pk_preferences";

drop policy "allow" on "public"."pk_profile";

drop policy "allowing all" on "public"."pk_profile";

drop policy "get translation" on "public"."pk_translation";

drop policy "allow read to all" on "public"."sample_features";

revoke delete on table "public"."Specials" from "anon";

revoke insert on table "public"."Specials" from "anon";

revoke references on table "public"."Specials" from "anon";

revoke select on table "public"."Specials" from "anon";

revoke trigger on table "public"."Specials" from "anon";

revoke truncate on table "public"."Specials" from "anon";

revoke update on table "public"."Specials" from "anon";

revoke delete on table "public"."Specials" from "authenticated";

revoke insert on table "public"."Specials" from "authenticated";

revoke references on table "public"."Specials" from "authenticated";

revoke select on table "public"."Specials" from "authenticated";

revoke trigger on table "public"."Specials" from "authenticated";

revoke truncate on table "public"."Specials" from "authenticated";

revoke update on table "public"."Specials" from "authenticated";

revoke delete on table "public"."Specials" from "service_role";

revoke insert on table "public"."Specials" from "service_role";

revoke references on table "public"."Specials" from "service_role";

revoke select on table "public"."Specials" from "service_role";

revoke trigger on table "public"."Specials" from "service_role";

revoke truncate on table "public"."Specials" from "service_role";

revoke update on table "public"."Specials" from "service_role";

revoke delete on table "public"."pk_caregiver" from "anon";

revoke insert on table "public"."pk_caregiver" from "anon";

revoke references on table "public"."pk_caregiver" from "anon";

revoke select on table "public"."pk_caregiver" from "anon";

revoke trigger on table "public"."pk_caregiver" from "anon";

revoke truncate on table "public"."pk_caregiver" from "anon";

revoke update on table "public"."pk_caregiver" from "anon";

revoke delete on table "public"."pk_caregiver" from "authenticated";

revoke insert on table "public"."pk_caregiver" from "authenticated";

revoke references on table "public"."pk_caregiver" from "authenticated";

revoke select on table "public"."pk_caregiver" from "authenticated";

revoke trigger on table "public"."pk_caregiver" from "authenticated";

revoke truncate on table "public"."pk_caregiver" from "authenticated";

revoke update on table "public"."pk_caregiver" from "authenticated";

revoke delete on table "public"."pk_caregiver" from "service_role";

revoke insert on table "public"."pk_caregiver" from "service_role";

revoke references on table "public"."pk_caregiver" from "service_role";

revoke select on table "public"."pk_caregiver" from "service_role";

revoke trigger on table "public"."pk_caregiver" from "service_role";

revoke truncate on table "public"."pk_caregiver" from "service_role";

revoke update on table "public"."pk_caregiver" from "service_role";

revoke delete on table "public"."pk_emergency_contact" from "anon";

revoke insert on table "public"."pk_emergency_contact" from "anon";

revoke references on table "public"."pk_emergency_contact" from "anon";

revoke select on table "public"."pk_emergency_contact" from "anon";

revoke trigger on table "public"."pk_emergency_contact" from "anon";

revoke truncate on table "public"."pk_emergency_contact" from "anon";

revoke update on table "public"."pk_emergency_contact" from "anon";

revoke delete on table "public"."pk_emergency_contact" from "authenticated";

revoke insert on table "public"."pk_emergency_contact" from "authenticated";

revoke references on table "public"."pk_emergency_contact" from "authenticated";

revoke select on table "public"."pk_emergency_contact" from "authenticated";

revoke trigger on table "public"."pk_emergency_contact" from "authenticated";

revoke truncate on table "public"."pk_emergency_contact" from "authenticated";

revoke update on table "public"."pk_emergency_contact" from "authenticated";

revoke delete on table "public"."pk_emergency_contact" from "service_role";

revoke insert on table "public"."pk_emergency_contact" from "service_role";

revoke references on table "public"."pk_emergency_contact" from "service_role";

revoke select on table "public"."pk_emergency_contact" from "service_role";

revoke trigger on table "public"."pk_emergency_contact" from "service_role";

revoke truncate on table "public"."pk_emergency_contact" from "service_role";

revoke update on table "public"."pk_emergency_contact" from "service_role";

revoke delete on table "public"."pk_health_care_information" from "anon";

revoke insert on table "public"."pk_health_care_information" from "anon";

revoke references on table "public"."pk_health_care_information" from "anon";

revoke select on table "public"."pk_health_care_information" from "anon";

revoke trigger on table "public"."pk_health_care_information" from "anon";

revoke truncate on table "public"."pk_health_care_information" from "anon";

revoke update on table "public"."pk_health_care_information" from "anon";

revoke delete on table "public"."pk_health_care_information" from "authenticated";

revoke insert on table "public"."pk_health_care_information" from "authenticated";

revoke references on table "public"."pk_health_care_information" from "authenticated";

revoke select on table "public"."pk_health_care_information" from "authenticated";

revoke trigger on table "public"."pk_health_care_information" from "authenticated";

revoke truncate on table "public"."pk_health_care_information" from "authenticated";

revoke update on table "public"."pk_health_care_information" from "authenticated";

revoke delete on table "public"."pk_health_care_information" from "service_role";

revoke insert on table "public"."pk_health_care_information" from "service_role";

revoke references on table "public"."pk_health_care_information" from "service_role";

revoke select on table "public"."pk_health_care_information" from "service_role";

revoke trigger on table "public"."pk_health_care_information" from "service_role";

revoke truncate on table "public"."pk_health_care_information" from "service_role";

revoke update on table "public"."pk_health_care_information" from "service_role";

revoke delete on table "public"."pk_medication" from "anon";

revoke insert on table "public"."pk_medication" from "anon";

revoke references on table "public"."pk_medication" from "anon";

revoke select on table "public"."pk_medication" from "anon";

revoke trigger on table "public"."pk_medication" from "anon";

revoke truncate on table "public"."pk_medication" from "anon";

revoke update on table "public"."pk_medication" from "anon";

revoke delete on table "public"."pk_medication" from "authenticated";

revoke insert on table "public"."pk_medication" from "authenticated";

revoke references on table "public"."pk_medication" from "authenticated";

revoke select on table "public"."pk_medication" from "authenticated";

revoke trigger on table "public"."pk_medication" from "authenticated";

revoke truncate on table "public"."pk_medication" from "authenticated";

revoke update on table "public"."pk_medication" from "authenticated";

revoke delete on table "public"."pk_medication" from "service_role";

revoke insert on table "public"."pk_medication" from "service_role";

revoke references on table "public"."pk_medication" from "service_role";

revoke select on table "public"."pk_medication" from "service_role";

revoke trigger on table "public"."pk_medication" from "service_role";

revoke truncate on table "public"."pk_medication" from "service_role";

revoke update on table "public"."pk_medication" from "service_role";

revoke delete on table "public"."pk_preferences" from "anon";

revoke insert on table "public"."pk_preferences" from "anon";

revoke references on table "public"."pk_preferences" from "anon";

revoke select on table "public"."pk_preferences" from "anon";

revoke trigger on table "public"."pk_preferences" from "anon";

revoke truncate on table "public"."pk_preferences" from "anon";

revoke update on table "public"."pk_preferences" from "anon";

revoke delete on table "public"."pk_preferences" from "authenticated";

revoke insert on table "public"."pk_preferences" from "authenticated";

revoke references on table "public"."pk_preferences" from "authenticated";

revoke select on table "public"."pk_preferences" from "authenticated";

revoke trigger on table "public"."pk_preferences" from "authenticated";

revoke truncate on table "public"."pk_preferences" from "authenticated";

revoke update on table "public"."pk_preferences" from "authenticated";

revoke delete on table "public"."pk_preferences" from "service_role";

revoke insert on table "public"."pk_preferences" from "service_role";

revoke references on table "public"."pk_preferences" from "service_role";

revoke select on table "public"."pk_preferences" from "service_role";

revoke trigger on table "public"."pk_preferences" from "service_role";

revoke truncate on table "public"."pk_preferences" from "service_role";

revoke update on table "public"."pk_preferences" from "service_role";

revoke delete on table "public"."pk_profile" from "anon";

revoke insert on table "public"."pk_profile" from "anon";

revoke references on table "public"."pk_profile" from "anon";

revoke select on table "public"."pk_profile" from "anon";

revoke trigger on table "public"."pk_profile" from "anon";

revoke truncate on table "public"."pk_profile" from "anon";

revoke update on table "public"."pk_profile" from "anon";

revoke delete on table "public"."pk_profile" from "authenticated";

revoke insert on table "public"."pk_profile" from "authenticated";

revoke references on table "public"."pk_profile" from "authenticated";

revoke select on table "public"."pk_profile" from "authenticated";

revoke trigger on table "public"."pk_profile" from "authenticated";

revoke truncate on table "public"."pk_profile" from "authenticated";

revoke update on table "public"."pk_profile" from "authenticated";

revoke delete on table "public"."pk_profile" from "service_role";

revoke insert on table "public"."pk_profile" from "service_role";

revoke references on table "public"."pk_profile" from "service_role";

revoke select on table "public"."pk_profile" from "service_role";

revoke trigger on table "public"."pk_profile" from "service_role";

revoke truncate on table "public"."pk_profile" from "service_role";

revoke update on table "public"."pk_profile" from "service_role";

revoke delete on table "public"."pk_translation" from "anon";

revoke insert on table "public"."pk_translation" from "anon";

revoke references on table "public"."pk_translation" from "anon";

revoke select on table "public"."pk_translation" from "anon";

revoke trigger on table "public"."pk_translation" from "anon";

revoke truncate on table "public"."pk_translation" from "anon";

revoke update on table "public"."pk_translation" from "anon";

revoke delete on table "public"."pk_translation" from "authenticated";

revoke insert on table "public"."pk_translation" from "authenticated";

revoke references on table "public"."pk_translation" from "authenticated";

revoke select on table "public"."pk_translation" from "authenticated";

revoke trigger on table "public"."pk_translation" from "authenticated";

revoke truncate on table "public"."pk_translation" from "authenticated";

revoke update on table "public"."pk_translation" from "authenticated";

revoke delete on table "public"."pk_translation" from "service_role";

revoke insert on table "public"."pk_translation" from "service_role";

revoke references on table "public"."pk_translation" from "service_role";

revoke select on table "public"."pk_translation" from "service_role";

revoke trigger on table "public"."pk_translation" from "service_role";

revoke truncate on table "public"."pk_translation" from "service_role";

revoke update on table "public"."pk_translation" from "service_role";

revoke delete on table "public"."sample" from "anon";

revoke insert on table "public"."sample" from "anon";

revoke references on table "public"."sample" from "anon";

revoke select on table "public"."sample" from "anon";

revoke trigger on table "public"."sample" from "anon";

revoke truncate on table "public"."sample" from "anon";

revoke update on table "public"."sample" from "anon";

revoke delete on table "public"."sample" from "authenticated";

revoke insert on table "public"."sample" from "authenticated";

revoke references on table "public"."sample" from "authenticated";

revoke select on table "public"."sample" from "authenticated";

revoke trigger on table "public"."sample" from "authenticated";

revoke truncate on table "public"."sample" from "authenticated";

revoke update on table "public"."sample" from "authenticated";

revoke delete on table "public"."sample" from "service_role";

revoke insert on table "public"."sample" from "service_role";

revoke references on table "public"."sample" from "service_role";

revoke select on table "public"."sample" from "service_role";

revoke trigger on table "public"."sample" from "service_role";

revoke truncate on table "public"."sample" from "service_role";

revoke update on table "public"."sample" from "service_role";

revoke delete on table "public"."sample_features" from "anon";

revoke insert on table "public"."sample_features" from "anon";

revoke references on table "public"."sample_features" from "anon";

revoke select on table "public"."sample_features" from "anon";

revoke trigger on table "public"."sample_features" from "anon";

revoke truncate on table "public"."sample_features" from "anon";

revoke update on table "public"."sample_features" from "anon";

revoke delete on table "public"."sample_features" from "authenticated";

revoke insert on table "public"."sample_features" from "authenticated";

revoke references on table "public"."sample_features" from "authenticated";

revoke select on table "public"."sample_features" from "authenticated";

revoke trigger on table "public"."sample_features" from "authenticated";

revoke truncate on table "public"."sample_features" from "authenticated";

revoke update on table "public"."sample_features" from "authenticated";

revoke delete on table "public"."sample_features" from "service_role";

revoke insert on table "public"."sample_features" from "service_role";

revoke references on table "public"."sample_features" from "service_role";

revoke select on table "public"."sample_features" from "service_role";

revoke trigger on table "public"."sample_features" from "service_role";

revoke truncate on table "public"."sample_features" from "service_role";

revoke update on table "public"."sample_features" from "service_role";

alter table "public"."pk_medication" drop constraint "medication_pid_fkey";

alter table "public"."pk_preferences" drop constraint "pk_preferences_p_id_fkey";

alter table "public"."pk_profile" drop constraint "PillKoala_Profile_auth_id_fkey";

alter table "public"."pk_profile" drop constraint "PillKoala_Profile_auth_id_key";

alter table "public"."pk_translation" drop constraint "pk_translation_id_key";

alter table "public"."notifications_settings" drop constraint "notifications_settings_pid_fkey";

alter table "public"."Specials" drop constraint "Specials_pkey";

alter table "public"."pk_caregiver" drop constraint "caregiver_pkey";

alter table "public"."pk_emergency_contact" drop constraint "emergency_contact_pkey";

alter table "public"."pk_health_care_information" drop constraint "health_care_information_pkey";

alter table "public"."pk_medication" drop constraint "medication_pkey";

alter table "public"."pk_preferences" drop constraint "pk_preferences_pkey";

alter table "public"."pk_profile" drop constraint "PillKoala_Profile_pkey";

alter table "public"."pk_translation" drop constraint "pk_translation_pkey";

alter table "public"."sample" drop constraint "sample_pkey";

alter table "public"."sample_features" drop constraint "sample_features_pkey";

drop index if exists "public"."PillKoala_Profile_auth_id_key";

drop index if exists "public"."PillKoala_Profile_pkey";

drop index if exists "public"."Specials_pkey";

drop index if exists "public"."caregiver_pkey";

drop index if exists "public"."emergency_contact_pkey";

drop index if exists "public"."health_care_information_pkey";

drop index if exists "public"."idx_sample_features_is_active";

drop index if exists "public"."medication_pkey";

drop index if exists "public"."pk_preferences_pkey";

drop index if exists "public"."pk_translation_id_key";

drop index if exists "public"."pk_translation_pkey";

drop index if exists "public"."sample_features_pkey";

drop index if exists "public"."sample_pkey";

drop table "public"."Specials";

drop table "public"."pk_caregiver";

drop table "public"."pk_emergency_contact";

drop table "public"."pk_health_care_information";

drop table "public"."pk_medication";

drop table "public"."pk_preferences";

drop table "public"."pk_profile";

drop table "public"."pk_translation";

drop table "public"."sample";

drop table "public"."sample_features";


  create table "archive"."pk_caregiver" (
    "pk_caregiver" uuid not null default gen_random_uuid(),
    "caregiver_name" text,
    "caregiver_relationship" text,
    "caregiver_email" text,
    "access_level" text
      );


alter table "archive"."pk_caregiver" enable row level security;


  create table "archive"."pk_emergency_contact" (
    "pk_emergency_contact" uuid not null default gen_random_uuid(),
    "contact_name" text not null,
    "relationship" text,
    "phone_number" text
      );


alter table "archive"."pk_emergency_contact" enable row level security;


  create table "archive"."pk_health_care_information" (
    "pk_health_care_information" uuid not null default gen_random_uuid(),
    "doctor_name" text,
    "clinic_name" text,
    "clinic_address" text,
    "clinic_phone_number" text,
    "clinic_email" text
      );


alter table "archive"."pk_health_care_information" enable row level security;


  create table "archive"."pk_medication" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "dosage" integer not null,
    "unit" text not null,
    "quantity" integer not null,
    "frequency" text not null,
    "time" time without time zone not null,
    "notes" text,
    "pid" bigint not null
      );


alter table "archive"."pk_medication" enable row level security;


  create table "archive"."pk_preferences" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "p_id" bigint,
    "alert_time" bigint,
    "alert_sound" text,
    "timezone" text
      );


alter table "archive"."pk_preferences" enable row level security;


  create table "archive"."pk_profile" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "auth_id" uuid not null,
    "first_name" text not null,
    "last_name" text not null,
    "gender" public."Gender",
    "weight" real,
    "height" real,
    "dob" date,
    "language" text not null default 'en'::text
      );


alter table "archive"."pk_profile" enable row level security;


  create table "archive"."pk_translation" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "key" text not null,
    "en" text not null,
    "es" text not null
      );


alter table "archive"."pk_translation" enable row level security;


  create table "public"."forms" (
    "id" bigint generated always as identity not null,
    "name" text not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "content" jsonb
      );


alter table "public"."forms" enable row level security;


  create table "public"."signed_form" (
    "appointment_id" bigint,
    "telemedicine_form_path" text,
    "id" bigint generated always as identity not null,
    "hipaacompliance_form_path" text,
    "generalsurgery_form_path" text
      );


alter table "public"."signed_form" enable row level security;


  create table "public"."special_picture" (
    "id" bigint generated by default as identity not null,
    "file_path" text not null,
    "display" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "title" text
      );


alter table "public"."special_picture" enable row level security;

alter table "public"."Appoinments" add column "signed_form_path" text;

alter table "public"."Appoinments" add column "status" public.encounter_status default 'appointment_initiated'::public.encounter_status;

alter table "public"."allpatients" add column "address" text;

alter table "public"."doctors" alter column "availability" set data type boolean using "availability"::boolean;

alter table "public"."email_replies" enable row level security;

alter table "public"."emr_patient_detail" enable row level security;

alter table "public"."emr_profile" enable row level security;

alter table "public"."intake_form" add column "birth_control" character varying(20);

alter table "public"."intake_form" add column "last_pap_smear_month_year" character varying(20);

alter table "public"."intake_form" add column "last_pap_smear_status" public.exam_status_enum;

alter table "public"."intake_form" add column "last_prostate_exam_month_year" character varying(20);

alter table "public"."intake_form" add column "last_prostate_exam_status" public.exam_status_enum;

alter table "public"."intake_form" add column "mammography_month_year" character varying(20);

alter table "public"."intake_form" add column "mammography_status" public.exam_status_enum;

alter table "public"."intake_form" add column "number_of_pregnancies" integer;

alter table "public"."intake_form" alter column "alcohol_use" set data type boolean using "alcohol_use"::boolean;

alter table "public"."intake_form" alter column "drug_use" set data type boolean using "drug_use"::boolean;

alter table "public"."intake_form" alter column "tobacco_use" set data type boolean using "tobacco_use"::boolean;

alter table "public"."inventory_testing" enable row level security;

alter table "public"."meeting" enable row level security;

alter table "public"."notifications_settings" enable row level security;

alter table "public"."processing_state" enable row level security;

alter table "public"."profiles" add column "availability" boolean not null default false;

alter table "public"."profiles" add column "user_type" text;

CREATE UNIQUE INDEX "PillKoala_Profile_auth_id_key" ON archive.pk_profile USING btree (auth_id);

CREATE UNIQUE INDEX "PillKoala_Profile_pkey" ON archive.pk_profile USING btree (id);

CREATE UNIQUE INDEX caregiver_pkey ON archive.pk_caregiver USING btree (pk_caregiver);

CREATE UNIQUE INDEX emergency_contact_pkey ON archive.pk_emergency_contact USING btree (pk_emergency_contact);

CREATE UNIQUE INDEX health_care_information_pkey ON archive.pk_health_care_information USING btree (pk_health_care_information);

CREATE UNIQUE INDEX medication_pkey ON archive.pk_medication USING btree (id);

CREATE UNIQUE INDEX pk_preferences_pkey ON archive.pk_preferences USING btree (id);

CREATE UNIQUE INDEX pk_translation_id_key ON archive.pk_translation USING btree (id);

CREATE UNIQUE INDEX pk_translation_pkey ON archive.pk_translation USING btree (id);

CREATE UNIQUE INDEX encounter_id_key ON public.encounter USING btree (id);

CREATE UNIQUE INDEX forms_pkey ON public.forms USING btree (id);

CREATE UNIQUE INDEX signed_form_appointment_id_key ON public.signed_form USING btree (appointment_id);

CREATE UNIQUE INDEX signed_form_pkey ON public.signed_form USING btree (id);

CREATE UNIQUE INDEX special_picture_pkey ON public.special_picture USING btree (id);

alter table "archive"."pk_caregiver" add constraint "caregiver_pkey" PRIMARY KEY using index "caregiver_pkey";

alter table "archive"."pk_emergency_contact" add constraint "emergency_contact_pkey" PRIMARY KEY using index "emergency_contact_pkey";

alter table "archive"."pk_health_care_information" add constraint "health_care_information_pkey" PRIMARY KEY using index "health_care_information_pkey";

alter table "archive"."pk_medication" add constraint "medication_pkey" PRIMARY KEY using index "medication_pkey";

alter table "archive"."pk_preferences" add constraint "pk_preferences_pkey" PRIMARY KEY using index "pk_preferences_pkey";

alter table "archive"."pk_profile" add constraint "PillKoala_Profile_pkey" PRIMARY KEY using index "PillKoala_Profile_pkey";

alter table "archive"."pk_translation" add constraint "pk_translation_pkey" PRIMARY KEY using index "pk_translation_pkey";

alter table "public"."forms" add constraint "forms_pkey" PRIMARY KEY using index "forms_pkey";

alter table "public"."signed_form" add constraint "signed_form_pkey" PRIMARY KEY using index "signed_form_pkey";

alter table "public"."special_picture" add constraint "special_picture_pkey" PRIMARY KEY using index "special_picture_pkey";

alter table "archive"."pk_medication" add constraint "medication_pid_fkey" FOREIGN KEY (pid) REFERENCES archive.pk_profile(id) not valid;

alter table "archive"."pk_medication" validate constraint "medication_pid_fkey";

alter table "archive"."pk_preferences" add constraint "pk_preferences_p_id_fkey" FOREIGN KEY (p_id) REFERENCES archive.pk_profile(id) not valid;

alter table "archive"."pk_preferences" validate constraint "pk_preferences_p_id_fkey";

alter table "archive"."pk_profile" add constraint "PillKoala_Profile_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) not valid;

alter table "archive"."pk_profile" validate constraint "PillKoala_Profile_auth_id_fkey";

alter table "archive"."pk_profile" add constraint "PillKoala_Profile_auth_id_key" UNIQUE using index "PillKoala_Profile_auth_id_key";

alter table "archive"."pk_translation" add constraint "pk_translation_id_key" UNIQUE using index "pk_translation_id_key";

alter table "public"."encounter" add constraint "encounter_id_key" UNIQUE using index "encounter_id_key";

alter table "public"."profiles" add constraint "profiles_user_type_check" CHECK ((user_type = ANY (ARRAY['doctor'::text, 'staff'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_user_type_check";

alter table "public"."signed_form" add constraint "signed_form_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public."Appoinments"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."signed_form" validate constraint "signed_form_appointment_id_fkey";

alter table "public"."signed_form" add constraint "signed_form_appointment_id_key" UNIQUE using index "signed_form_appointment_id_key";

alter table "public"."notifications_settings" add constraint "notifications_settings_pid_fkey" FOREIGN KEY (pid) REFERENCES archive.pk_profile(auth_id) not valid;

alter table "public"."notifications_settings" validate constraint "notifications_settings_pid_fkey";

grant delete on table "archive"."pk_caregiver" to "anon";

grant insert on table "archive"."pk_caregiver" to "anon";

grant references on table "archive"."pk_caregiver" to "anon";

grant select on table "archive"."pk_caregiver" to "anon";

grant trigger on table "archive"."pk_caregiver" to "anon";

grant truncate on table "archive"."pk_caregiver" to "anon";

grant update on table "archive"."pk_caregiver" to "anon";

grant delete on table "archive"."pk_caregiver" to "authenticated";

grant insert on table "archive"."pk_caregiver" to "authenticated";

grant references on table "archive"."pk_caregiver" to "authenticated";

grant select on table "archive"."pk_caregiver" to "authenticated";

grant trigger on table "archive"."pk_caregiver" to "authenticated";

grant truncate on table "archive"."pk_caregiver" to "authenticated";

grant update on table "archive"."pk_caregiver" to "authenticated";

grant delete on table "archive"."pk_caregiver" to "service_role";

grant insert on table "archive"."pk_caregiver" to "service_role";

grant references on table "archive"."pk_caregiver" to "service_role";

grant select on table "archive"."pk_caregiver" to "service_role";

grant trigger on table "archive"."pk_caregiver" to "service_role";

grant truncate on table "archive"."pk_caregiver" to "service_role";

grant update on table "archive"."pk_caregiver" to "service_role";

grant delete on table "archive"."pk_emergency_contact" to "anon";

grant insert on table "archive"."pk_emergency_contact" to "anon";

grant references on table "archive"."pk_emergency_contact" to "anon";

grant select on table "archive"."pk_emergency_contact" to "anon";

grant trigger on table "archive"."pk_emergency_contact" to "anon";

grant truncate on table "archive"."pk_emergency_contact" to "anon";

grant update on table "archive"."pk_emergency_contact" to "anon";

grant delete on table "archive"."pk_emergency_contact" to "authenticated";

grant insert on table "archive"."pk_emergency_contact" to "authenticated";

grant references on table "archive"."pk_emergency_contact" to "authenticated";

grant select on table "archive"."pk_emergency_contact" to "authenticated";

grant trigger on table "archive"."pk_emergency_contact" to "authenticated";

grant truncate on table "archive"."pk_emergency_contact" to "authenticated";

grant update on table "archive"."pk_emergency_contact" to "authenticated";

grant delete on table "archive"."pk_emergency_contact" to "service_role";

grant insert on table "archive"."pk_emergency_contact" to "service_role";

grant references on table "archive"."pk_emergency_contact" to "service_role";

grant select on table "archive"."pk_emergency_contact" to "service_role";

grant trigger on table "archive"."pk_emergency_contact" to "service_role";

grant truncate on table "archive"."pk_emergency_contact" to "service_role";

grant update on table "archive"."pk_emergency_contact" to "service_role";

grant delete on table "archive"."pk_health_care_information" to "anon";

grant insert on table "archive"."pk_health_care_information" to "anon";

grant references on table "archive"."pk_health_care_information" to "anon";

grant select on table "archive"."pk_health_care_information" to "anon";

grant trigger on table "archive"."pk_health_care_information" to "anon";

grant truncate on table "archive"."pk_health_care_information" to "anon";

grant update on table "archive"."pk_health_care_information" to "anon";

grant delete on table "archive"."pk_health_care_information" to "authenticated";

grant insert on table "archive"."pk_health_care_information" to "authenticated";

grant references on table "archive"."pk_health_care_information" to "authenticated";

grant select on table "archive"."pk_health_care_information" to "authenticated";

grant trigger on table "archive"."pk_health_care_information" to "authenticated";

grant truncate on table "archive"."pk_health_care_information" to "authenticated";

grant update on table "archive"."pk_health_care_information" to "authenticated";

grant delete on table "archive"."pk_health_care_information" to "service_role";

grant insert on table "archive"."pk_health_care_information" to "service_role";

grant references on table "archive"."pk_health_care_information" to "service_role";

grant select on table "archive"."pk_health_care_information" to "service_role";

grant trigger on table "archive"."pk_health_care_information" to "service_role";

grant truncate on table "archive"."pk_health_care_information" to "service_role";

grant update on table "archive"."pk_health_care_information" to "service_role";

grant delete on table "archive"."pk_medication" to "anon";

grant insert on table "archive"."pk_medication" to "anon";

grant references on table "archive"."pk_medication" to "anon";

grant select on table "archive"."pk_medication" to "anon";

grant trigger on table "archive"."pk_medication" to "anon";

grant truncate on table "archive"."pk_medication" to "anon";

grant update on table "archive"."pk_medication" to "anon";

grant delete on table "archive"."pk_medication" to "authenticated";

grant insert on table "archive"."pk_medication" to "authenticated";

grant references on table "archive"."pk_medication" to "authenticated";

grant select on table "archive"."pk_medication" to "authenticated";

grant trigger on table "archive"."pk_medication" to "authenticated";

grant truncate on table "archive"."pk_medication" to "authenticated";

grant update on table "archive"."pk_medication" to "authenticated";

grant delete on table "archive"."pk_medication" to "service_role";

grant insert on table "archive"."pk_medication" to "service_role";

grant references on table "archive"."pk_medication" to "service_role";

grant select on table "archive"."pk_medication" to "service_role";

grant trigger on table "archive"."pk_medication" to "service_role";

grant truncate on table "archive"."pk_medication" to "service_role";

grant update on table "archive"."pk_medication" to "service_role";

grant delete on table "archive"."pk_preferences" to "anon";

grant insert on table "archive"."pk_preferences" to "anon";

grant references on table "archive"."pk_preferences" to "anon";

grant select on table "archive"."pk_preferences" to "anon";

grant trigger on table "archive"."pk_preferences" to "anon";

grant truncate on table "archive"."pk_preferences" to "anon";

grant update on table "archive"."pk_preferences" to "anon";

grant delete on table "archive"."pk_preferences" to "authenticated";

grant insert on table "archive"."pk_preferences" to "authenticated";

grant references on table "archive"."pk_preferences" to "authenticated";

grant select on table "archive"."pk_preferences" to "authenticated";

grant trigger on table "archive"."pk_preferences" to "authenticated";

grant truncate on table "archive"."pk_preferences" to "authenticated";

grant update on table "archive"."pk_preferences" to "authenticated";

grant delete on table "archive"."pk_preferences" to "service_role";

grant insert on table "archive"."pk_preferences" to "service_role";

grant references on table "archive"."pk_preferences" to "service_role";

grant select on table "archive"."pk_preferences" to "service_role";

grant trigger on table "archive"."pk_preferences" to "service_role";

grant truncate on table "archive"."pk_preferences" to "service_role";

grant update on table "archive"."pk_preferences" to "service_role";

grant delete on table "archive"."pk_profile" to "anon";

grant insert on table "archive"."pk_profile" to "anon";

grant references on table "archive"."pk_profile" to "anon";

grant select on table "archive"."pk_profile" to "anon";

grant trigger on table "archive"."pk_profile" to "anon";

grant truncate on table "archive"."pk_profile" to "anon";

grant update on table "archive"."pk_profile" to "anon";

grant delete on table "archive"."pk_profile" to "authenticated";

grant insert on table "archive"."pk_profile" to "authenticated";

grant references on table "archive"."pk_profile" to "authenticated";

grant select on table "archive"."pk_profile" to "authenticated";

grant trigger on table "archive"."pk_profile" to "authenticated";

grant truncate on table "archive"."pk_profile" to "authenticated";

grant update on table "archive"."pk_profile" to "authenticated";

grant delete on table "archive"."pk_profile" to "service_role";

grant insert on table "archive"."pk_profile" to "service_role";

grant references on table "archive"."pk_profile" to "service_role";

grant select on table "archive"."pk_profile" to "service_role";

grant trigger on table "archive"."pk_profile" to "service_role";

grant truncate on table "archive"."pk_profile" to "service_role";

grant update on table "archive"."pk_profile" to "service_role";

grant delete on table "archive"."pk_translation" to "anon";

grant insert on table "archive"."pk_translation" to "anon";

grant references on table "archive"."pk_translation" to "anon";

grant select on table "archive"."pk_translation" to "anon";

grant trigger on table "archive"."pk_translation" to "anon";

grant truncate on table "archive"."pk_translation" to "anon";

grant update on table "archive"."pk_translation" to "anon";

grant delete on table "archive"."pk_translation" to "authenticated";

grant insert on table "archive"."pk_translation" to "authenticated";

grant references on table "archive"."pk_translation" to "authenticated";

grant select on table "archive"."pk_translation" to "authenticated";

grant trigger on table "archive"."pk_translation" to "authenticated";

grant truncate on table "archive"."pk_translation" to "authenticated";

grant update on table "archive"."pk_translation" to "authenticated";

grant delete on table "archive"."pk_translation" to "service_role";

grant insert on table "archive"."pk_translation" to "service_role";

grant references on table "archive"."pk_translation" to "service_role";

grant select on table "archive"."pk_translation" to "service_role";

grant trigger on table "archive"."pk_translation" to "service_role";

grant truncate on table "archive"."pk_translation" to "service_role";

grant update on table "archive"."pk_translation" to "service_role";

grant delete on table "public"."forms" to "anon";

grant insert on table "public"."forms" to "anon";

grant references on table "public"."forms" to "anon";

grant select on table "public"."forms" to "anon";

grant trigger on table "public"."forms" to "anon";

grant truncate on table "public"."forms" to "anon";

grant update on table "public"."forms" to "anon";

grant delete on table "public"."forms" to "authenticated";

grant insert on table "public"."forms" to "authenticated";

grant references on table "public"."forms" to "authenticated";

grant select on table "public"."forms" to "authenticated";

grant trigger on table "public"."forms" to "authenticated";

grant truncate on table "public"."forms" to "authenticated";

grant update on table "public"."forms" to "authenticated";

grant delete on table "public"."forms" to "service_role";

grant insert on table "public"."forms" to "service_role";

grant references on table "public"."forms" to "service_role";

grant select on table "public"."forms" to "service_role";

grant trigger on table "public"."forms" to "service_role";

grant truncate on table "public"."forms" to "service_role";

grant update on table "public"."forms" to "service_role";

grant delete on table "public"."signed_form" to "anon";

grant insert on table "public"."signed_form" to "anon";

grant references on table "public"."signed_form" to "anon";

grant select on table "public"."signed_form" to "anon";

grant trigger on table "public"."signed_form" to "anon";

grant truncate on table "public"."signed_form" to "anon";

grant update on table "public"."signed_form" to "anon";

grant delete on table "public"."signed_form" to "authenticated";

grant insert on table "public"."signed_form" to "authenticated";

grant references on table "public"."signed_form" to "authenticated";

grant select on table "public"."signed_form" to "authenticated";

grant trigger on table "public"."signed_form" to "authenticated";

grant truncate on table "public"."signed_form" to "authenticated";

grant update on table "public"."signed_form" to "authenticated";

grant delete on table "public"."signed_form" to "service_role";

grant insert on table "public"."signed_form" to "service_role";

grant references on table "public"."signed_form" to "service_role";

grant select on table "public"."signed_form" to "service_role";

grant trigger on table "public"."signed_form" to "service_role";

grant truncate on table "public"."signed_form" to "service_role";

grant update on table "public"."signed_form" to "service_role";

grant delete on table "public"."special_picture" to "anon";

grant insert on table "public"."special_picture" to "anon";

grant references on table "public"."special_picture" to "anon";

grant select on table "public"."special_picture" to "anon";

grant trigger on table "public"."special_picture" to "anon";

grant truncate on table "public"."special_picture" to "anon";

grant update on table "public"."special_picture" to "anon";

grant delete on table "public"."special_picture" to "authenticated";

grant insert on table "public"."special_picture" to "authenticated";

grant references on table "public"."special_picture" to "authenticated";

grant select on table "public"."special_picture" to "authenticated";

grant trigger on table "public"."special_picture" to "authenticated";

grant truncate on table "public"."special_picture" to "authenticated";

grant update on table "public"."special_picture" to "authenticated";

grant delete on table "public"."special_picture" to "service_role";

grant insert on table "public"."special_picture" to "service_role";

grant references on table "public"."special_picture" to "service_role";

grant select on table "public"."special_picture" to "service_role";

grant trigger on table "public"."special_picture" to "service_role";

grant truncate on table "public"."special_picture" to "service_role";

grant update on table "public"."special_picture" to "service_role";


  create policy "Allow"
  on "archive"."pk_medication"
  as permissive
  for delete
  to public
using (false);



  create policy "get medications"
  on "archive"."pk_medication"
  as permissive
  for select
  to public
using (true);



  create policy "insert allow"
  on "archive"."pk_medication"
  as permissive
  for insert
  to public
with check (true);



  create policy "update medication"
  on "archive"."pk_medication"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "allow insert"
  on "archive"."pk_preferences"
  as permissive
  for insert
  to public
with check (true);



  create policy "allow"
  on "archive"."pk_profile"
  as permissive
  for select
  to public
using (true);



  create policy "allowing all"
  on "archive"."pk_profile"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "get translation"
  on "archive"."pk_translation"
  as permissive
  for select
  to public
using (true);



  create policy "Public full access"
  on "public"."encounter"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "forms_delete_public"
  on "public"."forms"
  as permissive
  for delete
  to anon, authenticated
using (true);



  create policy "forms_insert_public"
  on "public"."forms"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "forms_select_public"
  on "public"."forms"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "forms_update_public"
  on "public"."forms"
  as permissive
  for update
  to anon, authenticated
using (true)
with check (true);



  create policy "Public can delete signed_form"
  on "public"."signed_form"
  as permissive
  for delete
  to public
using (true);



  create policy "Public can update signed_form"
  on "public"."signed_form"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "signed_form_all_access"
  on "public"."signed_form"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "signed_form_insert"
  on "public"."signed_form"
  as permissive
  for insert
  to public
with check (true);



  create policy "signed_form_select"
  on "public"."signed_form"
  as permissive
  for select
  to public
using (true);



  create policy "public_delete_special_picture"
  on "public"."special_picture"
  as permissive
  for delete
  to public
using (true);



  create policy "public_insert_special_picture"
  on "public"."special_picture"
  as permissive
  for insert
  to public
with check (true);



  create policy "public_read_special_picture"
  on "public"."special_picture"
  as permissive
  for select
  to public
using (true);



  create policy "public_update_special_picture"
  on "public"."special_picture"
  as permissive
  for update
  to public
using (true)
with check (true);


CREATE TRIGGER after_appoinments_insert AFTER INSERT ON public."Appoinments" FOR EACH ROW EXECUTE FUNCTION public.insert_or_update_allpatients();
ALTER TABLE "public"."Appoinments" DISABLE TRIGGER "after_appoinments_insert";

CREATE TRIGGER before_insert_set_date_and_time_null BEFORE INSERT ON public."Appoinments" FOR EACH ROW EXECUTE FUNCTION public.set_date_and_time_null_if_empty();
ALTER TABLE "public"."Appoinments" DISABLE TRIGGER "before_insert_set_date_and_time_null";

CREATE TRIGGER trg_set_new_patient BEFORE INSERT ON public."Appoinments" FOR EACH ROW EXECUTE FUNCTION public.set_new_patient_flag();
ALTER TABLE "public"."Appoinments" DISABLE TRIGGER "trg_set_new_patient";


