create extension if not exists "pg_cron" with schema "pg_catalog";

create schema if not exists "archive";

create schema if not exists "test_mcm";

create extension if not exists "http" with schema "public";

create type "public"."Gender" as enum ('Male', 'Female', 'Other');

create type "public"."credit_type" as enum ('topup', 'order');

create type "public"."telemedicine_states" as enum ('Inprogress', 'Waiting', 'Done');

create sequence "public"."allservices_es_id_seq";

create sequence "public"."allservices_id_seq";

create sequence "public"."bonus_config_history_id_seq";

create sequence "public"."bonus_id_seq";

create sequence "public"."discounts_discount_id_seq";

create sequence "public"."email_replies_id_seq";

create sequence "public"."individual_bonus_id_seq";

create sequence "public"."processing_state_id_seq";

create sequence "public"."threshold_history_id_seq";

create sequence "test_mcm"."clinical_services_service_id_seq";

create sequence "test_mcm"."doctors_doctor_id_seq";

create sequence "test_mcm"."patient_appointments_appointment_id_seq";

drop trigger if exists "insert_or_update_allpatients_from_pos" on "public"."pos";

drop policy "all policies" on "public"."allpatients";

drop policy "insert" on "public"."allpatients";

drop policy "All Acttions" on "public"."pos";

revoke delete on table "public"."inpatients" from "anon";

revoke insert on table "public"."inpatients" from "anon";

revoke references on table "public"."inpatients" from "anon";

revoke select on table "public"."inpatients" from "anon";

revoke trigger on table "public"."inpatients" from "anon";

revoke truncate on table "public"."inpatients" from "anon";

revoke update on table "public"."inpatients" from "anon";

revoke delete on table "public"."inpatients" from "authenticated";

revoke insert on table "public"."inpatients" from "authenticated";

revoke references on table "public"."inpatients" from "authenticated";

revoke select on table "public"."inpatients" from "authenticated";

revoke trigger on table "public"."inpatients" from "authenticated";

revoke truncate on table "public"."inpatients" from "authenticated";

revoke update on table "public"."inpatients" from "authenticated";

revoke delete on table "public"."inpatients" from "service_role";

revoke insert on table "public"."inpatients" from "service_role";

revoke references on table "public"."inpatients" from "service_role";

revoke select on table "public"."inpatients" from "service_role";

revoke trigger on table "public"."inpatients" from "service_role";

revoke truncate on table "public"."inpatients" from "service_role";

revoke update on table "public"."inpatients" from "service_role";

revoke delete on table "public"."offsite_patients" from "anon";

revoke insert on table "public"."offsite_patients" from "anon";

revoke references on table "public"."offsite_patients" from "anon";

revoke select on table "public"."offsite_patients" from "anon";

revoke trigger on table "public"."offsite_patients" from "anon";

revoke truncate on table "public"."offsite_patients" from "anon";

revoke update on table "public"."offsite_patients" from "anon";

revoke delete on table "public"."offsite_patients" from "authenticated";

revoke insert on table "public"."offsite_patients" from "authenticated";

revoke references on table "public"."offsite_patients" from "authenticated";

revoke select on table "public"."offsite_patients" from "authenticated";

revoke trigger on table "public"."offsite_patients" from "authenticated";

revoke truncate on table "public"."offsite_patients" from "authenticated";

revoke update on table "public"."offsite_patients" from "authenticated";

revoke delete on table "public"."offsite_patients" from "service_role";

revoke insert on table "public"."offsite_patients" from "service_role";

revoke references on table "public"."offsite_patients" from "service_role";

revoke select on table "public"."offsite_patients" from "service_role";

revoke trigger on table "public"."offsite_patients" from "service_role";

revoke truncate on table "public"."offsite_patients" from "service_role";

revoke update on table "public"."offsite_patients" from "service_role";

revoke delete on table "public"."pos" from "anon";

revoke insert on table "public"."pos" from "anon";

revoke references on table "public"."pos" from "anon";

revoke select on table "public"."pos" from "anon";

revoke trigger on table "public"."pos" from "anon";

revoke truncate on table "public"."pos" from "anon";

revoke update on table "public"."pos" from "anon";

revoke delete on table "public"."pos" from "authenticated";

revoke insert on table "public"."pos" from "authenticated";

revoke references on table "public"."pos" from "authenticated";

revoke select on table "public"."pos" from "authenticated";

revoke trigger on table "public"."pos" from "authenticated";

revoke truncate on table "public"."pos" from "authenticated";

revoke update on table "public"."pos" from "authenticated";

revoke delete on table "public"."pos" from "service_role";

revoke insert on table "public"."pos" from "service_role";

revoke references on table "public"."pos" from "service_role";

revoke select on table "public"."pos" from "service_role";

revoke trigger on table "public"."pos" from "service_role";

revoke truncate on table "public"."pos" from "service_role";

revoke update on table "public"."pos" from "service_role";

alter table "public"."offsite_patients" drop constraint "offsite_patients_id_key";

alter table "public"."pos" drop constraint "fk_patient";

alter table "public"."pos" drop constraint "pos_locationid_fkey";

alter table "public"."feedback" drop constraint "feedback_patient_id_fkey";

alter table "public"."orders" drop constraint "orders_patient_id_fkey";

alter table "public"."promocodes" drop constraint "promocodes_assign_fkey";

alter table "public"."promousage" drop constraint "promousage_patientid_fkey";

alter table "public"."inpatients" drop constraint "inpatients_pkey";

alter table "public"."offsite_patients" drop constraint "offsite_patients_pkey";

alter table "public"."pos" drop constraint "pos_pkey";

drop index if exists "public"."inpatients_pkey";

drop index if exists "public"."offsite_patients_id_key";

drop index if exists "public"."offsite_patients_pkey";

drop index if exists "public"."pos_pkey";

drop table "public"."inpatients";

drop table "public"."offsite_patients";

drop table "public"."pos";


  create table "public"."Rooms" (
    "room_id" bigint generated by default as identity not null,
    "appointment_id" bigint not null,
    "daily_room_name" text not null,
    "daily_room_url" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."Rooms" enable row level security;


  create table "public"."Transcripts" (
    "transcript_id" bigint generated by default as identity not null,
    "appoinment_id" bigint not null,
    "content" text,
    "generated_at" timestamp with time zone default now()
      );


alter table "public"."Transcripts" enable row level security;


  create table "public"."ai_soapnotes" (
    "id" bigint generated by default as identity not null,
    "appointment_id" bigint not null,
    "subjective_text" text not null,
    "objective_text" text not null,
    "assessment_text" text not null,
    "plan_text" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."ai_soapnotes" enable row level security;


  create table "public"."allservices" (
    "id" integer not null default nextval('public.allservices_id_seq'::regclass),
    "subheading" text,
    "sub_content" jsonb,
    "question_answers" jsonb,
    "faqs" jsonb,
    "end_tagline" text,
    "note" text
      );


alter table "public"."allservices" enable row level security;


  create table "public"."allservices_es" (
    "id" integer not null default nextval('public.allservices_es_id_seq'::regclass),
    "subheading" text,
    "sub_content" jsonb,
    "question_answers" jsonb,
    "faqs" jsonb,
    "end_tagline" text,
    "note" text
      );


alter table "public"."allservices_es" enable row level security;


  create table "public"."audit_logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "entity_type" character varying(50) not null,
    "entity_id" uuid not null,
    "action" character varying(50) not null,
    "user_id" uuid,
    "changes" jsonb,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."audit_logs" enable row level security;


  create table "public"."bonus" (
    "id" integer not null default nextval('public.bonus_id_seq'::regclass),
    "bonus_amount" numeric(10,2) default 0.00,
    "date" date not null,
    "paid" boolean default false,
    "location_id" integer,
    "total_sales" numeric default 0,
    "bonus_eligibility" boolean default false,
    "paid_date" date,
    "bonus_config_history_id" integer,
    "bonus_sales" numeric default 0
      );


alter table "public"."bonus" enable row level security;


  create table "public"."bonus_config_history" (
    "id" integer not null default nextval('public.bonus_config_history_id_seq'::regclass),
    "location_id" integer,
    "flat_percentage" character varying(20) not null,
    "value" numeric(10,2) not null,
    "bonus_threshold" numeric(10,2) not null,
    "effective_from" date not null default CURRENT_DATE,
    "effective_to" date,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."bonus_config_history" enable row level security;


  create table "public"."call_logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "call_id" character varying(255) not null,
    "patient_id" uuid,
    "from_number" character varying(20),
    "to_number" character varying(20),
    "direction" character varying(10),
    "status" character varying(50),
    "duration_seconds" integer,
    "recording_url" text,
    "transcript" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now(),
    "ended_at" timestamp with time zone
      );


alter table "public"."call_logs" enable row level security;


  create table "public"."canned_responses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" character varying(255) not null,
    "content" text not null,
    "category" character varying(100),
    "language" character varying(10) default 'en'::character varying,
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."canned_responses" enable row level security;


  create table "public"."clinics" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" character varying(255) not null,
    "address" text,
    "phone" character varying(20),
    "email" character varying(255),
    "hours" jsonb,
    "services" text[],
    "timezone" character varying(50) default 'America/Los_Angeles'::character varying,
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."clinics" enable row level security;


  create table "public"."credit_audit" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "patient_id" bigint,
    "balance" double precision not null default '0'::double precision,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."credit_audit" enable row level security;


  create table "public"."discounts" (
    "discount_id" integer not null default nextval('public.discounts_discount_id_seq'::regclass),
    "order_id" integer not null,
    "product_id" integer,
    "discount_type" character varying(20) not null,
    "discount_amount" numeric(10,2) not null,
    "discount_value" numeric(10,2) not null,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );


alter table "public"."discounts" enable row level security;


  create table "public"."doctor_soap_notes" (
    "id" bigint generated by default as identity not null,
    "appointment_id" bigint not null,
    "subjective_text" text not null,
    "objective_text" text not null,
    "assessment_text" text not null,
    "plan_text" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."doctor_soap_notes" enable row level security;


  create table "public"."doctors" (
    "id" bigint generated by default as identity not null,
    "user_id" uuid not null,
    "location_id" bigint not null,
    "full_name" character varying(150) not null,
    "specialty" character varying(100),
    "availability" json,
    "phone" character varying(30),
    "email" character varying(150),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."doctors" enable row level security;


  create table "public"."email_log" (
    "profile_id" uuid not null,
    "location_id" integer not null,
    "last_sent_at" timestamp with time zone
      );


alter table "public"."email_log" enable row level security;


  create table "public"."email_replies" (
    "id" integer not null default nextval('public.email_replies_id_seq'::regclass),
    "sender_email" text not null,
    "subject" text not null,
    "body" text not null,
    "message_id" text not null,
    "conversation_id" text not null,
    "received_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "response_from_gpt" text,
    "is_gpt_response" boolean default false
      );



  create table "public"."email_templates" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "body" text not null,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "is_active" boolean default true,
    "logo_url" text,
    "created_by" uuid
      );


alter table "public"."email_templates" enable row level security;


  create table "public"."emr_patient_detail" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "pid" integer not null,
    "symptoms" text,
    "onset" text,
    "duration" text,
    "loaction" text,
    "severity" text,
    "surgeries" text,
    "allergies" text,
    "current_medication" text,
    "diabetes" boolean,
    "hypertension" boolean,
    "cancer" boolean,
    "heart_disease" boolean,
    "family_history" text,
    "tobacco_use" text,
    "alcohol_use" boolean,
    "drug_use" boolean,
    "occupation" text,
    "review" text,
    "pharmacy_detail" text,
    "pharmacy_phone" text,
    "signature_url" text
      );



  create table "public"."emr_profile" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "first_name" text,
    "last_name" text,
    "address" text,
    "phone_number" bigint,
    "date_of_birth" text,
    "auth_id" uuid,
    "authentication_id" uuid
      );



  create table "public"."encounter" (
    "id" bigint generated by default as identity not null,
    "appointment_id" bigint not null,
    "patient_id" bigint not null,
    "intake_id" bigint not null,
    "encounter_date" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."encounter" enable row level security;


  create table "public"."faqs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "question" text not null,
    "answer" text not null,
    "category" character varying(100),
    "language" character varying(10) default 'en'::character varying,
    "keywords" text[],
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."faqs" enable row level security;


  create table "public"."features" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "description" text,
    "icon" text
      );


alter table "public"."features" enable row level security;


  create table "public"."features_es" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "description" text,
    "icon" text
      );


alter table "public"."features_es" enable row level security;


  create table "public"."fulfillment_requests" (
    "created_at" timestamp with time zone default now(),
    "fulfilled_at" timestamp with time zone,
    "id" bigint generated by default as identity not null,
    "main_order_id" bigint,
    "fulfillment_order_id" bigint,
    "location_id" bigint not null,
    "inventory_id" bigint,
    "quantity" integer not null,
    "token" text not null,
    "status" text not null
      );


alter table "public"."fulfillment_requests" enable row level security;


  create table "public"."individual_bonus" (
    "id" bigint not null default nextval('public.individual_bonus_id_seq'::regclass),
    "staff_id" bigint,
    "sales_team_id" bigint,
    "bonus" numeric(12,2) not null default 0,
    "bonus_date" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone not null default now(),
    "paid" boolean not null default false,
    "paid_date" date,
    "auth_member" uuid
      );


alter table "public"."individual_bonus" enable row level security;


  create table "public"."intake_form" (
    "id" bigint generated by default as identity not null,
    "appointment_id" bigint not null,
    "chief_complaint" character varying(255),
    "location" character varying(100),
    "severity" integer,
    "symptoms_description" text,
    "medical_conditions" json,
    "surgeries" json,
    "allergies" json,
    "current_medications" json,
    "fh_diabetes" boolean,
    "fh_hypertension" boolean,
    "fh_cancer" boolean,
    "fh_heart_disease" boolean,
    "tobacco_use" character varying(20) default false,
    "alcohol_use" character varying(20) default false,
    "drug_use" character varying(20) default false,
    "occupation" character varying(150),
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "onset" date,
    "relieving_factors" json,
    "cancer_type" character varying
      );


alter table "public"."intake_form" enable row level security;


  create table "public"."interactions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "session_id" character varying(255) not null,
    "patient_id" uuid,
    "channel" character varying(20) not null,
    "direction" character varying(10) not null,
    "from_number" character varying(20),
    "to_number" character varying(20),
    "message_body" text,
    "intent" character varying(100),
    "sentiment" character varying(20),
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."interactions" enable row level security;


  create table "public"."inventory_testing" (
    "inventory_id" bigint generated by default as identity not null,
    "product_id" integer,
    "quantity" integer not null,
    "last_updated" timestamp with time zone default CURRENT_TIMESTAMP,
    "location_id" bigint,
    "price" bigint,
    "archived" boolean default false,
    "low_stock_alert_sent" boolean default false
      );



  create table "public"."meeting" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "doctor_name" text not null,
    "doctor_specialization" text,
    "patient_name" text not null,
    "appointment_date" date not null,
    "appointment_time" time without time zone not null,
    "meet_link" text,
    "notes" text,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."notifications_settings" (
    "pk_notifications_settings" uuid not null default gen_random_uuid(),
    "time_buffer" integer,
    "medication_reminders" boolean default false,
    "refill_alerts" boolean default false,
    "interaction_warnings" boolean default false,
    "pid" uuid not null
      );



  create table "public"."nurse" (
    "id" bigint generated by default as identity not null,
    "user_id" uuid not null,
    "location_id" bigint not null,
    "full_name" character varying(150) not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."nurse" enable row level security;


  create table "public"."nursing_documentation" (
    "id" bigint generated by default as identity not null,
    "encounter_id" bigint not null,
    "nursing_notes" text not null,
    "documented_date" date not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."nursing_documentation" enable row level security;


  create table "public"."patients" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "first_name" character varying(100) not null,
    "last_name" character varying(100) not null,
    "phone" character varying(20) not null,
    "email" character varying(255),
    "date_of_birth" date,
    "preferred_language" character varying(10) default 'en'::character varying,
    "consent_sms" boolean default false,
    "consent_voice" boolean default false,
    "consent_recorded_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."patients" enable row level security;


  create table "public"."pharmacy" (
    "id" bigint generated by default as identity not null,
    "name" character varying(150) not null,
    "address" text not null,
    "zipcode" character varying(10) not null,
    "phone" character varying(30),
    "opening_hours" json,
    "delivers" boolean default false,
    "delivered_to_status_updated" timestamp with time zone,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."pharmacy" enable row level security;


  create table "public"."pk_caregiver" (
    "pk_caregiver" uuid not null default gen_random_uuid(),
    "caregiver_name" text,
    "caregiver_relationship" text,
    "caregiver_email" text,
    "access_level" text
      );


alter table "public"."pk_caregiver" enable row level security;


  create table "public"."pk_emergency_contact" (
    "pk_emergency_contact" uuid not null default gen_random_uuid(),
    "contact_name" text not null,
    "relationship" text,
    "phone_number" text
      );


alter table "public"."pk_emergency_contact" enable row level security;


  create table "public"."pk_health_care_information" (
    "pk_health_care_information" uuid not null default gen_random_uuid(),
    "doctor_name" text,
    "clinic_name" text,
    "clinic_address" text,
    "clinic_phone_number" text,
    "clinic_email" text
      );



  create table "public"."pk_medication" (
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


alter table "public"."pk_medication" enable row level security;


  create table "public"."pk_preferences" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "p_id" bigint,
    "alert_time" bigint,
    "alert_sound" text,
    "timezone" text
      );


alter table "public"."pk_preferences" enable row level security;


  create table "public"."pk_profile" (
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


alter table "public"."pk_profile" enable row level security;


  create table "public"."pk_translation" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "key" text not null,
    "en" text not null,
    "es" text not null
      );


alter table "public"."pk_translation" enable row level security;


  create table "public"."pre_sales" (
    "id" bigint generated by default as identity not null,
    "appointment_id" bigint not null,
    "patient_id" bigint,
    "encounter_id" bigint,
    "inventory_id" bigint,
    "product_id" bigint,
    "category_id" bigint,
    "product_quantity" integer not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."pre_sales" enable row level security;


  create table "public"."prescription" (
    "id" bigint generated by default as identity not null,
    "pharmacy_id" bigint not null,
    "encounter_id" bigint not null,
    "medication_name" character varying(150) not null,
    "strength" character varying(50),
    "dosage_instruction" character varying(150),
    "route" character varying(50),
    "frequency" character varying(50),
    "duration" character varying(50),
    "notes" text
      );


alter table "public"."prescription" enable row level security;


  create table "public"."processing_state" (
    "id" integer not null default nextval('public.processing_state_id_seq'::regclass),
    "last_offset" integer default 0,
    "cron_active" boolean default true
      );



  create table "public"."refusal_reasons" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "reason" text
      );


alter table "public"."refusal_reasons" enable row level security;


  create table "public"."sales_team" (
    "id" bigint generated always as identity not null,
    "auth_member" uuid,
    "members" bigint[],
    "location_id" bigint not null,
    "bonus_amount_overall" numeric(12,2) default 0,
    "bonus_amount_individual" numeric(12,2) default 0,
    "valid_from" timestamp with time zone not null default now(),
    "valid_to" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."sales_team" enable row level security;


  create table "public"."staff" (
    "id" bigint generated always as identity not null,
    "full_name" text not null,
    "phone" text,
    "created_at" timestamp with time zone default now(),
    "location_id" bigint[]
      );


alter table "public"."staff" enable row level security;


  create table "public"."stock_alerts" (
    "id" uuid not null default gen_random_uuid(),
    "inventory_id" integer,
    "product_id" integer,
    "location_id" integer,
    "quantity" integer,
    "threshold" integer,
    "priority" text,
    "message" text,
    "created_at" timestamp without time zone default now(),
    "anomaly_type" text,
    "anomaly_severity" text default 'Normal'::text,
    "anomaly_message" text,
    "forecasted_runout_months" integer
      );


alter table "public"."stock_alerts" enable row level security;


  create table "public"."threshold_history" (
    "id" integer not null default nextval('public.threshold_history_id_seq'::regclass),
    "location_id" integer not null,
    "threshold_amount" numeric(10,2) not null,
    "effective_date" date not null,
    "end_date" date,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."threshold_history" enable row level security;


  create table "public"."thresholds" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" integer,
    "lead_time_days" integer default 7,
    "buffer_stock" integer default 5,
    "manual_threshold" integer,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "calculated_threshold" integer
      );


alter table "public"."thresholds" enable row level security;


  create table "public"."transaction_history" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "patient_id" bigint not null,
    "amount" double precision not null,
    "balance" double precision not null,
    "type" public.credit_type not null,
    "order_id" bigint
      );


alter table "public"."transaction_history" enable row level security;


  create table "public"."vitals" (
    "id" bigint generated by default as identity not null,
    "encounter_id" bigint,
    "bp_systolic" integer,
    "bp_diastolic" integer,
    "heart_rate" integer,
    "respiratory_rate" integer,
    "temperature" numeric(4,1),
    "temperature_unit" character varying(5) default 'F'::character varying,
    "spo2" integer,
    "weight" numeric(6,2),
    "weight_unit" character varying(10) default 'lbs'::character varying,
    "height" numeric(6,2),
    "height_unit" character varying(10) default 'in'::character varying,
    "bmi" numeric(4,1),
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."vitals" enable row level security;


  create table "test_mcm"."clinical_services" (
    "service_id" integer not null default nextval('test_mcm.clinical_services_service_id_seq'::regclass),
    "service_name" character varying(255) not null,
    "description" text,
    "available_timings" character varying(255),
    "doctor_required" boolean default false
      );



  create table "test_mcm"."doctors" (
    "doctor_id" integer not null default nextval('test_mcm.doctors_doctor_id_seq'::regclass),
    "first_name" character varying(255) not null,
    "last_name" character varying(255) not null,
    "specialty" character varying(255),
    "phone_number" character varying(20),
    "email" character varying(255),
    "available_timings" character varying(255)
      );



  create table "test_mcm"."patient_appointments" (
    "appointment_id" integer not null default nextval('test_mcm.patient_appointments_appointment_id_seq'::regclass),
    "patient_name" character varying(255) not null,
    "doctor_id" integer,
    "service_id" integer,
    "appointment_date" date not null,
    "appointment_time" time without time zone not null,
    "status" character varying(50) default 'Scheduled'::character varying
      );


alter table "public"."About_Short" add column "price" double precision default '-4234234'::double precision;

alter table "public"."Appoinments" add column "notes" text;

alter table "public"."Appoinments" add column "patient_id" bigint;

alter table "public"."Appoinments" add column "provider_name" character varying(255);

alter table "public"."Appoinments" add column "refusal_reason" bigint;

alter table "public"."Appoinments" add column "states" public.telemedicine_states default 'Waiting'::public.telemedicine_states;

alter table "public"."Appoinments" add column "two_days_before" boolean default false;

alter table "public"."Appoinments" add column "two_weeks_before" boolean default false;

alter table "public"."Appoinments" alter column "email_address" drop not null;

alter table "public"."Appoinments" alter column "first_name" drop not null;

alter table "public"."Appoinments" alter column "in_office_patient" drop not null;

alter table "public"."Appoinments" alter column "last_name" drop not null;

alter table "public"."Appoinments" alter column "new_patient" drop not null;

alter table "public"."Appoinments" alter column "service" drop not null;

alter table "public"."Appoinments" alter column "sex" drop not null;

alter table "public"."Locations" add column "balance" double precision not null default '0'::double precision;

alter table "public"."Locations" add column "credit_limit" double precision not null default '0'::double precision;

alter table "public"."Locations" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."allpatients" add column "deleted_at" timestamp without time zone;

alter table "public"."allpatients" add column "dob" date;

alter table "public"."allpatients" alter column "lastvisit" set default now();

alter table "public"."allpatients" alter column "lastvisit" set data type timestamp with time zone using "lastvisit"::timestamp with time zone;

alter table "public"."inventory" add column "low_stock_alert_sent" boolean default false;

alter table "public"."orders" add column "card" double precision not null default '0'::double precision;

alter table "public"."orders" add column "cash" double precision not null default '0'::double precision;

alter table "public"."orders" add column "credit_balance" double precision not null default '0'::double precision;

alter table "public"."orders" add column "paid_amount" double precision not null default '0'::double precision;

alter table "public"."orders" add column "previous_credit_amount" double precision not null default '0'::double precision;

alter table "public"."orders" add column "sales_team_id" bigint;

alter table "public"."orders" add column "zelle" double precision default 0;

alter table "public"."orders" alter column "patient_id" set not null;

alter table "public"."products" add column "bonus_eligible" boolean default false;

alter table "public"."products" add column "price" bigint default '0'::bigint;

alter table "public"."products" add column "stock" bigint not null default '0'::bigint;

alter table "public"."products" add column "unlimited" boolean not null default false;

alter table "public"."profiles" add column "fcm_token" text;

alter table "public"."profiles" add column "notify" boolean default true;

alter table "public"."profiles" alter column "profile_pictures" set default 'https://vsvueqtgulraaczqnnvh.supabase.co/storage/v1/object/public/profile-pictures//user.png'::text;

alter table "public"."sales_history" drop column "paymentcash";

alter table "public"."sales_history" alter column "total_price" set data type double precision using "total_price"::double precision;

alter sequence "public"."allservices_es_id_seq" owned by "public"."allservices_es"."id";

alter sequence "public"."allservices_id_seq" owned by "public"."allservices"."id";

alter sequence "public"."bonus_config_history_id_seq" owned by "public"."bonus_config_history"."id";

alter sequence "public"."bonus_id_seq" owned by "public"."bonus"."id";

alter sequence "public"."discounts_discount_id_seq" owned by "public"."discounts"."discount_id";

alter sequence "public"."email_replies_id_seq" owned by "public"."email_replies"."id";

alter sequence "public"."individual_bonus_id_seq" owned by "public"."individual_bonus"."id";

alter sequence "public"."processing_state_id_seq" owned by "public"."processing_state"."id";

alter sequence "public"."threshold_history_id_seq" owned by "public"."threshold_history"."id";

alter sequence "test_mcm"."clinical_services_service_id_seq" owned by "test_mcm"."clinical_services"."service_id";

alter sequence "test_mcm"."doctors_doctor_id_seq" owned by "test_mcm"."doctors"."doctor_id";

alter sequence "test_mcm"."patient_appointments_appointment_id_seq" owned by "test_mcm"."patient_appointments"."appointment_id";

CREATE UNIQUE INDEX "PillKoala_Profile_auth_id_key" ON public.pk_profile USING btree (auth_id);

CREATE UNIQUE INDEX "PillKoala_Profile_pkey" ON public.pk_profile USING btree (id);

CREATE UNIQUE INDEX "Rooms_pkey" ON public."Rooms" USING btree (room_id);

CREATE UNIQUE INDEX "Transcripts_pkey" ON public."Transcripts" USING btree (transcript_id);

CREATE UNIQUE INDEX ai_soapnotes_pkey ON public.ai_soapnotes USING btree (id);

CREATE UNIQUE INDEX allservices_es_pkey ON public.allservices_es USING btree (id);

CREATE UNIQUE INDEX allservices_pkey ON public.allservices USING btree (id);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX bonus_config_history_pkey ON public.bonus_config_history USING btree (id);

CREATE UNIQUE INDEX bonus_location_date_unique ON public.bonus USING btree (location_id, date);

CREATE UNIQUE INDEX bonus_pkey ON public.bonus USING btree (id);

CREATE UNIQUE INDEX call_logs_call_id_key ON public.call_logs USING btree (call_id);

CREATE UNIQUE INDEX call_logs_pkey ON public.call_logs USING btree (id);

CREATE UNIQUE INDEX canned_responses_pkey ON public.canned_responses USING btree (id);

CREATE UNIQUE INDEX caregiver_pkey ON public.pk_caregiver USING btree (pk_caregiver);

CREATE UNIQUE INDEX clinics_pkey ON public.clinics USING btree (id);

CREATE UNIQUE INDEX credit_audit_pkey ON public.credit_audit USING btree (id);

CREATE UNIQUE INDEX discounts_pkey ON public.discounts USING btree (discount_id);

CREATE UNIQUE INDEX doctor_soap_notes_pkey ON public.doctor_soap_notes USING btree (id);

CREATE UNIQUE INDEX email_log_pkey ON public.email_log USING btree (profile_id, location_id);

CREATE UNIQUE INDEX email_replies_pkey ON public.email_replies USING btree (id);

CREATE UNIQUE INDEX email_templates_pkey ON public.email_templates USING btree (id);

CREATE UNIQUE INDEX emergency_contact_pkey ON public.pk_emergency_contact USING btree (pk_emergency_contact);

CREATE UNIQUE INDEX emr_patient_detail_pkey ON public.emr_patient_detail USING btree (id, pid);

CREATE UNIQUE INDEX emr_profile_auth_id_key ON public.emr_profile USING btree (auth_id);

CREATE UNIQUE INDEX emr_profile_authentication_id_key ON public.emr_profile USING btree (authentication_id);

CREATE UNIQUE INDEX emr_profile_pkey ON public.emr_profile USING btree (id);

CREATE UNIQUE INDEX encounter_pkey ON public.encounter USING btree (id);

CREATE UNIQUE INDEX faqs_pkey ON public.faqs USING btree (id);

CREATE UNIQUE INDEX features_es_pkey ON public.features_es USING btree (id);

CREATE UNIQUE INDEX features_pkey ON public.features USING btree (id);

CREATE UNIQUE INDEX fulfillment_requests_pkey ON public.fulfillment_requests USING btree (id);

CREATE UNIQUE INDEX health_care_information_pkey ON public.pk_health_care_information USING btree (pk_health_care_information);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);

CREATE INDEX idx_call_logs_call_id ON public.call_logs USING btree (call_id);

CREATE INDEX idx_call_logs_patient_id ON public.call_logs USING btree (patient_id);

CREATE INDEX idx_faqs_active ON public.faqs USING btree (active);

CREATE INDEX idx_interactions_created_at ON public.interactions USING btree (created_at);

CREATE INDEX idx_interactions_patient_id ON public.interactions USING btree (patient_id);

CREATE INDEX idx_interactions_session_id ON public.interactions USING btree (session_id);

CREATE INDEX idx_patients_phone ON public.patients USING btree (phone);

CREATE UNIQUE INDEX individual_bonus_pkey ON public.individual_bonus USING btree (id);

CREATE UNIQUE INDEX individual_bonus_unique ON public.individual_bonus USING btree (staff_id, sales_team_id, bonus_date);

CREATE UNIQUE INDEX intake_form_pkey ON public.intake_form USING btree (id);

CREATE UNIQUE INDEX interactions_pkey ON public.interactions USING btree (id);

CREATE UNIQUE INDEX inventory_testing_inventory_id_key ON public.inventory_testing USING btree (inventory_id);

CREATE UNIQUE INDEX inventory_testing_pkey ON public.inventory_testing USING btree (inventory_id);

CREATE UNIQUE INDEX medication_pkey ON public.pk_medication USING btree (id);

CREATE UNIQUE INDEX meeting_pkey ON public.meeting USING btree (id);

CREATE UNIQUE INDEX notifications_settings_pid_key ON public.notifications_settings USING btree (pid);

CREATE UNIQUE INDEX notifications_settings_pkey ON public.notifications_settings USING btree (pk_notifications_settings);

CREATE UNIQUE INDEX nurse_pkey ON public.nurse USING btree (id);

CREATE UNIQUE INDEX nursing_documentation_pkey ON public.nursing_documentation USING btree (id);

CREATE UNIQUE INDEX patients_phone_key ON public.patients USING btree (phone);

CREATE UNIQUE INDEX patients_pkey ON public.patients USING btree (id);

CREATE UNIQUE INDEX pharmacy_pkey ON public.pharmacy USING btree (id);

CREATE UNIQUE INDEX pk_preferences_pkey ON public.pk_preferences USING btree (id);

CREATE UNIQUE INDEX pk_translation_id_key ON public.pk_translation USING btree (id);

CREATE UNIQUE INDEX pk_translation_pkey ON public.pk_translation USING btree (id);

CREATE UNIQUE INDEX pre_sales_pkey ON public.pre_sales USING btree (id);

CREATE UNIQUE INDEX prescription_pkey ON public.prescription USING btree (id);

CREATE UNIQUE INDEX processing_state_pkey ON public.processing_state USING btree (id);

CREATE UNIQUE INDEX providers_pkey ON public.doctors USING btree (id);

CREATE UNIQUE INDEX refusal_reasons_pkey ON public.refusal_reasons USING btree (id);

CREATE UNIQUE INDEX sales_team_pkey ON public.sales_team USING btree (id);

CREATE UNIQUE INDEX staff_pkey ON public.staff USING btree (id);

CREATE UNIQUE INDEX stock_alerts_pkey ON public.stock_alerts USING btree (id);

CREATE UNIQUE INDEX threshold_history_pkey ON public.threshold_history USING btree (id);

CREATE UNIQUE INDEX thresholds_pkey ON public.thresholds USING btree (id);

CREATE UNIQUE INDEX transaction_history_pkey ON public.transaction_history USING btree (id);

CREATE UNIQUE INDEX unique_appointment_room ON public."Rooms" USING btree (appointment_id);

CREATE UNIQUE INDEX unique_product_id ON public.thresholds USING btree (product_id);

CREATE UNIQUE INDEX vitals_pkey ON public.vitals USING btree (id);

CREATE UNIQUE INDEX clinical_services_pkey ON test_mcm.clinical_services USING btree (service_id);

CREATE UNIQUE INDEX doctors_pkey ON test_mcm.doctors USING btree (doctor_id);

CREATE UNIQUE INDEX patient_appointments_pkey ON test_mcm.patient_appointments USING btree (appointment_id);

alter table "public"."Rooms" add constraint "Rooms_pkey" PRIMARY KEY using index "Rooms_pkey";

alter table "public"."Transcripts" add constraint "Transcripts_pkey" PRIMARY KEY using index "Transcripts_pkey";

alter table "public"."ai_soapnotes" add constraint "ai_soapnotes_pkey" PRIMARY KEY using index "ai_soapnotes_pkey";

alter table "public"."allservices" add constraint "allservices_pkey" PRIMARY KEY using index "allservices_pkey";

alter table "public"."allservices_es" add constraint "allservices_es_pkey" PRIMARY KEY using index "allservices_es_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."bonus" add constraint "bonus_pkey" PRIMARY KEY using index "bonus_pkey";

alter table "public"."bonus_config_history" add constraint "bonus_config_history_pkey" PRIMARY KEY using index "bonus_config_history_pkey";

alter table "public"."call_logs" add constraint "call_logs_pkey" PRIMARY KEY using index "call_logs_pkey";

alter table "public"."canned_responses" add constraint "canned_responses_pkey" PRIMARY KEY using index "canned_responses_pkey";

alter table "public"."clinics" add constraint "clinics_pkey" PRIMARY KEY using index "clinics_pkey";

alter table "public"."credit_audit" add constraint "credit_audit_pkey" PRIMARY KEY using index "credit_audit_pkey";

alter table "public"."discounts" add constraint "discounts_pkey" PRIMARY KEY using index "discounts_pkey";

alter table "public"."doctor_soap_notes" add constraint "doctor_soap_notes_pkey" PRIMARY KEY using index "doctor_soap_notes_pkey";

alter table "public"."doctors" add constraint "providers_pkey" PRIMARY KEY using index "providers_pkey";

alter table "public"."email_log" add constraint "email_log_pkey" PRIMARY KEY using index "email_log_pkey";

alter table "public"."email_replies" add constraint "email_replies_pkey" PRIMARY KEY using index "email_replies_pkey";

alter table "public"."email_templates" add constraint "email_templates_pkey" PRIMARY KEY using index "email_templates_pkey";

alter table "public"."emr_patient_detail" add constraint "emr_patient_detail_pkey" PRIMARY KEY using index "emr_patient_detail_pkey";

alter table "public"."emr_profile" add constraint "emr_profile_pkey" PRIMARY KEY using index "emr_profile_pkey";

alter table "public"."encounter" add constraint "encounter_pkey" PRIMARY KEY using index "encounter_pkey";

alter table "public"."faqs" add constraint "faqs_pkey" PRIMARY KEY using index "faqs_pkey";

alter table "public"."features" add constraint "features_pkey" PRIMARY KEY using index "features_pkey";

alter table "public"."features_es" add constraint "features_es_pkey" PRIMARY KEY using index "features_es_pkey";

alter table "public"."fulfillment_requests" add constraint "fulfillment_requests_pkey" PRIMARY KEY using index "fulfillment_requests_pkey";

alter table "public"."individual_bonus" add constraint "individual_bonus_pkey" PRIMARY KEY using index "individual_bonus_pkey";

alter table "public"."intake_form" add constraint "intake_form_pkey" PRIMARY KEY using index "intake_form_pkey";

alter table "public"."interactions" add constraint "interactions_pkey" PRIMARY KEY using index "interactions_pkey";

alter table "public"."inventory_testing" add constraint "inventory_testing_pkey" PRIMARY KEY using index "inventory_testing_pkey";

alter table "public"."meeting" add constraint "meeting_pkey" PRIMARY KEY using index "meeting_pkey";

alter table "public"."notifications_settings" add constraint "notifications_settings_pkey" PRIMARY KEY using index "notifications_settings_pkey";

alter table "public"."nurse" add constraint "nurse_pkey" PRIMARY KEY using index "nurse_pkey";

alter table "public"."nursing_documentation" add constraint "nursing_documentation_pkey" PRIMARY KEY using index "nursing_documentation_pkey";

alter table "public"."patients" add constraint "patients_pkey" PRIMARY KEY using index "patients_pkey";

alter table "public"."pharmacy" add constraint "pharmacy_pkey" PRIMARY KEY using index "pharmacy_pkey";

alter table "public"."pk_caregiver" add constraint "caregiver_pkey" PRIMARY KEY using index "caregiver_pkey";

alter table "public"."pk_emergency_contact" add constraint "emergency_contact_pkey" PRIMARY KEY using index "emergency_contact_pkey";

alter table "public"."pk_health_care_information" add constraint "health_care_information_pkey" PRIMARY KEY using index "health_care_information_pkey";

alter table "public"."pk_medication" add constraint "medication_pkey" PRIMARY KEY using index "medication_pkey";

alter table "public"."pk_preferences" add constraint "pk_preferences_pkey" PRIMARY KEY using index "pk_preferences_pkey";

alter table "public"."pk_profile" add constraint "PillKoala_Profile_pkey" PRIMARY KEY using index "PillKoala_Profile_pkey";

alter table "public"."pk_translation" add constraint "pk_translation_pkey" PRIMARY KEY using index "pk_translation_pkey";

alter table "public"."pre_sales" add constraint "pre_sales_pkey" PRIMARY KEY using index "pre_sales_pkey";

alter table "public"."prescription" add constraint "prescription_pkey" PRIMARY KEY using index "prescription_pkey";

alter table "public"."processing_state" add constraint "processing_state_pkey" PRIMARY KEY using index "processing_state_pkey";

alter table "public"."refusal_reasons" add constraint "refusal_reasons_pkey" PRIMARY KEY using index "refusal_reasons_pkey";

alter table "public"."sales_team" add constraint "sales_team_pkey" PRIMARY KEY using index "sales_team_pkey";

alter table "public"."staff" add constraint "staff_pkey" PRIMARY KEY using index "staff_pkey";

alter table "public"."stock_alerts" add constraint "stock_alerts_pkey" PRIMARY KEY using index "stock_alerts_pkey";

alter table "public"."threshold_history" add constraint "threshold_history_pkey" PRIMARY KEY using index "threshold_history_pkey";

alter table "public"."thresholds" add constraint "thresholds_pkey" PRIMARY KEY using index "thresholds_pkey";

alter table "public"."transaction_history" add constraint "transaction_history_pkey" PRIMARY KEY using index "transaction_history_pkey";

alter table "public"."vitals" add constraint "vitals_pkey" PRIMARY KEY using index "vitals_pkey";

alter table "test_mcm"."clinical_services" add constraint "clinical_services_pkey" PRIMARY KEY using index "clinical_services_pkey";

alter table "test_mcm"."doctors" add constraint "doctors_pkey" PRIMARY KEY using index "doctors_pkey";

alter table "test_mcm"."patient_appointments" add constraint "patient_appointments_pkey" PRIMARY KEY using index "patient_appointments_pkey";

alter table "public"."Appoinments" add constraint "Appoinments_refusal_reason_fkey" FOREIGN KEY (refusal_reason) REFERENCES public.refusal_reasons(id) not valid;

alter table "public"."Appoinments" validate constraint "Appoinments_refusal_reason_fkey";

alter table "public"."Appoinments" add constraint "fk_appointment_patient" FOREIGN KEY (patient_id) REFERENCES public.allpatients(id) ON DELETE SET NULL not valid;

alter table "public"."Appoinments" validate constraint "fk_appointment_patient";

alter table "public"."Rooms" add constraint "Rooms_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public."Appoinments"(id) ON DELETE CASCADE not valid;

alter table "public"."Rooms" validate constraint "Rooms_appointment_id_fkey";

alter table "public"."Rooms" add constraint "unique_appointment_room" UNIQUE using index "unique_appointment_room";

alter table "public"."Transcripts" add constraint "Transcripts_appoinment_id_fkey" FOREIGN KEY (appoinment_id) REFERENCES public."Appoinments"(id) ON DELETE CASCADE not valid;

alter table "public"."Transcripts" validate constraint "Transcripts_appoinment_id_fkey";

alter table "public"."ai_soapnotes" add constraint "soap_notes_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public."Appoinments"(id) not valid;

alter table "public"."ai_soapnotes" validate constraint "soap_notes_appointment_id_fkey";

alter table "public"."allservices" add constraint "fk_allservices_service_id" FOREIGN KEY (id) REFERENCES public.services(id) ON DELETE CASCADE not valid;

alter table "public"."allservices" validate constraint "fk_allservices_service_id";

alter table "public"."allservices_es" add constraint "fk_allservices_es_service_id" FOREIGN KEY (id) REFERENCES public.services_es(id) ON DELETE CASCADE not valid;

alter table "public"."allservices_es" validate constraint "fk_allservices_es_service_id";

alter table "public"."bonus" add constraint "bonus_location_date_unique" UNIQUE using index "bonus_location_date_unique";

alter table "public"."bonus" add constraint "fk_bonus_config_history" FOREIGN KEY (bonus_config_history_id) REFERENCES public.bonus_config_history(id) ON DELETE SET NULL not valid;

alter table "public"."bonus" validate constraint "fk_bonus_config_history";

alter table "public"."bonus" add constraint "fk_bonus_location" FOREIGN KEY (location_id) REFERENCES public."Locations"(id) ON DELETE CASCADE not valid;

alter table "public"."bonus" validate constraint "fk_bonus_location";

alter table "public"."bonus" add constraint "fk_location" FOREIGN KEY (location_id) REFERENCES public."Locations"(id) not valid;

alter table "public"."bonus" validate constraint "fk_location";

alter table "public"."bonus_config_history" add constraint "bonus_config_history_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public."Locations"(id) not valid;

alter table "public"."bonus_config_history" validate constraint "bonus_config_history_location_id_fkey";

alter table "public"."call_logs" add constraint "call_logs_call_id_key" UNIQUE using index "call_logs_call_id_key";

alter table "public"."call_logs" add constraint "call_logs_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL not valid;

alter table "public"."call_logs" validate constraint "call_logs_patient_id_fkey";

alter table "public"."credit_audit" add constraint "credit_audit_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.allpatients(id) ON DELETE CASCADE not valid;

alter table "public"."credit_audit" validate constraint "credit_audit_patient_id_fkey";

alter table "public"."discounts" add constraint "check_discount_amount" CHECK ((discount_amount <= 100.00)) not valid;

alter table "public"."discounts" validate constraint "check_discount_amount";

alter table "public"."discounts" add constraint "discounts_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(order_id) not valid;

alter table "public"."discounts" validate constraint "discounts_order_id_fkey";

alter table "public"."discounts" add constraint "discounts_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(product_id) not valid;

alter table "public"."discounts" validate constraint "discounts_product_id_fkey";

alter table "public"."doctor_soap_notes" add constraint "soap_notes_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public."Appoinments"(id) not valid;

alter table "public"."doctor_soap_notes" validate constraint "soap_notes_appointment_id_fkey";

alter table "public"."doctors" add constraint "providers_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public."Locations"(id) not valid;

alter table "public"."doctors" validate constraint "providers_location_id_fkey";

alter table "public"."doctors" add constraint "providers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."doctors" validate constraint "providers_user_id_fkey";

alter table "public"."emr_patient_detail" add constraint "emr_patient_detail_pid_fkey" FOREIGN KEY (pid) REFERENCES public.emr_profile(id) not valid;

alter table "public"."emr_patient_detail" validate constraint "emr_patient_detail_pid_fkey";

alter table "public"."emr_profile" add constraint "emr_profile_auth_id_key" UNIQUE using index "emr_profile_auth_id_key";

alter table "public"."emr_profile" add constraint "emr_profile_authentication_id_fkey" FOREIGN KEY (authentication_id) REFERENCES auth.users(id) not valid;

alter table "public"."emr_profile" validate constraint "emr_profile_authentication_id_fkey";

alter table "public"."emr_profile" add constraint "emr_profile_authentication_id_key" UNIQUE using index "emr_profile_authentication_id_key";

alter table "public"."encounter" add constraint "encounter_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public."Appoinments"(id) not valid;

alter table "public"."encounter" validate constraint "encounter_appointment_id_fkey";

alter table "public"."encounter" add constraint "encounter_intake_id_fkey" FOREIGN KEY (intake_id) REFERENCES public.intake_form(id) not valid;

alter table "public"."encounter" validate constraint "encounter_intake_id_fkey";

alter table "public"."encounter" add constraint "encounter_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.allpatients(id) not valid;

alter table "public"."encounter" validate constraint "encounter_patient_id_fkey";

alter table "public"."fulfillment_requests" add constraint "fk_inventory" FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) ON DELETE CASCADE not valid;

alter table "public"."fulfillment_requests" validate constraint "fk_inventory";

alter table "public"."fulfillment_requests" add constraint "fk_main_order" FOREIGN KEY (main_order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE not valid;

alter table "public"."fulfillment_requests" validate constraint "fk_main_order";

alter table "public"."fulfillment_requests" add constraint "fulfillment_requests_fulfillment_order_id_fkey" FOREIGN KEY (fulfillment_order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE not valid;

alter table "public"."fulfillment_requests" validate constraint "fulfillment_requests_fulfillment_order_id_fkey";

alter table "public"."fulfillment_requests" add constraint "fulfillment_requests_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public."Locations"(id) ON UPDATE CASCADE not valid;

alter table "public"."fulfillment_requests" validate constraint "fulfillment_requests_location_id_fkey";

alter table "public"."fulfillment_requests" add constraint "fulfillment_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'fulfilled'::text, 'cancelled'::text]))) not valid;

alter table "public"."fulfillment_requests" validate constraint "fulfillment_requests_status_check";

alter table "public"."individual_bonus" add constraint "fk_auth_member" FOREIGN KEY (auth_member) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."individual_bonus" validate constraint "fk_auth_member";

alter table "public"."individual_bonus" add constraint "individual_bonus_sales_team_id_fkey" FOREIGN KEY (sales_team_id) REFERENCES public.sales_team(id) ON DELETE SET NULL not valid;

alter table "public"."individual_bonus" validate constraint "individual_bonus_sales_team_id_fkey";

alter table "public"."individual_bonus" add constraint "individual_bonus_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL not valid;

alter table "public"."individual_bonus" validate constraint "individual_bonus_staff_id_fkey";

alter table "public"."individual_bonus" add constraint "individual_bonus_unique" UNIQUE using index "individual_bonus_unique";

alter table "public"."intake_form" add constraint "fk_intake_form_appointment" FOREIGN KEY (appointment_id) REFERENCES public."Appoinments"(id) ON UPDATE CASCADE not valid;

alter table "public"."intake_form" validate constraint "fk_intake_form_appointment";

alter table "public"."intake_form" add constraint "onset_not_future" CHECK ((onset <= CURRENT_DATE)) not valid;

alter table "public"."intake_form" validate constraint "onset_not_future";

alter table "public"."interactions" add constraint "interactions_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL not valid;

alter table "public"."interactions" validate constraint "interactions_patient_id_fkey";

alter table "public"."inventory_testing" add constraint "inventory_testing_inventory_id_key" UNIQUE using index "inventory_testing_inventory_id_key";

alter table "public"."notifications_settings" add constraint "notifications_settings_pid_fkey" FOREIGN KEY (pid) REFERENCES public.pk_profile(auth_id) not valid;

alter table "public"."notifications_settings" validate constraint "notifications_settings_pid_fkey";

alter table "public"."notifications_settings" add constraint "notifications_settings_pid_key" UNIQUE using index "notifications_settings_pid_key";

alter table "public"."nurse" add constraint "nurse_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public."Locations"(id) not valid;

alter table "public"."nurse" validate constraint "nurse_location_id_fkey";

alter table "public"."nurse" add constraint "nurse_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."nurse" validate constraint "nurse_user_id_fkey";

alter table "public"."nursing_documentation" add constraint "nursing_notes_encounter_id_fkey" FOREIGN KEY (encounter_id) REFERENCES public.encounter(id) not valid;

alter table "public"."nursing_documentation" validate constraint "nursing_notes_encounter_id_fkey";

alter table "public"."orders" add constraint "orders_sales_team_id_fkey" FOREIGN KEY (sales_team_id) REFERENCES public.sales_team(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_sales_team_id_fkey";

alter table "public"."patients" add constraint "patients_phone_key" UNIQUE using index "patients_phone_key";

alter table "public"."pk_medication" add constraint "medication_pid_fkey" FOREIGN KEY (pid) REFERENCES public.pk_profile(id) not valid;

alter table "public"."pk_medication" validate constraint "medication_pid_fkey";

alter table "public"."pk_preferences" add constraint "pk_preferences_p_id_fkey" FOREIGN KEY (p_id) REFERENCES public.pk_profile(id) not valid;

alter table "public"."pk_preferences" validate constraint "pk_preferences_p_id_fkey";

alter table "public"."pk_profile" add constraint "PillKoala_Profile_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) not valid;

alter table "public"."pk_profile" validate constraint "PillKoala_Profile_auth_id_fkey";

alter table "public"."pk_profile" add constraint "PillKoala_Profile_auth_id_key" UNIQUE using index "PillKoala_Profile_auth_id_key";

alter table "public"."pk_translation" add constraint "pk_translation_id_key" UNIQUE using index "pk_translation_id_key";

alter table "public"."pre_sales" add constraint "pre_sales_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public."Appoinments"(id) not valid;

alter table "public"."pre_sales" validate constraint "pre_sales_appointment_id_fkey";

alter table "public"."pre_sales" add constraint "pre_sales_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(category_id) not valid;

alter table "public"."pre_sales" validate constraint "pre_sales_category_id_fkey";

alter table "public"."pre_sales" add constraint "pre_sales_encounter_id_fkey" FOREIGN KEY (encounter_id) REFERENCES public.encounter(id) not valid;

alter table "public"."pre_sales" validate constraint "pre_sales_encounter_id_fkey";

alter table "public"."pre_sales" add constraint "pre_sales_inventory_id_fkey" FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) not valid;

alter table "public"."pre_sales" validate constraint "pre_sales_inventory_id_fkey";

alter table "public"."pre_sales" add constraint "pre_sales_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.allpatients(id) not valid;

alter table "public"."pre_sales" validate constraint "pre_sales_patient_id_fkey";

alter table "public"."pre_sales" add constraint "pre_sales_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(product_id) not valid;

alter table "public"."pre_sales" validate constraint "pre_sales_product_id_fkey";

alter table "public"."prescription" add constraint "prescription_encounter_id_fkey" FOREIGN KEY (encounter_id) REFERENCES public.encounter(id) not valid;

alter table "public"."prescription" validate constraint "prescription_encounter_id_fkey";

alter table "public"."prescription" add constraint "prescription_pharmacy_id_fkey" FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacy(id) not valid;

alter table "public"."prescription" validate constraint "prescription_pharmacy_id_fkey";

alter table "public"."sales_team" add constraint "sales_team_auth_member_fkey" FOREIGN KEY (auth_member) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."sales_team" validate constraint "sales_team_auth_member_fkey";

alter table "public"."sales_team" add constraint "sales_team_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public."Locations"(id) ON DELETE CASCADE not valid;

alter table "public"."sales_team" validate constraint "sales_team_location_id_fkey";

alter table "public"."stock_alerts" add constraint "stock_alerts_inventory_id_fkey" FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) not valid;

alter table "public"."stock_alerts" validate constraint "stock_alerts_inventory_id_fkey";

alter table "public"."stock_alerts" add constraint "stock_alerts_priority_check" CHECK ((priority = ANY (ARRAY['Critical'::text, 'Warning'::text, 'Healthy'::text]))) not valid;

alter table "public"."stock_alerts" validate constraint "stock_alerts_priority_check";

alter table "public"."stock_alerts" add constraint "stock_alerts_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(product_id) not valid;

alter table "public"."stock_alerts" validate constraint "stock_alerts_product_id_fkey";

alter table "public"."threshold_history" add constraint "fk_location" FOREIGN KEY (location_id) REFERENCES public."Locations"(id) ON DELETE CASCADE not valid;

alter table "public"."threshold_history" validate constraint "fk_location";

alter table "public"."thresholds" add constraint "thresholds_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(product_id) not valid;

alter table "public"."thresholds" validate constraint "thresholds_product_id_fkey";

alter table "public"."thresholds" add constraint "unique_product_id" UNIQUE using index "unique_product_id";

alter table "public"."transaction_history" add constraint "transaction_history_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(order_id) not valid;

alter table "public"."transaction_history" validate constraint "transaction_history_order_id_fkey";

alter table "public"."transaction_history" add constraint "transaction_history_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.allpatients(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."transaction_history" validate constraint "transaction_history_patient_id_fkey";

alter table "public"."vitals" add constraint "vitals_encounter_id_fkey" FOREIGN KEY (encounter_id) REFERENCES public.encounter(id) not valid;

alter table "public"."vitals" validate constraint "vitals_encounter_id_fkey";

alter table "test_mcm"."patient_appointments" add constraint "patient_appointments_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES test_mcm.doctors(doctor_id) not valid;

alter table "test_mcm"."patient_appointments" validate constraint "patient_appointments_doctor_id_fkey";

alter table "test_mcm"."patient_appointments" add constraint "patient_appointments_service_id_fkey" FOREIGN KEY (service_id) REFERENCES test_mcm.clinical_services(service_id) not valid;

alter table "test_mcm"."patient_appointments" validate constraint "patient_appointments_service_id_fkey";

alter table "public"."feedback" add constraint "feedback_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.allpatients(id) ON DELETE SET NULL not valid;

alter table "public"."feedback" validate constraint "feedback_patient_id_fkey";

alter table "public"."orders" add constraint "orders_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.allpatients(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_patient_id_fkey";

alter table "public"."promocodes" add constraint "promocodes_assign_fkey" FOREIGN KEY (assign) REFERENCES public.allpatients(id) not valid;

alter table "public"."promocodes" validate constraint "promocodes_assign_fkey";

alter table "public"."promousage" add constraint "promousage_patientid_fkey" FOREIGN KEY (patientid) REFERENCES public.allpatients(id) ON DELETE SET NULL not valid;

alter table "public"."promousage" validate constraint "promousage_patientid_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_low_stock_alert_sent(row_id bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE inventory
  SET low_stock_alert_sent = TRUE
  WHERE inventory_id = row_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_low_stock_alert_sent(row_id integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE inventory
  SET low_stock_alert_sent = TRUE
  WHERE inventory_id = row_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_team_bonus_daily()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    b               record;
    t               record;
    team_be         numeric;
    team_weight     numeric;
    team_bonus      numeric;
    run_date        date := CURRENT_DATE;
    loc_id          bigint;  -- Declare a variable for location_id
BEGIN
    --------------------------------------------------------------------
    -- 1. Read today’s bonus rows for all eligible locations
    --------------------------------------------------------------------
    FOR b IN
        SELECT *
        FROM public.bonus
        WHERE date = run_date
          AND bonus_eligibility = TRUE
    LOOP

        ----------------------------------------------------------------
        -- 2. Calculate BE per team for this location and date
        ----------------------------------------------------------------
        FOR t IN
            SELECT
                o.sales_team_id, -- Reference to `sales_team_id` in the orders table
                SUM(s.total_price) AS team_be
            FROM public.sales_history s
            JOIN public.inventory i
              ON s.inventory_id = i.inventory_id
            JOIN public.products p
              ON i.product_id = p.product_id
            JOIN public.orders o
              ON o.order_id = s.order_id
            WHERE s.date_sold::date = run_date
              AND i.location_id = b.location_id
              AND p.bonus_eligible = TRUE
            GROUP BY o.sales_team_id
        LOOP

            team_be := t.team_be;

            ----------------------------------------------------------------
            -- 3. Compute team weightage using bonus.bonus_sales
            ----------------------------------------------------------------
            IF b.bonus_sales > 0 THEN
                team_weight := team_be / b.bonus_sales;
            ELSE
                team_weight := 0;
            END IF;

            ----------------------------------------------------------------
            -- 4. Compute team bonus part
            ----------------------------------------------------------------
            team_bonus := ROUND(b.bonus_amount * team_weight, 2);

            ----------------------------------------------------------------
            -- 5. Fetch the location_id for the sales_team
            -- We fetch the location_id based on the sales_team_id.
            ----------------------------------------------------------------
            SELECT location_id INTO loc_id
            FROM public.sales_team
            WHERE id = t.sales_team_id
            LIMIT 1;

            ----------------------------------------------------------------
            -- 6. Ensure location_id is valid before updating (if it's NULL)
            -- If location_id is NULL, we skip the update to avoid violating the NOT NULL constraint.
            ----------------------------------------------------------------
            IF loc_id IS NOT NULL THEN
                -- 7. UPSERT team bonus into sales_team
                --    Ensures no duplication & safe daily increment
                UPDATE public.sales_team
                SET bonus_amount_overall = COALESCE(bonus_amount_overall, 0) + team_bonus
                WHERE id = t.sales_team_id
                  AND location_id = loc_id;  -- Make sure location_id is valid
            END IF;

        END LOOP;

    END LOOP;

END;
$function$
;

CREATE OR REPLACE FUNCTION public.call_complete_api_on_intake_form()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  api_url TEXT := 'https://your-public-host/api/soap/complete'; -- replace with real URL
  payload JSONB;
  resp RECORD;
BEGIN
  -- Build payload with ALL intake_form fields
  payload := jsonb_build_object(
    'intake_form', jsonb_build_object(
      'id', NEW.id,
      'appointment_id', NEW.appointment_id,
      'patient_id', NEW.patient_id,
      'chief_complaint', NEW.chief_complaint,
      'onset', NEW.onset,
      'duration', NEW.duration,
      'location', NEW.location,
      'severity', NEW.severity,
      'symptoms_description', NEW.symptoms_description,
      'relieving_factors', NEW.relieving_factors,
      'medical_conditions', NEW.medical_conditions,
      'surgeries', NEW.surgeries,
      'allergies', NEW.allergies,
      'current_medications', NEW.current_medications,
      'fh_diabetes', NEW.fh_diabetes,
      'fh_hypertension', NEW.fh_hypertension,
      'fh_cancer', NEW.fh_cancer,
      'fh_heart_disease', NEW.fh_heart_disease,
      'tobacco_use', NEW.tobacco_use,
      'alcohol_use', NEW.alcohol_use,
      'drug_use', NEW.drug_use,
      'occupation', NEW.occupation,
      'blood_pressure', NEW.blood_pressure,
      'heart_rate', NEW.heart_rate,
      'respiratory_rate', NEW.respiratory_rate,
      'temperature', NEW.temperature,
      'oxygen_saturation', NEW.oxygen_saturation,
      'physical_exam', NEW.physical_exam,
      'lab_results', NEW.lab_results,
      'diagnoses', NEW.diagnoses,
      'risk_factors', NEW.risk_factors,
      'additional_findings', NEW.additional_findings,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    )
  );

  -- Call external API
  SELECT status, content, headers
  INTO resp
  FROM http_post(
    api_url,
    payload::text,
    'application/json'
    -- Optional headers:
    -- , jsonb_build_object('Authorization','Bearer YOUR_TOKEN')::text
  );

  -- Log warning but do NOT fail insert
  IF resp.status >= 300 THEN
    RAISE WARNING 'SOAP API call failed (status=%): %', resp.status, resp.content;
  END IF;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error calling SOAP API: %', SQLERRM;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.call_intake_form_edge_function()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  perform
    net.http_post(
      url := 'https://vsvueqtgulaaczqnnh.supabase.co/functions/v1/intake-form-soap-ts',
      headers := jsonb_build_object(
        'Content-Type',
        'application/json'
      ),
      body := row_to_json(NEW)::jsonb
    );

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.distribute_individual_bonus_daily()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    t               record;     
    staff_id_val    bigint;     
    per_member_bonus numeric;   
    member_count     int;
    target_date      date := CURRENT_DATE;  -- ⭐ TODAY'S DATE
BEGIN
    --------------------------------------------------------------------
    -- LOOP OVER EACH TEAM
    --------------------------------------------------------------------
    FOR t IN
        SELECT *
        FROM public.sales_team
    LOOP

        ----------------------------------------------------------------
        -- Skip teams that have no bonus assigned yet
        ----------------------------------------------------------------
        IF t.bonus_amount_overall IS NULL OR t.bonus_amount_overall = 0 THEN
            CONTINUE;
        END IF;

        ----------------------------------------------------------------
        -- CASE 1: members IS NULL → Only auth_member receives full bonus
        ----------------------------------------------------------------
        IF t.members IS NULL OR array_length(t.members, 1) IS NULL THEN
            
            -- If no auth_member, skip this team entirely
            IF t.auth_member IS NULL THEN
                CONTINUE;
            END IF;

            -- team size = 1 (only auth_member)
            member_count := 1;
            per_member_bonus := ROUND(t.bonus_amount_overall / member_count, 2);

            INSERT INTO public.individual_bonus (
                staff_id,
                sales_team_id,
                bonus,
                bonus_date,
                created_at,
                auth_member
            )
            VALUES (
                NULL,
                t.id,
                per_member_bonus,
                target_date,
                NOW(),
                t.auth_member
            )
            ON CONFLICT (staff_id, sales_team_id, bonus_date)
            DO UPDATE SET
                bonus = EXCLUDED.bonus,
                created_at = NOW(),
                auth_member = EXCLUDED.auth_member;

            CONTINUE; -- skip normal member logic
        END IF;

        ----------------------------------------------------------------
        -- CASE 2: members exist → normal logic
        ----------------------------------------------------------------
        member_count := array_length(t.members, 1);

        -- If auth_member exists, count them too
        IF t.auth_member IS NOT NULL THEN
            member_count := member_count + 1;
        END IF;

        IF member_count = 0 THEN
            CONTINUE;
        END IF;

        ----------------------------------------------------------------
        -- Calculate equal bonus for each member
        ----------------------------------------------------------------
        per_member_bonus := ROUND(t.bonus_amount_overall / member_count, 2);

        ----------------------------------------------------------------
        -- Insert/update individual bonus for each normal member
        ----------------------------------------------------------------
        FOREACH staff_id_val IN ARRAY t.members
        LOOP
            INSERT INTO public.individual_bonus (
                staff_id,
                sales_team_id,
                bonus,
                bonus_date,
                created_at,
                auth_member
            )
            VALUES (
                staff_id_val,
                t.id,
                per_member_bonus,
                target_date,
                NOW(),
                NULL
            )
            ON CONFLICT (staff_id, sales_team_id, bonus_date)
            DO UPDATE SET
                bonus = EXCLUDED.bonus,
                created_at = NOW(),
                auth_member = EXCLUDED.auth_member;
        END LOOP;

        ----------------------------------------------------------------
        -- Insert auth_member separately
        ----------------------------------------------------------------
        IF t.auth_member IS NOT NULL THEN
            INSERT INTO public.individual_bonus (
                staff_id,
                sales_team_id,
                bonus,
                bonus_date,
                created_at,
                auth_member
            )
            VALUES (
                NULL,
                t.id,
                per_member_bonus,
                target_date,
                NOW(),
                t.auth_member
            )
            ON CONFLICT (staff_id, sales_team_id, bonus_date)
            DO UPDATE SET
                bonus = EXCLUDED.bonus,
                created_at = NOW(),
                auth_member = EXCLUDED.auth_member;
        END IF;

    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_allpatients_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    existing_id bigint;
BEGIN
    -- Check for existing patient with same email AND phone
    SELECT id
    INTO existing_id
    FROM public.allpatients
    WHERE email = NEW.email
      AND phone = NEW.phone
    LIMIT 1;

    -- If patient exists
    IF existing_id IS NOT NULL THEN
        -- Update lastvisit
        UPDATE public.allpatients
        SET lastvisit = now()
        WHERE id = existing_id;

        -- Cancel the insert
        RETURN NULL;
    END IF;

    -- Otherwise, allow insert
    NEW.lastvisit := COALESCE(NEW.lastvisit, now());
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_allpatients_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
    existingrecord RECORD;
BEGIN
    -- Search for existing patient by email or phone
    SELECT * INTO existingrecord
    FROM allpatients
    WHERE 
      email = NEW.email
      OR
      phone = NEW.phone;
    -- LIMIT 1;

    IF existingrecord IS NOT NULL THEN
        -- If match found, update treatmenttype and lastvisit only
        UPDATE allpatients
        SET
            treatmenttype = NEW.treatmenttype,
            lastvisit = NOW(),
            email = NEW.email,
            phone = NEW.phone
        WHERE id = existingrecord.id;

        -- Skip inserting the new row
        RETURN NULL;
    END IF;

    UPDATE allpatients
    SET
        treatmenttype = NEW.treatmenttype,
        lastvisit = NOW(),
        email = NEW.email,
        phone = NEW.phone
    WHERE id = existingrecord.id;

    -- Skip inserting the new row
    RETURN NULL;

    -- No match found, allow insert to proceed
    -- RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_credit_audit_updates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    -- Assuming NEW.patient_id is already the patient ID
    -- patient_id := NEW.patient_id;

    -- Update existing credit record
    UPDATE credit_audit
    SET 
        balance = NEW.credit_balance,
        updated_at = NOW()
    WHERE patient_id = NEW.patient_id;

    -- If no update occurred, insert new record
    IF NOT FOUND THEN
        INSERT INTO credit_audit (
            patient_id,
            balance,
            created_at,
            updated_at
        ) VALUES (
            NEW.patient_id,
            NEW.credit_balance,
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
END;$function$
;

create type "public"."http_header" as ("field" character varying, "value" character varying);

create type "public"."http_request" as ("method" public.http_method, "uri" character varying, "headers" public.http_header[], "content_type" character varying, "content" character varying);

create type "public"."http_response" as ("status" integer, "content_type" character varying, "headers" public.http_header[], "content" character varying);

CREATE OR REPLACE FUNCTION public.insert_patient_rpc(p_locationid integer, p_lastvisit timestamp without time zone, p_onsite boolean, p_firstname text, p_lastname text, p_gender text, p_email text, p_phone text, p_treatmenttype text, p_note text)
 RETURNS TABLE(id integer, locationid integer, lastvisit timestamp without time zone, onsite boolean, firstname text, lastname text, gender text, email text, phone text, treatmenttype text, note text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    existingrecord allpatients%ROWTYPE;
BEGIN
    -- Find a patient with matching email or phone and same location
    SELECT * INTO existingrecord
    FROM allpatients
    WHERE (allpatients.email = p_email OR allpatients.phone = p_phone)
      AND allpatients.locationid = p_locationid
    LIMIT 1;

    IF FOUND THEN
        -- Update the existing record
        UPDATE allpatients
        SET
            lastvisit = NOW(),
            treatmenttype = p_treatmenttype,
            email = p_email,
            phone = p_phone,
            note = p_note
        WHERE allpatients.id = existingrecord.id
        RETURNING * INTO existingrecord;

        RETURN QUERY SELECT 
            allpatients.id, allpatients.locationid, allpatients.lastvisit, allpatients.onsite,
            allpatients.firstname, allpatients.lastname, allpatients.gender,
            allpatients.email, allpatients.phone, allpatients.treatmenttype, allpatients.note
        FROM allpatients
        WHERE allpatients.id = existingrecord.id;
    ELSE
        -- Insert new record
        INSERT INTO allpatients (
            locationid, lastvisit, onsite, firstname, lastname, gender, email, phone, treatmenttype, note
        ) VALUES (
            p_locationid, NOW(), p_onsite, p_firstname, p_lastname, p_gender, p_email, p_phone, p_treatmenttype, p_note
        )
        RETURNING * INTO existingrecord;

        RETURN QUERY SELECT 
            allpatients.id, allpatients.locationid, allpatients.lastvisit, allpatients.onsite,
            allpatients.firstname, allpatients.lastname, allpatients.gender,
            allpatients.email, allpatients.phone, allpatients.treatmenttype, allpatients.note
        FROM allpatients
        WHERE allpatients.id = existingrecord.id;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notifi_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  perform
    net.http_post(
      url := 'https://vsvueqtgulraaczqnnvh.functions.supabase.co/quick-handler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_user_on_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  perform
    net.http_post(
      url := 'https://vsvueqtgulraaczqnnvh.functions.supabase.co/quick-handler',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_sales_emails()
 RETURNS text
 LANGUAGE plpgsql
AS $function$DECLARE
    email_count INTEGER := 0;
    user_rec RECORD;
    loc_rec RECORD;
    sales_html TEXT;
    email_array JSONB := '[]'::jsonb;
BEGIN
    FOR user_rec IN (
        SELECT DISTINCT p.id AS profile_id, p.email, p.full_name
        FROM profiles p
        JOIN user_permissions up ON p.role_id = up.roles
        WHERE 
            up.permissions = 10
            AND p.email IS NOT NULL
            AND p.active = true
            AND EXISTS (
                SELECT 1 FROM user_locations ul WHERE ul.profile_id = p.id
            )
        LIMIT 100
    ) LOOP
        FOR loc_rec IN (
            SELECT location_id
            FROM user_locations
            WHERE profile_id = user_rec.profile_id
        ) LOOP
            -- Build sales HTML block
            SELECT 
                '<h3>Sales Report for Location ID: ' || loc_rec.location_id || '</h3>' ||
                '<p>Total Sales Amount: $' || COALESCE(s.total_price, 0)::TEXT || '</p>' ||
                '<p>Total Items Sold: ' || COALESCE(s.quantity_sold, 0)::TEXT || '</p>' ||
                '<p>Number of Transactions: ' || COALESCE(s.txn_count, 0)::TEXT || '</p>'
            INTO sales_html
            FROM (
                SELECT 
                    SUM(sh.total_price) AS total_price,
                    SUM(sh.quantity_sold) AS quantity_sold,
                    COUNT(DISTINCT sh.order_id) AS txn_count
                FROM sales_history sh
                JOIN orders o ON o.order_id = sh.order_id
                JOIN allpatients ap ON o.patient_id = ap.id
                WHERE ap.locationid = loc_rec.location_id
            ) s;

            email_array := email_array || jsonb_build_object(
                'to', user_rec.email,
                'subject', 'Sales Report - Location ' || loc_rec.location_id,
                'html', 
                    '<p>Hello ' || user_rec.full_name || ',</p>' ||
                    COALESCE(sales_html, '<p>No sales data available.</p>'),
                'from', 'no-reply@alerts.myclinicmd.com'
            )::jsonb;

            email_count := email_count + 1;
        END LOOP;
    END LOOP;

    IF jsonb_array_length(email_array) > 0 THEN
        PERFORM net.http_post(
            url := 'https://vsvueqtgulraaczqnnvh.supabase.co/functions/v1/send-email',
            headers := jsonb_build_object(
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdnVlcXRndWxyYWFjenFubnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDA0NDk5MywiZXhwIjoyMDE1NjIwOTkzfQ.7dAw7jNNB5_IMFLNN19nCyVIRX35wcyT5cDqPt5K9yU',
                'Content-Type', 'application/json'
            ),
            body := email_array,
            timeout_milliseconds := 20000
        );
    END IF;

    RETURN email_count || ' sales emails sent at ' || CURRENT_TIMESTAMP;
END;$function$
;

CREATE OR REPLACE FUNCTION public.send_sales_emails_permissions_check()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    email_count INTEGER := 0;
    user_rec RECORD;
BEGIN
    FOR user_rec IN (
        SELECT DISTINCT p.email, p.full_name  -- Added DISTINCT to avoid duplicates
        FROM profiles p
        JOIN user_permissions up ON p.role_id = up.roles
        WHERE 
            up.permissions = 10  -- Sales Report permission ID
            AND p.email IS NOT NULL
            AND p.active = true
        LIMIT 100
    ) LOOP
        -- Send email via edge function
        PERFORM net.http_post(
            url := 'https://vsvueqtgulraaczqnnvh.supabase.co/functions/v1/send-email',
            headers := jsonb_build_object(
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdnVlcXRndWxyYWFjenFubnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDA0NDk5MywiZXhwIjoyMDE1NjIwOTkzfQ.7dAw7jNNB5_IMFLNN19nCyVIRX35wcyT5cDqPt5K9yU'
            ),
            body := jsonb_build_object(
                'to', user_rec.email,
                'subject', 'Sales Report - ' || CURRENT_DATE,
                'html', '<p>Hello ' || user_rec.full_name || ', here is your daily sales report.</p>',
                'from', 'no-reply@alerts.myclinicmd.com'
            ),
            timeout_milliseconds := 3000
        );
        email_count := email_count + 1;
        
        -- Optional logging
        RAISE NOTICE 'Sent email to %', user_rec.email;
    END LOOP;
    
    RETURN email_count || ' sales emails sent at ' || CURRENT_TIMESTAMP;
END;$function$
;

CREATE OR REPLACE FUNCTION public.set_new_patient_flag()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    visit_count integer;
BEGIN
    -- If patient_id is NULL, we cannot determine new/old
    IF NEW.patient_id IS NULL THEN
        NEW.new_patient := NULL;
        RETURN NEW;
    END IF;

    -- Count existing appointments for this patient
    SELECT COUNT(*)
    INTO visit_count
    FROM public."Appoinments"
    WHERE patient_id = NEW.patient_id;

    -- If patient already has appointments → old patient
    IF visit_count > 0 THEN
        NEW.new_patient := false;
    ELSE
        -- First appointment → new patient
        NEW.new_patient := true;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_sales_team_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  NEW.auth_member := auth.uid();
  NEW.auth_email := auth.jwt()->>'email';
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_assign_patient_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_patient_id BIGINT;
BEGIN
    -- Look for existing patient (email AND phone)
    SELECT id
    INTO v_patient_id
    FROM allpatients
    WHERE email = NEW.email_address
      AND phone = NEW.phone
    ORDER BY created_at DESC
    LIMIT 1;

    -- If patient exists
    IF v_patient_id IS NOT NULL THEN
        NEW.patient_id := v_patient_id;

    -- If patient does NOT exist
    ELSE
        INSERT INTO allpatients (
            created_at,
            firstname,
            lastname,
            email,
            phone,
            Treatmenttype,
            Gender,
            lastvisit,
            locationid,
            onsite,
            email_opt,
            text_opt
        )
        VALUES (
            now(),
            NEW.first_name,
            NEW.last_name,
            NEW.email_address,
            NEW.phone,
            NEW.service,
            NEW.sex,
            now(),
            NEW.location_id,
            NEW.in_office_patient,
            NEW.email_opt,
            NEW.text_opt
        )
        RETURNING id INTO v_patient_id;

        NEW.patient_id := v_patient_id;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_distribute_individual_bonus()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    staff_id_val bigint;
    per_member_bonus numeric;
    member_count int;
    auth_member_id uuid;
BEGIN
    ----------------------------------------------------------------
    -- VALIDATION: Skip if no bonus or no members
    ----------------------------------------------------------------
    IF NEW.bonus_amount_overall IS NULL OR NEW.bonus_amount_overall = 0 THEN
        RETURN NEW;
    END IF;

    IF NEW.members IS NULL OR array_length(NEW.members, 1) IS NULL THEN
        RETURN NEW;
    END IF;

    ----------------------------------------------------------------
    -- BASE MEMBER COUNT
    ----------------------------------------------------------------
    member_count := array_length(NEW.members, 1);

    ----------------------------------------------------------------
    -- Add auth_member if exists
    ----------------------------------------------------------------
    IF NEW.auth_member IS NOT NULL THEN
        member_count := member_count + 1;
        auth_member_id := NEW.auth_member;
    END IF;

    IF member_count = 0 THEN
        RETURN NEW;
    END IF;

    ----------------------------------------------------------------
    -- Calculate bonus per member
    ----------------------------------------------------------------
    per_member_bonus := ROUND(NEW.bonus_amount_overall / member_count, 2);

    ----------------------------------------------------------------
    -- Insert/update member bonuses
    ----------------------------------------------------------------
    FOREACH staff_id_val IN ARRAY NEW.members LOOP
        INSERT INTO public.individual_bonus (
            staff_id,
            sales_team_id,
            bonus,
            bonus_date,
            created_at,
            auth_member
        )
        VALUES (
            staff_id_val,
            NEW.id,
            per_member_bonus,
            CURRENT_DATE,
            NOW(),
            NULL
        )
        ON CONFLICT (staff_id, sales_team_id, bonus_date)
        DO UPDATE SET
            bonus = EXCLUDED.bonus,
            created_at = NOW(),
            auth_member = EXCLUDED.auth_member;
    END LOOP;

    ----------------------------------------------------------------
    -- Insert auth_member row separately
    ----------------------------------------------------------------
    IF NEW.auth_member IS NOT NULL THEN
        INSERT INTO public.individual_bonus (
            staff_id,
            sales_team_id,
            bonus,
            bonus_date,
            created_at,
            auth_member
        )
        VALUES (
            NULL,
            NEW.id,
            per_member_bonus,
            CURRENT_DATE,
            NOW(),
            NEW.auth_member
        )
        ON CONFLICT (staff_id, sales_team_id, bonus_date)
        DO UPDATE SET
            bonus = EXCLUDED.bonus,
            created_at = NOW(),
            auth_member = EXCLUDED.auth_member;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_bonus_totalsales()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.bonus (
    location_id,
    total_sales,
    bonus_sales,              
    date,
    paid,
    bonus_eligibility,
    bonus_amount,
    bonus_config_history_id
  )
  SELECT
    i.location_id,
    SUM(s.total_price) AS total_sales,

    -- ✅ bonus_sales is zero if threshold not met
    CASE 
      WHEN SUM(s.total_price) >= cfg.bonus_threshold THEN
        SUM(CASE WHEN p.bonus_eligible THEN s.total_price ELSE 0 END)
      ELSE 0
    END AS bonus_sales,         

    CURRENT_DATE AS date,   -- ✅ Automatically uses today's date
    FALSE AS paid,

    -- ✅ Main eligibility flag
    CASE
      WHEN SUM(s.total_price) >= cfg.bonus_threshold THEN TRUE
      ELSE FALSE
    END AS bonus_eligibility,

    -- ✅ Bonus amount depends on threshold
    CASE
      WHEN SUM(s.total_price) >= cfg.bonus_threshold THEN
        CASE
          WHEN cfg.flat_percentage = 'FLAT' THEN cfg.value
          WHEN cfg.flat_percentage = 'PERCENTAGE' THEN SUM(s.total_price) * (cfg.value / 100)
          ELSE 0
        END
      ELSE 0
    END AS bonus_amount,

    cfg.id AS bonus_config_history_id

  FROM public.sales_history s
  JOIN public.inventory i
    ON s.inventory_id = i.inventory_id
  JOIN public.products p
    ON i.product_id = p.product_id
  JOIN public.bonus_config_history cfg
    ON cfg.location_id = i.location_id
   AND cfg.effective_to IS NULL
  WHERE s.date_sold::date = CURRENT_DATE    -- ✅ Filter sales for today
  GROUP BY
    i.location_id,
    cfg.bonus_threshold,
    cfg.flat_percentage,
    cfg.value,
    cfg.id

  ON CONFLICT (location_id, date)
  DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    bonus_sales = EXCLUDED.bonus_sales,        
    bonus_eligibility = EXCLUDED.bonus_eligibility,
    bonus_amount = EXCLUDED.bonus_amount,
    bonus_config_history_id = EXCLUDED.bonus_config_history_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_location_balance_on_credit_limit_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_negative_balance double precision;
BEGIN
    -- 1. Calculate total negative balances for all patients at this location
    SELECT SUM(balance) INTO total_negative_balance
    FROM credit_audit ca
    WHERE balance < 0
      AND patient_id IN (
          SELECT id FROM allpatients WHERE locationid = NEW.id
      );

    -- Default to 0 if null
    total_negative_balance := COALESCE(total_negative_balance, 0);

    -- 2. Check if total exceeds new credit_limit
    IF ABS(total_negative_balance) > NEW.credit_limit THEN
        RAISE EXCEPTION 'Credit exceeds location credit limit. Limit: %, Total negative balance: %',
            NEW.credit_limit, ABS(total_negative_balance);
    END IF;

    -- 3. Update the balance (in the same row that was updated)
    UPDATE "Locations"
    SET 
        balance = NEW.credit_limit + total_negative_balance,
        updated_at = NOW()
    WHERE id = NEW.id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_location_credit_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    loc_id bigint;
    total_negative_balance double precision;
    location_limit double precision;
BEGIN
    -- 1. Get location ID from allpatients using NEW.patient_id
    SELECT locationid INTO loc_id
    FROM allpatients
    WHERE id = NEW.patient_id;

    -- If location not found, exit silently
    IF loc_id IS NULL THEN
        RAISE NOTICE 'No location found for patient_id %', NEW.patient_id;
        RETURN NEW;
    END IF;

    -- 2. Calculate total negative balances for all patients at this location
    SELECT SUM(balance) INTO total_negative_balance
    FROM credit_audit ca
    WHERE balance < 0
      AND patient_id IN (
          SELECT id FROM allpatients WHERE locationid = loc_id
      );

    -- Default to 0 if null
    total_negative_balance := COALESCE(total_negative_balance, 0);

    -- 3. Get credit limit for the location
    SELECT credit_limit INTO location_limit
    FROM "Locations"
    WHERE id = loc_id;

    -- 4. Check if total exceeds limit
    IF ABS(total_negative_balance) > location_limit THEN
        RAISE EXCEPTION 'Credit exceeds location credit limit. Limit: %, Total negative balance: %',
            location_limit, ABS(total_negative_balance);
    END IF;

    -- 5. Update location balance to match total negative credit
    UPDATE "Locations"
    SET 
        balance = location_limit + total_negative_balance,
        updated_at = NOW()
    WHERE id = loc_id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_patient(p_locationid integer, p_lastvisit timestamp without time zone, p_onsite boolean, p_firstname text, p_lastname text, p_gender text, p_email text, p_phone text, p_treatmenttype text, p_note text)
 RETURNS TABLE(id integer, locationid integer, lastvisit timestamp without time zone, onsite boolean, firstname text, lastname text, gender text, email text, phone text, treatmenttype text, note text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    existingrecord allpatients%ROWTYPE;
BEGIN
    -- Find a patient with matching email or phone and same location
    SELECT * INTO existingrecord
    FROM allpatients
    WHERE (email = p_email OR phone = p_phone)
      AND locationid = p_locationid
    LIMIT 1;

    IF FOUND THEN
        -- Update the existing record
        UPDATE allpatients
        SET
            lastvisit = NOW(),
            treatmenttype = p_treatmenttype,
            email = p_email,
            phone = p_phone,
            note = p_note
        WHERE id = existingrecord.id
        RETURNING * INTO existingrecord;

        RETURN QUERY SELECT 
            id, locationid, lastvisit, onsite, firstname, lastname, gender, email, phone, treatmenttype, note
        FROM allpatients
        WHERE id = existingrecord.id;
    ELSE
        -- Insert new record
        INSERT INTO allpatients (
            locationid, lastvisit, onsite, firstname, lastname, gender, email, phone, treatmenttype, note
        ) VALUES (
            p_locationid, NOW(), p_onsite, p_firstname, p_lastname, p_gender, p_email, p_phone, p_treatmenttype, p_note
        )
        RETURNING * INTO existingrecord;

        RETURN QUERY SELECT 
            id, locationid, lastvisit, onsite, firstname, lastname, gender, email, phone, treatmenttype, note
        FROM allpatients
        WHERE id = existingrecord.id;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION test_mcm.get_appointments()
 RETURNS TABLE(appointment_id integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT appointment_id
  FROM test_mcm.patient_appointments
  LIMIT 1;  -- Limiting to 1 for simplicity, you can modify this to fetch more rows if needed
END;
$function$
;

CREATE OR REPLACE FUNCTION test_mcm.get_appointments_by_doctor(p_doctor_id integer)
 RETURNS TABLE(appointment_id integer, patient_name character varying, service_id integer, appointment_date date, appointment_time time without time zone, status character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- The query that will run when the function is called
  RETURN QUERY
  SELECT appointment_id, patient_name, service_id, appointment_date, appointment_time, status
  FROM test_mcm.patient_appointments
  WHERE doctor_id = p_doctor_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    is_unlimited BOOLEAN;
BEGIN
    -- Get the 'unlimited' value from the associated product
    SELECT p.unlimited
    INTO is_unlimited
    FROM inventory i
    JOIN products p ON p.product_id = i.product_id
    WHERE i.inventory_id = NEW.inventory_id;

    -- Only update inventory quantity if 'unlimited' is false
    IF NOT is_unlimited THEN
        UPDATE inventory
        SET quantity = GREATEST(quantity - NEW.quantity_sold, 0)
        WHERE inventory_id = NEW.inventory_id;
    END IF;

    RETURN NEW;
END;
$function$
;

grant delete on table "public"."Rooms" to "anon";

grant insert on table "public"."Rooms" to "anon";

grant references on table "public"."Rooms" to "anon";

grant select on table "public"."Rooms" to "anon";

grant trigger on table "public"."Rooms" to "anon";

grant truncate on table "public"."Rooms" to "anon";

grant update on table "public"."Rooms" to "anon";

grant delete on table "public"."Rooms" to "authenticated";

grant insert on table "public"."Rooms" to "authenticated";

grant references on table "public"."Rooms" to "authenticated";

grant select on table "public"."Rooms" to "authenticated";

grant trigger on table "public"."Rooms" to "authenticated";

grant truncate on table "public"."Rooms" to "authenticated";

grant update on table "public"."Rooms" to "authenticated";

grant delete on table "public"."Rooms" to "service_role";

grant insert on table "public"."Rooms" to "service_role";

grant references on table "public"."Rooms" to "service_role";

grant select on table "public"."Rooms" to "service_role";

grant trigger on table "public"."Rooms" to "service_role";

grant truncate on table "public"."Rooms" to "service_role";

grant update on table "public"."Rooms" to "service_role";

grant delete on table "public"."Transcripts" to "anon";

grant insert on table "public"."Transcripts" to "anon";

grant references on table "public"."Transcripts" to "anon";

grant select on table "public"."Transcripts" to "anon";

grant trigger on table "public"."Transcripts" to "anon";

grant truncate on table "public"."Transcripts" to "anon";

grant update on table "public"."Transcripts" to "anon";

grant delete on table "public"."Transcripts" to "authenticated";

grant insert on table "public"."Transcripts" to "authenticated";

grant references on table "public"."Transcripts" to "authenticated";

grant select on table "public"."Transcripts" to "authenticated";

grant trigger on table "public"."Transcripts" to "authenticated";

grant truncate on table "public"."Transcripts" to "authenticated";

grant update on table "public"."Transcripts" to "authenticated";

grant delete on table "public"."Transcripts" to "service_role";

grant insert on table "public"."Transcripts" to "service_role";

grant references on table "public"."Transcripts" to "service_role";

grant select on table "public"."Transcripts" to "service_role";

grant trigger on table "public"."Transcripts" to "service_role";

grant truncate on table "public"."Transcripts" to "service_role";

grant update on table "public"."Transcripts" to "service_role";

grant delete on table "public"."ai_soapnotes" to "PUBLIC";

grant insert on table "public"."ai_soapnotes" to "PUBLIC";

grant select on table "public"."ai_soapnotes" to "PUBLIC";

grant update on table "public"."ai_soapnotes" to "PUBLIC";

grant delete on table "public"."ai_soapnotes" to "anon";

grant insert on table "public"."ai_soapnotes" to "anon";

grant references on table "public"."ai_soapnotes" to "anon";

grant select on table "public"."ai_soapnotes" to "anon";

grant trigger on table "public"."ai_soapnotes" to "anon";

grant truncate on table "public"."ai_soapnotes" to "anon";

grant update on table "public"."ai_soapnotes" to "anon";

grant delete on table "public"."ai_soapnotes" to "authenticated";

grant insert on table "public"."ai_soapnotes" to "authenticated";

grant references on table "public"."ai_soapnotes" to "authenticated";

grant select on table "public"."ai_soapnotes" to "authenticated";

grant trigger on table "public"."ai_soapnotes" to "authenticated";

grant truncate on table "public"."ai_soapnotes" to "authenticated";

grant update on table "public"."ai_soapnotes" to "authenticated";

grant delete on table "public"."ai_soapnotes" to "service_role";

grant insert on table "public"."ai_soapnotes" to "service_role";

grant references on table "public"."ai_soapnotes" to "service_role";

grant select on table "public"."ai_soapnotes" to "service_role";

grant trigger on table "public"."ai_soapnotes" to "service_role";

grant truncate on table "public"."ai_soapnotes" to "service_role";

grant update on table "public"."ai_soapnotes" to "service_role";

grant delete on table "public"."allservices" to "anon";

grant insert on table "public"."allservices" to "anon";

grant references on table "public"."allservices" to "anon";

grant select on table "public"."allservices" to "anon";

grant trigger on table "public"."allservices" to "anon";

grant truncate on table "public"."allservices" to "anon";

grant update on table "public"."allservices" to "anon";

grant delete on table "public"."allservices" to "authenticated";

grant insert on table "public"."allservices" to "authenticated";

grant references on table "public"."allservices" to "authenticated";

grant select on table "public"."allservices" to "authenticated";

grant trigger on table "public"."allservices" to "authenticated";

grant truncate on table "public"."allservices" to "authenticated";

grant update on table "public"."allservices" to "authenticated";

grant delete on table "public"."allservices" to "service_role";

grant insert on table "public"."allservices" to "service_role";

grant references on table "public"."allservices" to "service_role";

grant select on table "public"."allservices" to "service_role";

grant trigger on table "public"."allservices" to "service_role";

grant truncate on table "public"."allservices" to "service_role";

grant update on table "public"."allservices" to "service_role";

grant delete on table "public"."allservices_es" to "anon";

grant insert on table "public"."allservices_es" to "anon";

grant references on table "public"."allservices_es" to "anon";

grant select on table "public"."allservices_es" to "anon";

grant trigger on table "public"."allservices_es" to "anon";

grant truncate on table "public"."allservices_es" to "anon";

grant update on table "public"."allservices_es" to "anon";

grant delete on table "public"."allservices_es" to "authenticated";

grant insert on table "public"."allservices_es" to "authenticated";

grant references on table "public"."allservices_es" to "authenticated";

grant select on table "public"."allservices_es" to "authenticated";

grant trigger on table "public"."allservices_es" to "authenticated";

grant truncate on table "public"."allservices_es" to "authenticated";

grant update on table "public"."allservices_es" to "authenticated";

grant delete on table "public"."allservices_es" to "service_role";

grant insert on table "public"."allservices_es" to "service_role";

grant references on table "public"."allservices_es" to "service_role";

grant select on table "public"."allservices_es" to "service_role";

grant trigger on table "public"."allservices_es" to "service_role";

grant truncate on table "public"."allservices_es" to "service_role";

grant update on table "public"."allservices_es" to "service_role";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."bonus" to "anon";

grant insert on table "public"."bonus" to "anon";

grant references on table "public"."bonus" to "anon";

grant select on table "public"."bonus" to "anon";

grant trigger on table "public"."bonus" to "anon";

grant truncate on table "public"."bonus" to "anon";

grant update on table "public"."bonus" to "anon";

grant delete on table "public"."bonus" to "authenticated";

grant insert on table "public"."bonus" to "authenticated";

grant references on table "public"."bonus" to "authenticated";

grant select on table "public"."bonus" to "authenticated";

grant trigger on table "public"."bonus" to "authenticated";

grant truncate on table "public"."bonus" to "authenticated";

grant update on table "public"."bonus" to "authenticated";

grant delete on table "public"."bonus" to "service_role";

grant insert on table "public"."bonus" to "service_role";

grant references on table "public"."bonus" to "service_role";

grant select on table "public"."bonus" to "service_role";

grant trigger on table "public"."bonus" to "service_role";

grant truncate on table "public"."bonus" to "service_role";

grant update on table "public"."bonus" to "service_role";

grant delete on table "public"."bonus_config_history" to "anon";

grant insert on table "public"."bonus_config_history" to "anon";

grant references on table "public"."bonus_config_history" to "anon";

grant select on table "public"."bonus_config_history" to "anon";

grant trigger on table "public"."bonus_config_history" to "anon";

grant truncate on table "public"."bonus_config_history" to "anon";

grant update on table "public"."bonus_config_history" to "anon";

grant delete on table "public"."bonus_config_history" to "authenticated";

grant insert on table "public"."bonus_config_history" to "authenticated";

grant references on table "public"."bonus_config_history" to "authenticated";

grant select on table "public"."bonus_config_history" to "authenticated";

grant trigger on table "public"."bonus_config_history" to "authenticated";

grant truncate on table "public"."bonus_config_history" to "authenticated";

grant update on table "public"."bonus_config_history" to "authenticated";

grant delete on table "public"."bonus_config_history" to "service_role";

grant insert on table "public"."bonus_config_history" to "service_role";

grant references on table "public"."bonus_config_history" to "service_role";

grant select on table "public"."bonus_config_history" to "service_role";

grant trigger on table "public"."bonus_config_history" to "service_role";

grant truncate on table "public"."bonus_config_history" to "service_role";

grant update on table "public"."bonus_config_history" to "service_role";

grant delete on table "public"."call_logs" to "anon";

grant insert on table "public"."call_logs" to "anon";

grant references on table "public"."call_logs" to "anon";

grant select on table "public"."call_logs" to "anon";

grant trigger on table "public"."call_logs" to "anon";

grant truncate on table "public"."call_logs" to "anon";

grant update on table "public"."call_logs" to "anon";

grant delete on table "public"."call_logs" to "authenticated";

grant insert on table "public"."call_logs" to "authenticated";

grant references on table "public"."call_logs" to "authenticated";

grant select on table "public"."call_logs" to "authenticated";

grant trigger on table "public"."call_logs" to "authenticated";

grant truncate on table "public"."call_logs" to "authenticated";

grant update on table "public"."call_logs" to "authenticated";

grant delete on table "public"."call_logs" to "service_role";

grant insert on table "public"."call_logs" to "service_role";

grant references on table "public"."call_logs" to "service_role";

grant select on table "public"."call_logs" to "service_role";

grant trigger on table "public"."call_logs" to "service_role";

grant truncate on table "public"."call_logs" to "service_role";

grant update on table "public"."call_logs" to "service_role";

grant delete on table "public"."canned_responses" to "anon";

grant insert on table "public"."canned_responses" to "anon";

grant references on table "public"."canned_responses" to "anon";

grant select on table "public"."canned_responses" to "anon";

grant trigger on table "public"."canned_responses" to "anon";

grant truncate on table "public"."canned_responses" to "anon";

grant update on table "public"."canned_responses" to "anon";

grant delete on table "public"."canned_responses" to "authenticated";

grant insert on table "public"."canned_responses" to "authenticated";

grant references on table "public"."canned_responses" to "authenticated";

grant select on table "public"."canned_responses" to "authenticated";

grant trigger on table "public"."canned_responses" to "authenticated";

grant truncate on table "public"."canned_responses" to "authenticated";

grant update on table "public"."canned_responses" to "authenticated";

grant delete on table "public"."canned_responses" to "service_role";

grant insert on table "public"."canned_responses" to "service_role";

grant references on table "public"."canned_responses" to "service_role";

grant select on table "public"."canned_responses" to "service_role";

grant trigger on table "public"."canned_responses" to "service_role";

grant truncate on table "public"."canned_responses" to "service_role";

grant update on table "public"."canned_responses" to "service_role";

grant delete on table "public"."clinics" to "anon";

grant insert on table "public"."clinics" to "anon";

grant references on table "public"."clinics" to "anon";

grant select on table "public"."clinics" to "anon";

grant trigger on table "public"."clinics" to "anon";

grant truncate on table "public"."clinics" to "anon";

grant update on table "public"."clinics" to "anon";

grant delete on table "public"."clinics" to "authenticated";

grant insert on table "public"."clinics" to "authenticated";

grant references on table "public"."clinics" to "authenticated";

grant select on table "public"."clinics" to "authenticated";

grant trigger on table "public"."clinics" to "authenticated";

grant truncate on table "public"."clinics" to "authenticated";

grant update on table "public"."clinics" to "authenticated";

grant delete on table "public"."clinics" to "service_role";

grant insert on table "public"."clinics" to "service_role";

grant references on table "public"."clinics" to "service_role";

grant select on table "public"."clinics" to "service_role";

grant trigger on table "public"."clinics" to "service_role";

grant truncate on table "public"."clinics" to "service_role";

grant update on table "public"."clinics" to "service_role";

grant delete on table "public"."credit_audit" to "anon";

grant insert on table "public"."credit_audit" to "anon";

grant references on table "public"."credit_audit" to "anon";

grant select on table "public"."credit_audit" to "anon";

grant trigger on table "public"."credit_audit" to "anon";

grant truncate on table "public"."credit_audit" to "anon";

grant update on table "public"."credit_audit" to "anon";

grant delete on table "public"."credit_audit" to "authenticated";

grant insert on table "public"."credit_audit" to "authenticated";

grant references on table "public"."credit_audit" to "authenticated";

grant select on table "public"."credit_audit" to "authenticated";

grant trigger on table "public"."credit_audit" to "authenticated";

grant truncate on table "public"."credit_audit" to "authenticated";

grant update on table "public"."credit_audit" to "authenticated";

grant delete on table "public"."credit_audit" to "service_role";

grant insert on table "public"."credit_audit" to "service_role";

grant references on table "public"."credit_audit" to "service_role";

grant select on table "public"."credit_audit" to "service_role";

grant trigger on table "public"."credit_audit" to "service_role";

grant truncate on table "public"."credit_audit" to "service_role";

grant update on table "public"."credit_audit" to "service_role";

grant delete on table "public"."discounts" to "anon";

grant insert on table "public"."discounts" to "anon";

grant references on table "public"."discounts" to "anon";

grant select on table "public"."discounts" to "anon";

grant trigger on table "public"."discounts" to "anon";

grant truncate on table "public"."discounts" to "anon";

grant update on table "public"."discounts" to "anon";

grant delete on table "public"."discounts" to "authenticated";

grant insert on table "public"."discounts" to "authenticated";

grant references on table "public"."discounts" to "authenticated";

grant select on table "public"."discounts" to "authenticated";

grant trigger on table "public"."discounts" to "authenticated";

grant truncate on table "public"."discounts" to "authenticated";

grant update on table "public"."discounts" to "authenticated";

grant delete on table "public"."discounts" to "service_role";

grant insert on table "public"."discounts" to "service_role";

grant references on table "public"."discounts" to "service_role";

grant select on table "public"."discounts" to "service_role";

grant trigger on table "public"."discounts" to "service_role";

grant truncate on table "public"."discounts" to "service_role";

grant update on table "public"."discounts" to "service_role";

grant delete on table "public"."doctor_soap_notes" to "anon";

grant insert on table "public"."doctor_soap_notes" to "anon";

grant references on table "public"."doctor_soap_notes" to "anon";

grant select on table "public"."doctor_soap_notes" to "anon";

grant trigger on table "public"."doctor_soap_notes" to "anon";

grant truncate on table "public"."doctor_soap_notes" to "anon";

grant update on table "public"."doctor_soap_notes" to "anon";

grant delete on table "public"."doctor_soap_notes" to "authenticated";

grant insert on table "public"."doctor_soap_notes" to "authenticated";

grant references on table "public"."doctor_soap_notes" to "authenticated";

grant select on table "public"."doctor_soap_notes" to "authenticated";

grant trigger on table "public"."doctor_soap_notes" to "authenticated";

grant truncate on table "public"."doctor_soap_notes" to "authenticated";

grant update on table "public"."doctor_soap_notes" to "authenticated";

grant delete on table "public"."doctor_soap_notes" to "service_role";

grant insert on table "public"."doctor_soap_notes" to "service_role";

grant references on table "public"."doctor_soap_notes" to "service_role";

grant select on table "public"."doctor_soap_notes" to "service_role";

grant trigger on table "public"."doctor_soap_notes" to "service_role";

grant truncate on table "public"."doctor_soap_notes" to "service_role";

grant update on table "public"."doctor_soap_notes" to "service_role";

grant delete on table "public"."doctors" to "anon";

grant insert on table "public"."doctors" to "anon";

grant references on table "public"."doctors" to "anon";

grant select on table "public"."doctors" to "anon";

grant trigger on table "public"."doctors" to "anon";

grant truncate on table "public"."doctors" to "anon";

grant update on table "public"."doctors" to "anon";

grant delete on table "public"."doctors" to "authenticated";

grant insert on table "public"."doctors" to "authenticated";

grant references on table "public"."doctors" to "authenticated";

grant select on table "public"."doctors" to "authenticated";

grant trigger on table "public"."doctors" to "authenticated";

grant truncate on table "public"."doctors" to "authenticated";

grant update on table "public"."doctors" to "authenticated";

grant delete on table "public"."doctors" to "service_role";

grant insert on table "public"."doctors" to "service_role";

grant references on table "public"."doctors" to "service_role";

grant select on table "public"."doctors" to "service_role";

grant trigger on table "public"."doctors" to "service_role";

grant truncate on table "public"."doctors" to "service_role";

grant update on table "public"."doctors" to "service_role";

grant delete on table "public"."email_log" to "anon";

grant insert on table "public"."email_log" to "anon";

grant references on table "public"."email_log" to "anon";

grant select on table "public"."email_log" to "anon";

grant trigger on table "public"."email_log" to "anon";

grant truncate on table "public"."email_log" to "anon";

grant update on table "public"."email_log" to "anon";

grant delete on table "public"."email_log" to "authenticated";

grant insert on table "public"."email_log" to "authenticated";

grant references on table "public"."email_log" to "authenticated";

grant select on table "public"."email_log" to "authenticated";

grant trigger on table "public"."email_log" to "authenticated";

grant truncate on table "public"."email_log" to "authenticated";

grant update on table "public"."email_log" to "authenticated";

grant delete on table "public"."email_log" to "service_role";

grant insert on table "public"."email_log" to "service_role";

grant references on table "public"."email_log" to "service_role";

grant select on table "public"."email_log" to "service_role";

grant trigger on table "public"."email_log" to "service_role";

grant truncate on table "public"."email_log" to "service_role";

grant update on table "public"."email_log" to "service_role";

grant delete on table "public"."email_replies" to "anon";

grant insert on table "public"."email_replies" to "anon";

grant references on table "public"."email_replies" to "anon";

grant select on table "public"."email_replies" to "anon";

grant trigger on table "public"."email_replies" to "anon";

grant truncate on table "public"."email_replies" to "anon";

grant update on table "public"."email_replies" to "anon";

grant delete on table "public"."email_replies" to "authenticated";

grant insert on table "public"."email_replies" to "authenticated";

grant references on table "public"."email_replies" to "authenticated";

grant select on table "public"."email_replies" to "authenticated";

grant trigger on table "public"."email_replies" to "authenticated";

grant truncate on table "public"."email_replies" to "authenticated";

grant update on table "public"."email_replies" to "authenticated";

grant delete on table "public"."email_replies" to "service_role";

grant insert on table "public"."email_replies" to "service_role";

grant references on table "public"."email_replies" to "service_role";

grant select on table "public"."email_replies" to "service_role";

grant trigger on table "public"."email_replies" to "service_role";

grant truncate on table "public"."email_replies" to "service_role";

grant update on table "public"."email_replies" to "service_role";

grant delete on table "public"."email_templates" to "anon";

grant insert on table "public"."email_templates" to "anon";

grant references on table "public"."email_templates" to "anon";

grant select on table "public"."email_templates" to "anon";

grant trigger on table "public"."email_templates" to "anon";

grant truncate on table "public"."email_templates" to "anon";

grant update on table "public"."email_templates" to "anon";

grant delete on table "public"."email_templates" to "authenticated";

grant insert on table "public"."email_templates" to "authenticated";

grant references on table "public"."email_templates" to "authenticated";

grant select on table "public"."email_templates" to "authenticated";

grant trigger on table "public"."email_templates" to "authenticated";

grant truncate on table "public"."email_templates" to "authenticated";

grant update on table "public"."email_templates" to "authenticated";

grant delete on table "public"."email_templates" to "service_role";

grant insert on table "public"."email_templates" to "service_role";

grant references on table "public"."email_templates" to "service_role";

grant select on table "public"."email_templates" to "service_role";

grant trigger on table "public"."email_templates" to "service_role";

grant truncate on table "public"."email_templates" to "service_role";

grant update on table "public"."email_templates" to "service_role";

grant delete on table "public"."emr_patient_detail" to "anon";

grant insert on table "public"."emr_patient_detail" to "anon";

grant references on table "public"."emr_patient_detail" to "anon";

grant select on table "public"."emr_patient_detail" to "anon";

grant trigger on table "public"."emr_patient_detail" to "anon";

grant truncate on table "public"."emr_patient_detail" to "anon";

grant update on table "public"."emr_patient_detail" to "anon";

grant delete on table "public"."emr_patient_detail" to "authenticated";

grant insert on table "public"."emr_patient_detail" to "authenticated";

grant references on table "public"."emr_patient_detail" to "authenticated";

grant select on table "public"."emr_patient_detail" to "authenticated";

grant trigger on table "public"."emr_patient_detail" to "authenticated";

grant truncate on table "public"."emr_patient_detail" to "authenticated";

grant update on table "public"."emr_patient_detail" to "authenticated";

grant delete on table "public"."emr_patient_detail" to "service_role";

grant insert on table "public"."emr_patient_detail" to "service_role";

grant references on table "public"."emr_patient_detail" to "service_role";

grant select on table "public"."emr_patient_detail" to "service_role";

grant trigger on table "public"."emr_patient_detail" to "service_role";

grant truncate on table "public"."emr_patient_detail" to "service_role";

grant update on table "public"."emr_patient_detail" to "service_role";

grant delete on table "public"."emr_profile" to "anon";

grant insert on table "public"."emr_profile" to "anon";

grant references on table "public"."emr_profile" to "anon";

grant select on table "public"."emr_profile" to "anon";

grant trigger on table "public"."emr_profile" to "anon";

grant truncate on table "public"."emr_profile" to "anon";

grant update on table "public"."emr_profile" to "anon";

grant delete on table "public"."emr_profile" to "authenticated";

grant insert on table "public"."emr_profile" to "authenticated";

grant references on table "public"."emr_profile" to "authenticated";

grant select on table "public"."emr_profile" to "authenticated";

grant trigger on table "public"."emr_profile" to "authenticated";

grant truncate on table "public"."emr_profile" to "authenticated";

grant update on table "public"."emr_profile" to "authenticated";

grant delete on table "public"."emr_profile" to "service_role";

grant insert on table "public"."emr_profile" to "service_role";

grant references on table "public"."emr_profile" to "service_role";

grant select on table "public"."emr_profile" to "service_role";

grant trigger on table "public"."emr_profile" to "service_role";

grant truncate on table "public"."emr_profile" to "service_role";

grant update on table "public"."emr_profile" to "service_role";

grant delete on table "public"."encounter" to "anon";

grant insert on table "public"."encounter" to "anon";

grant references on table "public"."encounter" to "anon";

grant select on table "public"."encounter" to "anon";

grant trigger on table "public"."encounter" to "anon";

grant truncate on table "public"."encounter" to "anon";

grant update on table "public"."encounter" to "anon";

grant delete on table "public"."encounter" to "authenticated";

grant insert on table "public"."encounter" to "authenticated";

grant references on table "public"."encounter" to "authenticated";

grant select on table "public"."encounter" to "authenticated";

grant trigger on table "public"."encounter" to "authenticated";

grant truncate on table "public"."encounter" to "authenticated";

grant update on table "public"."encounter" to "authenticated";

grant delete on table "public"."encounter" to "service_role";

grant insert on table "public"."encounter" to "service_role";

grant references on table "public"."encounter" to "service_role";

grant select on table "public"."encounter" to "service_role";

grant trigger on table "public"."encounter" to "service_role";

grant truncate on table "public"."encounter" to "service_role";

grant update on table "public"."encounter" to "service_role";

grant delete on table "public"."faqs" to "anon";

grant insert on table "public"."faqs" to "anon";

grant references on table "public"."faqs" to "anon";

grant select on table "public"."faqs" to "anon";

grant trigger on table "public"."faqs" to "anon";

grant truncate on table "public"."faqs" to "anon";

grant update on table "public"."faqs" to "anon";

grant delete on table "public"."faqs" to "authenticated";

grant insert on table "public"."faqs" to "authenticated";

grant references on table "public"."faqs" to "authenticated";

grant select on table "public"."faqs" to "authenticated";

grant trigger on table "public"."faqs" to "authenticated";

grant truncate on table "public"."faqs" to "authenticated";

grant update on table "public"."faqs" to "authenticated";

grant delete on table "public"."faqs" to "service_role";

grant insert on table "public"."faqs" to "service_role";

grant references on table "public"."faqs" to "service_role";

grant select on table "public"."faqs" to "service_role";

grant trigger on table "public"."faqs" to "service_role";

grant truncate on table "public"."faqs" to "service_role";

grant update on table "public"."faqs" to "service_role";

grant delete on table "public"."features" to "anon";

grant insert on table "public"."features" to "anon";

grant references on table "public"."features" to "anon";

grant select on table "public"."features" to "anon";

grant trigger on table "public"."features" to "anon";

grant truncate on table "public"."features" to "anon";

grant update on table "public"."features" to "anon";

grant delete on table "public"."features" to "authenticated";

grant insert on table "public"."features" to "authenticated";

grant references on table "public"."features" to "authenticated";

grant select on table "public"."features" to "authenticated";

grant trigger on table "public"."features" to "authenticated";

grant truncate on table "public"."features" to "authenticated";

grant update on table "public"."features" to "authenticated";

grant delete on table "public"."features" to "service_role";

grant insert on table "public"."features" to "service_role";

grant references on table "public"."features" to "service_role";

grant select on table "public"."features" to "service_role";

grant trigger on table "public"."features" to "service_role";

grant truncate on table "public"."features" to "service_role";

grant update on table "public"."features" to "service_role";

grant delete on table "public"."features_es" to "anon";

grant insert on table "public"."features_es" to "anon";

grant references on table "public"."features_es" to "anon";

grant select on table "public"."features_es" to "anon";

grant trigger on table "public"."features_es" to "anon";

grant truncate on table "public"."features_es" to "anon";

grant update on table "public"."features_es" to "anon";

grant delete on table "public"."features_es" to "authenticated";

grant insert on table "public"."features_es" to "authenticated";

grant references on table "public"."features_es" to "authenticated";

grant select on table "public"."features_es" to "authenticated";

grant trigger on table "public"."features_es" to "authenticated";

grant truncate on table "public"."features_es" to "authenticated";

grant update on table "public"."features_es" to "authenticated";

grant delete on table "public"."features_es" to "service_role";

grant insert on table "public"."features_es" to "service_role";

grant references on table "public"."features_es" to "service_role";

grant select on table "public"."features_es" to "service_role";

grant trigger on table "public"."features_es" to "service_role";

grant truncate on table "public"."features_es" to "service_role";

grant update on table "public"."features_es" to "service_role";

grant delete on table "public"."fulfillment_requests" to "anon";

grant insert on table "public"."fulfillment_requests" to "anon";

grant references on table "public"."fulfillment_requests" to "anon";

grant select on table "public"."fulfillment_requests" to "anon";

grant trigger on table "public"."fulfillment_requests" to "anon";

grant truncate on table "public"."fulfillment_requests" to "anon";

grant update on table "public"."fulfillment_requests" to "anon";

grant delete on table "public"."fulfillment_requests" to "authenticated";

grant insert on table "public"."fulfillment_requests" to "authenticated";

grant references on table "public"."fulfillment_requests" to "authenticated";

grant select on table "public"."fulfillment_requests" to "authenticated";

grant trigger on table "public"."fulfillment_requests" to "authenticated";

grant truncate on table "public"."fulfillment_requests" to "authenticated";

grant update on table "public"."fulfillment_requests" to "authenticated";

grant delete on table "public"."fulfillment_requests" to "service_role";

grant insert on table "public"."fulfillment_requests" to "service_role";

grant references on table "public"."fulfillment_requests" to "service_role";

grant select on table "public"."fulfillment_requests" to "service_role";

grant trigger on table "public"."fulfillment_requests" to "service_role";

grant truncate on table "public"."fulfillment_requests" to "service_role";

grant update on table "public"."fulfillment_requests" to "service_role";

grant delete on table "public"."individual_bonus" to "anon";

grant insert on table "public"."individual_bonus" to "anon";

grant references on table "public"."individual_bonus" to "anon";

grant select on table "public"."individual_bonus" to "anon";

grant trigger on table "public"."individual_bonus" to "anon";

grant truncate on table "public"."individual_bonus" to "anon";

grant update on table "public"."individual_bonus" to "anon";

grant delete on table "public"."individual_bonus" to "authenticated";

grant insert on table "public"."individual_bonus" to "authenticated";

grant references on table "public"."individual_bonus" to "authenticated";

grant select on table "public"."individual_bonus" to "authenticated";

grant trigger on table "public"."individual_bonus" to "authenticated";

grant truncate on table "public"."individual_bonus" to "authenticated";

grant update on table "public"."individual_bonus" to "authenticated";

grant delete on table "public"."individual_bonus" to "service_role";

grant insert on table "public"."individual_bonus" to "service_role";

grant references on table "public"."individual_bonus" to "service_role";

grant select on table "public"."individual_bonus" to "service_role";

grant trigger on table "public"."individual_bonus" to "service_role";

grant truncate on table "public"."individual_bonus" to "service_role";

grant update on table "public"."individual_bonus" to "service_role";

grant delete on table "public"."intake_form" to "PUBLIC";

grant insert on table "public"."intake_form" to "PUBLIC";

grant select on table "public"."intake_form" to "PUBLIC";

grant update on table "public"."intake_form" to "PUBLIC";

grant delete on table "public"."intake_form" to "anon";

grant insert on table "public"."intake_form" to "anon";

grant references on table "public"."intake_form" to "anon";

grant select on table "public"."intake_form" to "anon";

grant trigger on table "public"."intake_form" to "anon";

grant truncate on table "public"."intake_form" to "anon";

grant update on table "public"."intake_form" to "anon";

grant delete on table "public"."intake_form" to "authenticated";

grant insert on table "public"."intake_form" to "authenticated";

grant references on table "public"."intake_form" to "authenticated";

grant select on table "public"."intake_form" to "authenticated";

grant trigger on table "public"."intake_form" to "authenticated";

grant truncate on table "public"."intake_form" to "authenticated";

grant update on table "public"."intake_form" to "authenticated";

grant delete on table "public"."intake_form" to "service_role";

grant insert on table "public"."intake_form" to "service_role";

grant references on table "public"."intake_form" to "service_role";

grant select on table "public"."intake_form" to "service_role";

grant trigger on table "public"."intake_form" to "service_role";

grant truncate on table "public"."intake_form" to "service_role";

grant update on table "public"."intake_form" to "service_role";

grant delete on table "public"."interactions" to "anon";

grant insert on table "public"."interactions" to "anon";

grant references on table "public"."interactions" to "anon";

grant select on table "public"."interactions" to "anon";

grant trigger on table "public"."interactions" to "anon";

grant truncate on table "public"."interactions" to "anon";

grant update on table "public"."interactions" to "anon";

grant delete on table "public"."interactions" to "authenticated";

grant insert on table "public"."interactions" to "authenticated";

grant references on table "public"."interactions" to "authenticated";

grant select on table "public"."interactions" to "authenticated";

grant trigger on table "public"."interactions" to "authenticated";

grant truncate on table "public"."interactions" to "authenticated";

grant update on table "public"."interactions" to "authenticated";

grant delete on table "public"."interactions" to "service_role";

grant insert on table "public"."interactions" to "service_role";

grant references on table "public"."interactions" to "service_role";

grant select on table "public"."interactions" to "service_role";

grant trigger on table "public"."interactions" to "service_role";

grant truncate on table "public"."interactions" to "service_role";

grant update on table "public"."interactions" to "service_role";

grant delete on table "public"."inventory_testing" to "anon";

grant insert on table "public"."inventory_testing" to "anon";

grant references on table "public"."inventory_testing" to "anon";

grant select on table "public"."inventory_testing" to "anon";

grant trigger on table "public"."inventory_testing" to "anon";

grant truncate on table "public"."inventory_testing" to "anon";

grant update on table "public"."inventory_testing" to "anon";

grant delete on table "public"."inventory_testing" to "authenticated";

grant insert on table "public"."inventory_testing" to "authenticated";

grant references on table "public"."inventory_testing" to "authenticated";

grant select on table "public"."inventory_testing" to "authenticated";

grant trigger on table "public"."inventory_testing" to "authenticated";

grant truncate on table "public"."inventory_testing" to "authenticated";

grant update on table "public"."inventory_testing" to "authenticated";

grant delete on table "public"."inventory_testing" to "service_role";

grant insert on table "public"."inventory_testing" to "service_role";

grant references on table "public"."inventory_testing" to "service_role";

grant select on table "public"."inventory_testing" to "service_role";

grant trigger on table "public"."inventory_testing" to "service_role";

grant truncate on table "public"."inventory_testing" to "service_role";

grant update on table "public"."inventory_testing" to "service_role";

grant delete on table "public"."meeting" to "anon";

grant insert on table "public"."meeting" to "anon";

grant references on table "public"."meeting" to "anon";

grant select on table "public"."meeting" to "anon";

grant trigger on table "public"."meeting" to "anon";

grant truncate on table "public"."meeting" to "anon";

grant update on table "public"."meeting" to "anon";

grant delete on table "public"."meeting" to "authenticated";

grant insert on table "public"."meeting" to "authenticated";

grant references on table "public"."meeting" to "authenticated";

grant select on table "public"."meeting" to "authenticated";

grant trigger on table "public"."meeting" to "authenticated";

grant truncate on table "public"."meeting" to "authenticated";

grant update on table "public"."meeting" to "authenticated";

grant delete on table "public"."meeting" to "service_role";

grant insert on table "public"."meeting" to "service_role";

grant references on table "public"."meeting" to "service_role";

grant select on table "public"."meeting" to "service_role";

grant trigger on table "public"."meeting" to "service_role";

grant truncate on table "public"."meeting" to "service_role";

grant update on table "public"."meeting" to "service_role";

grant delete on table "public"."notifications_settings" to "anon";

grant insert on table "public"."notifications_settings" to "anon";

grant references on table "public"."notifications_settings" to "anon";

grant select on table "public"."notifications_settings" to "anon";

grant trigger on table "public"."notifications_settings" to "anon";

grant truncate on table "public"."notifications_settings" to "anon";

grant update on table "public"."notifications_settings" to "anon";

grant delete on table "public"."notifications_settings" to "authenticated";

grant insert on table "public"."notifications_settings" to "authenticated";

grant references on table "public"."notifications_settings" to "authenticated";

grant select on table "public"."notifications_settings" to "authenticated";

grant trigger on table "public"."notifications_settings" to "authenticated";

grant truncate on table "public"."notifications_settings" to "authenticated";

grant update on table "public"."notifications_settings" to "authenticated";

grant delete on table "public"."notifications_settings" to "service_role";

grant insert on table "public"."notifications_settings" to "service_role";

grant references on table "public"."notifications_settings" to "service_role";

grant select on table "public"."notifications_settings" to "service_role";

grant trigger on table "public"."notifications_settings" to "service_role";

grant truncate on table "public"."notifications_settings" to "service_role";

grant update on table "public"."notifications_settings" to "service_role";

grant delete on table "public"."nurse" to "anon";

grant insert on table "public"."nurse" to "anon";

grant references on table "public"."nurse" to "anon";

grant select on table "public"."nurse" to "anon";

grant trigger on table "public"."nurse" to "anon";

grant truncate on table "public"."nurse" to "anon";

grant update on table "public"."nurse" to "anon";

grant delete on table "public"."nurse" to "authenticated";

grant insert on table "public"."nurse" to "authenticated";

grant references on table "public"."nurse" to "authenticated";

grant select on table "public"."nurse" to "authenticated";

grant trigger on table "public"."nurse" to "authenticated";

grant truncate on table "public"."nurse" to "authenticated";

grant update on table "public"."nurse" to "authenticated";

grant delete on table "public"."nurse" to "service_role";

grant insert on table "public"."nurse" to "service_role";

grant references on table "public"."nurse" to "service_role";

grant select on table "public"."nurse" to "service_role";

grant trigger on table "public"."nurse" to "service_role";

grant truncate on table "public"."nurse" to "service_role";

grant update on table "public"."nurse" to "service_role";

grant delete on table "public"."nursing_documentation" to "anon";

grant insert on table "public"."nursing_documentation" to "anon";

grant references on table "public"."nursing_documentation" to "anon";

grant select on table "public"."nursing_documentation" to "anon";

grant trigger on table "public"."nursing_documentation" to "anon";

grant truncate on table "public"."nursing_documentation" to "anon";

grant update on table "public"."nursing_documentation" to "anon";

grant delete on table "public"."nursing_documentation" to "authenticated";

grant insert on table "public"."nursing_documentation" to "authenticated";

grant references on table "public"."nursing_documentation" to "authenticated";

grant select on table "public"."nursing_documentation" to "authenticated";

grant trigger on table "public"."nursing_documentation" to "authenticated";

grant truncate on table "public"."nursing_documentation" to "authenticated";

grant update on table "public"."nursing_documentation" to "authenticated";

grant delete on table "public"."nursing_documentation" to "service_role";

grant insert on table "public"."nursing_documentation" to "service_role";

grant references on table "public"."nursing_documentation" to "service_role";

grant select on table "public"."nursing_documentation" to "service_role";

grant trigger on table "public"."nursing_documentation" to "service_role";

grant truncate on table "public"."nursing_documentation" to "service_role";

grant update on table "public"."nursing_documentation" to "service_role";

grant delete on table "public"."patients" to "anon";

grant insert on table "public"."patients" to "anon";

grant references on table "public"."patients" to "anon";

grant select on table "public"."patients" to "anon";

grant trigger on table "public"."patients" to "anon";

grant truncate on table "public"."patients" to "anon";

grant update on table "public"."patients" to "anon";

grant delete on table "public"."patients" to "authenticated";

grant insert on table "public"."patients" to "authenticated";

grant references on table "public"."patients" to "authenticated";

grant select on table "public"."patients" to "authenticated";

grant trigger on table "public"."patients" to "authenticated";

grant truncate on table "public"."patients" to "authenticated";

grant update on table "public"."patients" to "authenticated";

grant delete on table "public"."patients" to "service_role";

grant insert on table "public"."patients" to "service_role";

grant references on table "public"."patients" to "service_role";

grant select on table "public"."patients" to "service_role";

grant trigger on table "public"."patients" to "service_role";

grant truncate on table "public"."patients" to "service_role";

grant update on table "public"."patients" to "service_role";

grant delete on table "public"."pharmacy" to "anon";

grant insert on table "public"."pharmacy" to "anon";

grant references on table "public"."pharmacy" to "anon";

grant select on table "public"."pharmacy" to "anon";

grant trigger on table "public"."pharmacy" to "anon";

grant truncate on table "public"."pharmacy" to "anon";

grant update on table "public"."pharmacy" to "anon";

grant delete on table "public"."pharmacy" to "authenticated";

grant insert on table "public"."pharmacy" to "authenticated";

grant references on table "public"."pharmacy" to "authenticated";

grant select on table "public"."pharmacy" to "authenticated";

grant trigger on table "public"."pharmacy" to "authenticated";

grant truncate on table "public"."pharmacy" to "authenticated";

grant update on table "public"."pharmacy" to "authenticated";

grant delete on table "public"."pharmacy" to "service_role";

grant insert on table "public"."pharmacy" to "service_role";

grant references on table "public"."pharmacy" to "service_role";

grant select on table "public"."pharmacy" to "service_role";

grant trigger on table "public"."pharmacy" to "service_role";

grant truncate on table "public"."pharmacy" to "service_role";

grant update on table "public"."pharmacy" to "service_role";

grant delete on table "public"."pk_caregiver" to "anon";

grant insert on table "public"."pk_caregiver" to "anon";

grant references on table "public"."pk_caregiver" to "anon";

grant select on table "public"."pk_caregiver" to "anon";

grant trigger on table "public"."pk_caregiver" to "anon";

grant truncate on table "public"."pk_caregiver" to "anon";

grant update on table "public"."pk_caregiver" to "anon";

grant delete on table "public"."pk_caregiver" to "authenticated";

grant insert on table "public"."pk_caregiver" to "authenticated";

grant references on table "public"."pk_caregiver" to "authenticated";

grant select on table "public"."pk_caregiver" to "authenticated";

grant trigger on table "public"."pk_caregiver" to "authenticated";

grant truncate on table "public"."pk_caregiver" to "authenticated";

grant update on table "public"."pk_caregiver" to "authenticated";

grant delete on table "public"."pk_caregiver" to "service_role";

grant insert on table "public"."pk_caregiver" to "service_role";

grant references on table "public"."pk_caregiver" to "service_role";

grant select on table "public"."pk_caregiver" to "service_role";

grant trigger on table "public"."pk_caregiver" to "service_role";

grant truncate on table "public"."pk_caregiver" to "service_role";

grant update on table "public"."pk_caregiver" to "service_role";

grant delete on table "public"."pk_emergency_contact" to "anon";

grant insert on table "public"."pk_emergency_contact" to "anon";

grant references on table "public"."pk_emergency_contact" to "anon";

grant select on table "public"."pk_emergency_contact" to "anon";

grant trigger on table "public"."pk_emergency_contact" to "anon";

grant truncate on table "public"."pk_emergency_contact" to "anon";

grant update on table "public"."pk_emergency_contact" to "anon";

grant delete on table "public"."pk_emergency_contact" to "authenticated";

grant insert on table "public"."pk_emergency_contact" to "authenticated";

grant references on table "public"."pk_emergency_contact" to "authenticated";

grant select on table "public"."pk_emergency_contact" to "authenticated";

grant trigger on table "public"."pk_emergency_contact" to "authenticated";

grant truncate on table "public"."pk_emergency_contact" to "authenticated";

grant update on table "public"."pk_emergency_contact" to "authenticated";

grant delete on table "public"."pk_emergency_contact" to "service_role";

grant insert on table "public"."pk_emergency_contact" to "service_role";

grant references on table "public"."pk_emergency_contact" to "service_role";

grant select on table "public"."pk_emergency_contact" to "service_role";

grant trigger on table "public"."pk_emergency_contact" to "service_role";

grant truncate on table "public"."pk_emergency_contact" to "service_role";

grant update on table "public"."pk_emergency_contact" to "service_role";

grant delete on table "public"."pk_health_care_information" to "anon";

grant insert on table "public"."pk_health_care_information" to "anon";

grant references on table "public"."pk_health_care_information" to "anon";

grant select on table "public"."pk_health_care_information" to "anon";

grant trigger on table "public"."pk_health_care_information" to "anon";

grant truncate on table "public"."pk_health_care_information" to "anon";

grant update on table "public"."pk_health_care_information" to "anon";

grant delete on table "public"."pk_health_care_information" to "authenticated";

grant insert on table "public"."pk_health_care_information" to "authenticated";

grant references on table "public"."pk_health_care_information" to "authenticated";

grant select on table "public"."pk_health_care_information" to "authenticated";

grant trigger on table "public"."pk_health_care_information" to "authenticated";

grant truncate on table "public"."pk_health_care_information" to "authenticated";

grant update on table "public"."pk_health_care_information" to "authenticated";

grant delete on table "public"."pk_health_care_information" to "service_role";

grant insert on table "public"."pk_health_care_information" to "service_role";

grant references on table "public"."pk_health_care_information" to "service_role";

grant select on table "public"."pk_health_care_information" to "service_role";

grant trigger on table "public"."pk_health_care_information" to "service_role";

grant truncate on table "public"."pk_health_care_information" to "service_role";

grant update on table "public"."pk_health_care_information" to "service_role";

grant delete on table "public"."pk_medication" to "anon";

grant insert on table "public"."pk_medication" to "anon";

grant references on table "public"."pk_medication" to "anon";

grant select on table "public"."pk_medication" to "anon";

grant trigger on table "public"."pk_medication" to "anon";

grant truncate on table "public"."pk_medication" to "anon";

grant update on table "public"."pk_medication" to "anon";

grant delete on table "public"."pk_medication" to "authenticated";

grant insert on table "public"."pk_medication" to "authenticated";

grant references on table "public"."pk_medication" to "authenticated";

grant select on table "public"."pk_medication" to "authenticated";

grant trigger on table "public"."pk_medication" to "authenticated";

grant truncate on table "public"."pk_medication" to "authenticated";

grant update on table "public"."pk_medication" to "authenticated";

grant delete on table "public"."pk_medication" to "service_role";

grant insert on table "public"."pk_medication" to "service_role";

grant references on table "public"."pk_medication" to "service_role";

grant select on table "public"."pk_medication" to "service_role";

grant trigger on table "public"."pk_medication" to "service_role";

grant truncate on table "public"."pk_medication" to "service_role";

grant update on table "public"."pk_medication" to "service_role";

grant delete on table "public"."pk_preferences" to "anon";

grant insert on table "public"."pk_preferences" to "anon";

grant references on table "public"."pk_preferences" to "anon";

grant select on table "public"."pk_preferences" to "anon";

grant trigger on table "public"."pk_preferences" to "anon";

grant truncate on table "public"."pk_preferences" to "anon";

grant update on table "public"."pk_preferences" to "anon";

grant delete on table "public"."pk_preferences" to "authenticated";

grant insert on table "public"."pk_preferences" to "authenticated";

grant references on table "public"."pk_preferences" to "authenticated";

grant select on table "public"."pk_preferences" to "authenticated";

grant trigger on table "public"."pk_preferences" to "authenticated";

grant truncate on table "public"."pk_preferences" to "authenticated";

grant update on table "public"."pk_preferences" to "authenticated";

grant delete on table "public"."pk_preferences" to "service_role";

grant insert on table "public"."pk_preferences" to "service_role";

grant references on table "public"."pk_preferences" to "service_role";

grant select on table "public"."pk_preferences" to "service_role";

grant trigger on table "public"."pk_preferences" to "service_role";

grant truncate on table "public"."pk_preferences" to "service_role";

grant update on table "public"."pk_preferences" to "service_role";

grant delete on table "public"."pk_profile" to "anon";

grant insert on table "public"."pk_profile" to "anon";

grant references on table "public"."pk_profile" to "anon";

grant select on table "public"."pk_profile" to "anon";

grant trigger on table "public"."pk_profile" to "anon";

grant truncate on table "public"."pk_profile" to "anon";

grant update on table "public"."pk_profile" to "anon";

grant delete on table "public"."pk_profile" to "authenticated";

grant insert on table "public"."pk_profile" to "authenticated";

grant references on table "public"."pk_profile" to "authenticated";

grant select on table "public"."pk_profile" to "authenticated";

grant trigger on table "public"."pk_profile" to "authenticated";

grant truncate on table "public"."pk_profile" to "authenticated";

grant update on table "public"."pk_profile" to "authenticated";

grant delete on table "public"."pk_profile" to "service_role";

grant insert on table "public"."pk_profile" to "service_role";

grant references on table "public"."pk_profile" to "service_role";

grant select on table "public"."pk_profile" to "service_role";

grant trigger on table "public"."pk_profile" to "service_role";

grant truncate on table "public"."pk_profile" to "service_role";

grant update on table "public"."pk_profile" to "service_role";

grant delete on table "public"."pk_translation" to "anon";

grant insert on table "public"."pk_translation" to "anon";

grant references on table "public"."pk_translation" to "anon";

grant select on table "public"."pk_translation" to "anon";

grant trigger on table "public"."pk_translation" to "anon";

grant truncate on table "public"."pk_translation" to "anon";

grant update on table "public"."pk_translation" to "anon";

grant delete on table "public"."pk_translation" to "authenticated";

grant insert on table "public"."pk_translation" to "authenticated";

grant references on table "public"."pk_translation" to "authenticated";

grant select on table "public"."pk_translation" to "authenticated";

grant trigger on table "public"."pk_translation" to "authenticated";

grant truncate on table "public"."pk_translation" to "authenticated";

grant update on table "public"."pk_translation" to "authenticated";

grant delete on table "public"."pk_translation" to "service_role";

grant insert on table "public"."pk_translation" to "service_role";

grant references on table "public"."pk_translation" to "service_role";

grant select on table "public"."pk_translation" to "service_role";

grant trigger on table "public"."pk_translation" to "service_role";

grant truncate on table "public"."pk_translation" to "service_role";

grant update on table "public"."pk_translation" to "service_role";

grant delete on table "public"."pre_sales" to "anon";

grant insert on table "public"."pre_sales" to "anon";

grant references on table "public"."pre_sales" to "anon";

grant select on table "public"."pre_sales" to "anon";

grant trigger on table "public"."pre_sales" to "anon";

grant truncate on table "public"."pre_sales" to "anon";

grant update on table "public"."pre_sales" to "anon";

grant delete on table "public"."pre_sales" to "authenticated";

grant insert on table "public"."pre_sales" to "authenticated";

grant references on table "public"."pre_sales" to "authenticated";

grant select on table "public"."pre_sales" to "authenticated";

grant trigger on table "public"."pre_sales" to "authenticated";

grant truncate on table "public"."pre_sales" to "authenticated";

grant update on table "public"."pre_sales" to "authenticated";

grant delete on table "public"."pre_sales" to "service_role";

grant insert on table "public"."pre_sales" to "service_role";

grant references on table "public"."pre_sales" to "service_role";

grant select on table "public"."pre_sales" to "service_role";

grant trigger on table "public"."pre_sales" to "service_role";

grant truncate on table "public"."pre_sales" to "service_role";

grant update on table "public"."pre_sales" to "service_role";

grant delete on table "public"."prescription" to "anon";

grant insert on table "public"."prescription" to "anon";

grant references on table "public"."prescription" to "anon";

grant select on table "public"."prescription" to "anon";

grant trigger on table "public"."prescription" to "anon";

grant truncate on table "public"."prescription" to "anon";

grant update on table "public"."prescription" to "anon";

grant delete on table "public"."prescription" to "authenticated";

grant insert on table "public"."prescription" to "authenticated";

grant references on table "public"."prescription" to "authenticated";

grant select on table "public"."prescription" to "authenticated";

grant trigger on table "public"."prescription" to "authenticated";

grant truncate on table "public"."prescription" to "authenticated";

grant update on table "public"."prescription" to "authenticated";

grant delete on table "public"."prescription" to "service_role";

grant insert on table "public"."prescription" to "service_role";

grant references on table "public"."prescription" to "service_role";

grant select on table "public"."prescription" to "service_role";

grant trigger on table "public"."prescription" to "service_role";

grant truncate on table "public"."prescription" to "service_role";

grant update on table "public"."prescription" to "service_role";

grant delete on table "public"."processing_state" to "anon";

grant insert on table "public"."processing_state" to "anon";

grant references on table "public"."processing_state" to "anon";

grant select on table "public"."processing_state" to "anon";

grant trigger on table "public"."processing_state" to "anon";

grant truncate on table "public"."processing_state" to "anon";

grant update on table "public"."processing_state" to "anon";

grant delete on table "public"."processing_state" to "authenticated";

grant insert on table "public"."processing_state" to "authenticated";

grant references on table "public"."processing_state" to "authenticated";

grant select on table "public"."processing_state" to "authenticated";

grant trigger on table "public"."processing_state" to "authenticated";

grant truncate on table "public"."processing_state" to "authenticated";

grant update on table "public"."processing_state" to "authenticated";

grant delete on table "public"."processing_state" to "service_role";

grant insert on table "public"."processing_state" to "service_role";

grant references on table "public"."processing_state" to "service_role";

grant select on table "public"."processing_state" to "service_role";

grant trigger on table "public"."processing_state" to "service_role";

grant truncate on table "public"."processing_state" to "service_role";

grant update on table "public"."processing_state" to "service_role";

grant delete on table "public"."refusal_reasons" to "anon";

grant insert on table "public"."refusal_reasons" to "anon";

grant references on table "public"."refusal_reasons" to "anon";

grant select on table "public"."refusal_reasons" to "anon";

grant trigger on table "public"."refusal_reasons" to "anon";

grant truncate on table "public"."refusal_reasons" to "anon";

grant update on table "public"."refusal_reasons" to "anon";

grant delete on table "public"."refusal_reasons" to "authenticated";

grant insert on table "public"."refusal_reasons" to "authenticated";

grant references on table "public"."refusal_reasons" to "authenticated";

grant select on table "public"."refusal_reasons" to "authenticated";

grant trigger on table "public"."refusal_reasons" to "authenticated";

grant truncate on table "public"."refusal_reasons" to "authenticated";

grant update on table "public"."refusal_reasons" to "authenticated";

grant delete on table "public"."refusal_reasons" to "service_role";

grant insert on table "public"."refusal_reasons" to "service_role";

grant references on table "public"."refusal_reasons" to "service_role";

grant select on table "public"."refusal_reasons" to "service_role";

grant trigger on table "public"."refusal_reasons" to "service_role";

grant truncate on table "public"."refusal_reasons" to "service_role";

grant update on table "public"."refusal_reasons" to "service_role";

grant delete on table "public"."sales_team" to "anon";

grant insert on table "public"."sales_team" to "anon";

grant references on table "public"."sales_team" to "anon";

grant select on table "public"."sales_team" to "anon";

grant trigger on table "public"."sales_team" to "anon";

grant truncate on table "public"."sales_team" to "anon";

grant update on table "public"."sales_team" to "anon";

grant delete on table "public"."sales_team" to "authenticated";

grant insert on table "public"."sales_team" to "authenticated";

grant references on table "public"."sales_team" to "authenticated";

grant select on table "public"."sales_team" to "authenticated";

grant trigger on table "public"."sales_team" to "authenticated";

grant truncate on table "public"."sales_team" to "authenticated";

grant update on table "public"."sales_team" to "authenticated";

grant delete on table "public"."sales_team" to "service_role";

grant insert on table "public"."sales_team" to "service_role";

grant references on table "public"."sales_team" to "service_role";

grant select on table "public"."sales_team" to "service_role";

grant trigger on table "public"."sales_team" to "service_role";

grant truncate on table "public"."sales_team" to "service_role";

grant update on table "public"."sales_team" to "service_role";

grant delete on table "public"."staff" to "anon";

grant insert on table "public"."staff" to "anon";

grant references on table "public"."staff" to "anon";

grant select on table "public"."staff" to "anon";

grant trigger on table "public"."staff" to "anon";

grant truncate on table "public"."staff" to "anon";

grant update on table "public"."staff" to "anon";

grant delete on table "public"."staff" to "authenticated";

grant insert on table "public"."staff" to "authenticated";

grant references on table "public"."staff" to "authenticated";

grant select on table "public"."staff" to "authenticated";

grant trigger on table "public"."staff" to "authenticated";

grant truncate on table "public"."staff" to "authenticated";

grant update on table "public"."staff" to "authenticated";

grant delete on table "public"."staff" to "service_role";

grant insert on table "public"."staff" to "service_role";

grant references on table "public"."staff" to "service_role";

grant select on table "public"."staff" to "service_role";

grant trigger on table "public"."staff" to "service_role";

grant truncate on table "public"."staff" to "service_role";

grant update on table "public"."staff" to "service_role";

grant delete on table "public"."stock_alerts" to "anon";

grant insert on table "public"."stock_alerts" to "anon";

grant references on table "public"."stock_alerts" to "anon";

grant select on table "public"."stock_alerts" to "anon";

grant trigger on table "public"."stock_alerts" to "anon";

grant truncate on table "public"."stock_alerts" to "anon";

grant update on table "public"."stock_alerts" to "anon";

grant delete on table "public"."stock_alerts" to "authenticated";

grant insert on table "public"."stock_alerts" to "authenticated";

grant references on table "public"."stock_alerts" to "authenticated";

grant select on table "public"."stock_alerts" to "authenticated";

grant trigger on table "public"."stock_alerts" to "authenticated";

grant truncate on table "public"."stock_alerts" to "authenticated";

grant update on table "public"."stock_alerts" to "authenticated";

grant delete on table "public"."stock_alerts" to "service_role";

grant insert on table "public"."stock_alerts" to "service_role";

grant references on table "public"."stock_alerts" to "service_role";

grant select on table "public"."stock_alerts" to "service_role";

grant trigger on table "public"."stock_alerts" to "service_role";

grant truncate on table "public"."stock_alerts" to "service_role";

grant update on table "public"."stock_alerts" to "service_role";

grant delete on table "public"."threshold_history" to "anon";

grant insert on table "public"."threshold_history" to "anon";

grant references on table "public"."threshold_history" to "anon";

grant select on table "public"."threshold_history" to "anon";

grant trigger on table "public"."threshold_history" to "anon";

grant truncate on table "public"."threshold_history" to "anon";

grant update on table "public"."threshold_history" to "anon";

grant delete on table "public"."threshold_history" to "authenticated";

grant insert on table "public"."threshold_history" to "authenticated";

grant references on table "public"."threshold_history" to "authenticated";

grant select on table "public"."threshold_history" to "authenticated";

grant trigger on table "public"."threshold_history" to "authenticated";

grant truncate on table "public"."threshold_history" to "authenticated";

grant update on table "public"."threshold_history" to "authenticated";

grant delete on table "public"."threshold_history" to "service_role";

grant insert on table "public"."threshold_history" to "service_role";

grant references on table "public"."threshold_history" to "service_role";

grant select on table "public"."threshold_history" to "service_role";

grant trigger on table "public"."threshold_history" to "service_role";

grant truncate on table "public"."threshold_history" to "service_role";

grant update on table "public"."threshold_history" to "service_role";

grant delete on table "public"."thresholds" to "anon";

grant insert on table "public"."thresholds" to "anon";

grant references on table "public"."thresholds" to "anon";

grant select on table "public"."thresholds" to "anon";

grant trigger on table "public"."thresholds" to "anon";

grant truncate on table "public"."thresholds" to "anon";

grant update on table "public"."thresholds" to "anon";

grant delete on table "public"."thresholds" to "authenticated";

grant insert on table "public"."thresholds" to "authenticated";

grant references on table "public"."thresholds" to "authenticated";

grant select on table "public"."thresholds" to "authenticated";

grant trigger on table "public"."thresholds" to "authenticated";

grant truncate on table "public"."thresholds" to "authenticated";

grant update on table "public"."thresholds" to "authenticated";

grant delete on table "public"."thresholds" to "service_role";

grant insert on table "public"."thresholds" to "service_role";

grant references on table "public"."thresholds" to "service_role";

grant select on table "public"."thresholds" to "service_role";

grant trigger on table "public"."thresholds" to "service_role";

grant truncate on table "public"."thresholds" to "service_role";

grant update on table "public"."thresholds" to "service_role";

grant delete on table "public"."transaction_history" to "anon";

grant insert on table "public"."transaction_history" to "anon";

grant references on table "public"."transaction_history" to "anon";

grant select on table "public"."transaction_history" to "anon";

grant trigger on table "public"."transaction_history" to "anon";

grant truncate on table "public"."transaction_history" to "anon";

grant update on table "public"."transaction_history" to "anon";

grant delete on table "public"."transaction_history" to "authenticated";

grant insert on table "public"."transaction_history" to "authenticated";

grant references on table "public"."transaction_history" to "authenticated";

grant select on table "public"."transaction_history" to "authenticated";

grant trigger on table "public"."transaction_history" to "authenticated";

grant truncate on table "public"."transaction_history" to "authenticated";

grant update on table "public"."transaction_history" to "authenticated";

grant delete on table "public"."transaction_history" to "service_role";

grant insert on table "public"."transaction_history" to "service_role";

grant references on table "public"."transaction_history" to "service_role";

grant select on table "public"."transaction_history" to "service_role";

grant trigger on table "public"."transaction_history" to "service_role";

grant truncate on table "public"."transaction_history" to "service_role";

grant update on table "public"."transaction_history" to "service_role";

grant delete on table "public"."vitals" to "anon";

grant insert on table "public"."vitals" to "anon";

grant references on table "public"."vitals" to "anon";

grant select on table "public"."vitals" to "anon";

grant trigger on table "public"."vitals" to "anon";

grant truncate on table "public"."vitals" to "anon";

grant update on table "public"."vitals" to "anon";

grant delete on table "public"."vitals" to "authenticated";

grant insert on table "public"."vitals" to "authenticated";

grant references on table "public"."vitals" to "authenticated";

grant select on table "public"."vitals" to "authenticated";

grant trigger on table "public"."vitals" to "authenticated";

grant truncate on table "public"."vitals" to "authenticated";

grant update on table "public"."vitals" to "authenticated";

grant delete on table "public"."vitals" to "service_role";

grant insert on table "public"."vitals" to "service_role";

grant references on table "public"."vitals" to "service_role";

grant select on table "public"."vitals" to "service_role";

grant trigger on table "public"."vitals" to "service_role";

grant truncate on table "public"."vitals" to "service_role";

grant update on table "public"."vitals" to "service_role";

grant delete on table "test_mcm"."patient_appointments" to "anon";

grant insert on table "test_mcm"."patient_appointments" to "anon";

grant select on table "test_mcm"."patient_appointments" to "anon";

grant update on table "test_mcm"."patient_appointments" to "anon";


  create policy "Allow delete for all authenticated users"
  on "public"."FAQs_es"
  as permissive
  for delete
  to authenticated
using ((auth.uid() IS NOT NULL));



  create policy "Allow insert for all authenticated users"
  on "public"."FAQs_es"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() IS NOT NULL));



  create policy "Allow read for all authenticated users"
  on "public"."FAQs_es"
  as permissive
  for select
  to authenticated
using ((auth.uid() IS NOT NULL));



  create policy "Allow update for all authenticated users"
  on "public"."FAQs_es"
  as permissive
  for update
  to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));



  create policy "Public delete"
  on "public"."FAQs_es"
  as permissive
  for delete
  to public
using (true);



  create policy "Public insert"
  on "public"."FAQs_es"
  as permissive
  for insert
  to public
with check (true);



  create policy "Public select"
  on "public"."FAQs_es"
  as permissive
  for select
  to public
using (true);



  create policy "Public update"
  on "public"."FAQs_es"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Enable edit access for all users"
  on "public"."Specials"
  as permissive
  for update
  to public
using (true);



  create policy "ai_soapnotes_delete_all"
  on "public"."ai_soapnotes"
  as permissive
  for delete
  to public
using (true);



  create policy "ai_soapnotes_insert_all"
  on "public"."ai_soapnotes"
  as permissive
  for insert
  to public
with check (true);



  create policy "ai_soapnotes_select_all"
  on "public"."ai_soapnotes"
  as permissive
  for select
  to public
using (true);



  create policy "ai_soapnotes_update_all"
  on "public"."ai_soapnotes"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "policy all"
  on "public"."allpatients"
  as permissive
  for all
  to public
using (true);



  create policy "Allow public read on allservices"
  on "public"."allservices"
  as permissive
  for select
  to public
using (true);



  create policy "Allow public read on allservices_es"
  on "public"."allservices_es"
  as permissive
  for select
  to public
using (true);



  create policy "Allow authenticated all access"
  on "public"."audit_logs"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all delete access"
  on "public"."bonus"
  as permissive
  for delete
  to public
using (true);



  create policy "Allow all insert access"
  on "public"."bonus"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow all read access"
  on "public"."bonus"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all update access"
  on "public"."bonus"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "bonus_config_history_delete_policy"
  on "public"."bonus_config_history"
  as permissive
  for delete
  to public
using (true);



  create policy "bonus_config_history_insert_policy"
  on "public"."bonus_config_history"
  as permissive
  for insert
  to public
with check (true);



  create policy "bonus_config_history_select_policy"
  on "public"."bonus_config_history"
  as permissive
  for select
  to public
using (true);



  create policy "bonus_config_history_update_policy"
  on "public"."bonus_config_history"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Allow authenticated all access"
  on "public"."call_logs"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow authenticated all access"
  on "public"."canned_responses"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow anon read active clinics"
  on "public"."clinics"
  as permissive
  for select
  to anon
using ((active = true));



  create policy "Allow authenticated all access"
  on "public"."clinics"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "All policy"
  on "public"."credit_audit"
  as permissive
  for all
  to public
using (true);



  create policy "allow_all_policy"
  on "public"."discounts"
  as permissive
  for all
  to public
using (true);



  create policy "Permissions-Allowed"
  on "public"."email_log"
  as permissive
  for all
  to public
using (true);



  create policy "All"
  on "public"."email_templates"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Delete"
  on "public"."email_templates"
  as permissive
  for delete
  to public
using (true);



  create policy "Insert"
  on "public"."email_templates"
  as permissive
  for insert
  to public
with check (true);



  create policy "Select"
  on "public"."email_templates"
  as permissive
  for select
  to public
using (true);



  create policy "Allow anon read active faqs"
  on "public"."faqs"
  as permissive
  for select
  to anon
using ((active = true));



  create policy "Allow authenticated all access"
  on "public"."faqs"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."features"
  as permissive
  for select
  to public
using (true);



  create policy "Enable edit access for all users"
  on "public"."features"
  as permissive
  for update
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."features"
  as permissive
  for select
  to public
using (true);



  create policy "Enable edit access for all users"
  on "public"."features_es"
  as permissive
  for update
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."features_es"
  as permissive
  for select
  to public
using (true);



  create policy "Public read for features_es"
  on "public"."features_es"
  as permissive
  for select
  to public
using (true);



  create policy "Permissions-Allowed"
  on "public"."fulfillment_requests"
  as permissive
  for all
  to public
using (true);



  create policy "public_delete_individual_bonus"
  on "public"."individual_bonus"
  as permissive
  for delete
  to public
using (true);



  create policy "public_insert_individual_bonus"
  on "public"."individual_bonus"
  as permissive
  for insert
  to public
with check (true);



  create policy "public_select_individual_bonus"
  on "public"."individual_bonus"
  as permissive
  for select
  to public
using (true);



  create policy "public_update_individual_bonus"
  on "public"."individual_bonus"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "intake_form_delete_all"
  on "public"."intake_form"
  as permissive
  for delete
  to public
using (true);



  create policy "intake_form_insert_all"
  on "public"."intake_form"
  as permissive
  for insert
  to public
with check (true);



  create policy "intake_form_select_all"
  on "public"."intake_form"
  as permissive
  for select
  to public
using (true);



  create policy "intake_form_update_all"
  on "public"."intake_form"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Allow authenticated all access"
  on "public"."interactions"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "allow insert"
  on "public"."notifications_settings"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow authenticated all access"
  on "public"."patients"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow"
  on "public"."pk_medication"
  as permissive
  for delete
  to public
using (false);



  create policy "get medications"
  on "public"."pk_medication"
  as permissive
  for select
  to public
using (true);



  create policy "insert allow"
  on "public"."pk_medication"
  as permissive
  for insert
  to public
with check (true);



  create policy "update medication"
  on "public"."pk_medication"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "allow insert"
  on "public"."pk_preferences"
  as permissive
  for insert
  to public
with check (true);



  create policy "allow"
  on "public"."pk_profile"
  as permissive
  for select
  to public
using (true);



  create policy "allowing all"
  on "public"."pk_profile"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "get translation"
  on "public"."pk_translation"
  as permissive
  for select
  to public
using (true);



  create policy "Allow user to insert own profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "Delete"
  on "public"."profiles"
  as permissive
  for delete
  to public
using (true);



  create policy "Edit"
  on "public"."profiles"
  as permissive
  for update
  to public
using (true);



  create policy "update"
  on "public"."profiles"
  as permissive
  for update
  to public
using (true);



  create policy "Allow read for all"
  on "public"."refusal_reasons"
  as permissive
  for select
  to public
using (true);



  create policy "Allow delete for authenticated"
  on "public"."sales_team"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Allow insert for authenticated"
  on "public"."sales_team"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Allow read for authenticated"
  on "public"."sales_team"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow update for authenticated"
  on "public"."sales_team"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "authenticated_delete_sales_team"
  on "public"."sales_team"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_insert_sales_team"
  on "public"."sales_team"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_select_sales_team"
  on "public"."sales_team"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated_update_sales_team"
  on "public"."sales_team"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "insert sales team"
  on "public"."sales_team"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = auth_member));



  create policy "public_delete_sales_team"
  on "public"."sales_team"
  as permissive
  for delete
  to public
using (true);



  create policy "public_insert_sales_team"
  on "public"."sales_team"
  as permissive
  for insert
  to public
with check (true);



  create policy "public_select_sales_team"
  on "public"."sales_team"
  as permissive
  for select
  to public
using (true);



  create policy "public_update_sales_team"
  on "public"."sales_team"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Allow delete for authenticated"
  on "public"."staff"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Allow insert for authenticated"
  on "public"."staff"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Allow read for authenticated"
  on "public"."staff"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow select for all"
  on "public"."staff"
  as permissive
  for select
  to public
using (true);



  create policy "Allow update for authenticated"
  on "public"."staff"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Permissions-Allowed"
  on "public"."stock_alerts"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all delete access"
  on "public"."threshold_history"
  as permissive
  for delete
  to public
using (true);



  create policy "Allow all insert access"
  on "public"."threshold_history"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow all read access"
  on "public"."threshold_history"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all update access"
  on "public"."threshold_history"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Create Permission"
  on "public"."thresholds"
  as permissive
  for insert
  to public
with check (true);



  create policy "Select-Permission"
  on "public"."thresholds"
  as permissive
  for select
  to public
using (true);



  create policy "Update Permissions"
  on "public"."thresholds"
  as permissive
  for update
  to public
using (true);



  create policy "Permissions-Allowed"
  on "public"."transaction_history"
  as permissive
  for all
  to public
using (true);



  create policy "Permissions-Allowed"
  on "public"."user_locations"
  as permissive
  for all
  to public
using (true);


CREATE TRIGGER notification_appointment AFTER INSERT ON public."Appoinments" FOR EACH ROW EXECUTE FUNCTION public.notifi_appointment();

CREATE TRIGGER "notify-appointments" AFTER INSERT OR DELETE OR UPDATE ON public."Appoinments" FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://vsvueqtgulraaczqnnvh.supabase.co/functions/v1/quick-handler', 'POST', '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdnVlcXRndWxyYWFjenFubnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDA0NDk5MywiZXhwIjoyMDE1NjIwOTkzfQ.7dAw7jNNB5_IMFLNN19nCyVIRX35wcyT5cDqPt5K9yU"}', '{}', '5000');

CREATE TRIGGER trg_before_insert_assign_patient BEFORE INSERT ON public."Appoinments" FOR EACH ROW EXECUTE FUNCTION public.trg_assign_patient_id();
ALTER TABLE "public"."Appoinments" DISABLE TRIGGER "trg_before_insert_assign_patient";

CREATE TRIGGER trg_set_new_patient BEFORE INSERT ON public."Appoinments" FOR EACH ROW EXECUTE FUNCTION public.set_new_patient_flag();

CREATE TRIGGER trigger_notify_user AFTER INSERT ON public."Appoinments" FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_appointment();

CREATE TRIGGER trg_update_location_balance AFTER UPDATE OF credit_limit ON public."Locations" FOR EACH ROW EXECUTE FUNCTION public.update_location_balance_on_credit_limit_change();

CREATE TRIGGER handle_allpatients_before_insert BEFORE INSERT ON public.allpatients FOR EACH ROW EXECUTE FUNCTION public.handle_allpatients_before_insert();

CREATE TRIGGER update_canned_responses_updated_at BEFORE UPDATE ON public.canned_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER credit_audit_update_location AFTER INSERT OR UPDATE ON public.credit_audit FOR EACH ROW EXECUTE FUNCTION public.update_location_credit_balance();
ALTER TABLE "public"."credit_audit" DISABLE TRIGGER "credit_audit_update_location";

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_audit AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_credit_audit_updates();
ALTER TABLE "public"."orders" DISABLE TRIGGER "update_credit_audit";

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


  create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'signatures'::text));



