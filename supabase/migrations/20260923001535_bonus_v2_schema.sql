-- Bonus system v2: schema. No historical rows are deleted or rewritten.
-- Applied to csm-staging 2026-09-23. NOT yet applied to production.

-- 1. Business date -------------------------------------------------------
alter table public."Locations"
  add column if not exists timezone text not null default 'America/Chicago';

create or replace function public.bonus_business_date(ts timestamptz, tz text default 'America/Chicago')
returns date language sql stable as $$
  select (ts at time zone coalesce(nullif(tz,''), 'America/Chicago'))::date;
$$;

create or replace function public.bonus_location_timezone(p_location_id bigint)
returns text language sql stable as $$
  select coalesce(nullif(l.timezone,''), 'America/Chicago')
  from public."Locations" l where l.id = p_location_id;
$$;

-- 2. Staff identity ------------------------------------------------------
alter table public.staff
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

create unique index if not exists staff_profile_id_key
  on public.staff (profile_id) where profile_id is not null;

-- 3. Per-day team allocation, replacing the lifetime accumulator ---------
create table if not exists public.sales_team_bonus_daily (
  id                      bigint generated always as identity primary key,
  sales_team_id           bigint  not null references public.sales_team(id) on delete cascade,
  location_id             bigint  not null references public."Locations"(id) on delete cascade,
  business_date           date    not null,
  team_eligible_sales     numeric(14,2) not null default 0 check (team_eligible_sales >= 0),
  team_pool               numeric(12,2) not null default 0 check (team_pool >= 0),
  participating_staff     integer not null default 0 check (participating_staff >= 0),
  bonus_config_history_id integer references public.bonus_config_history(id) on delete set null,
  computed_at             timestamptz not null default now(),
  constraint sales_team_bonus_daily_uniq unique (sales_team_id, business_date)
);

comment on column public.sales_team.bonus_amount_overall is
  'DEPRECATED as of bonus v2. Was a lifetime accumulator and is no longer written. Per-day amounts live in sales_team_bonus_daily.';

-- 4. Payout identity -----------------------------------------------------
alter table public.individual_bonus
  add column if not exists calc_version  smallint    not null default 1,
  add column if not exists superseded_at timestamptz,
  add column if not exists business_date date;

alter table public.individual_bonus
  drop column if exists member_key;

alter table public.individual_bonus
  add column member_key text generated always as (
    case
      when staff_id    is not null then 'staff:' || staff_id::text
      when auth_member is not null then 'user:'  || auth_member::text
      else null
    end
  ) stored;

create unique index if not exists individual_bonus_v2_identity
  on public.individual_bonus (sales_team_id, bonus_date, member_key)
  where calc_version = 2 and superseded_at is null;

create index if not exists individual_bonus_live_idx
  on public.individual_bonus (bonus_date, sales_team_id)
  where superseded_at is null;

-- 5. Guard rails. NOT VALID so legacy rows survive for audit.
--    NOTE: one live config has PERCENTAGE value = 200. Fix it before running
--    `alter table public.bonus_config_history validate constraint bonus_config_value_range;`
alter table public.individual_bonus
  drop constraint if exists individual_bonus_bonus_nonneg;
alter table public.individual_bonus
  add constraint individual_bonus_bonus_nonneg check (bonus >= 0) not valid;

alter table public.bonus_config_history
  drop constraint if exists bonus_config_value_range;
alter table public.bonus_config_history
  add constraint bonus_config_value_range check (
    value >= 0
    and bonus_threshold >= 0
    and (upper(flat_percentage) <> 'PERCENTAGE' or value <= 100)
    and upper(flat_percentage) in ('FLAT','PERCENTAGE')
  ) not valid;

alter table public.bonus
  drop constraint if exists bonus_amounts_nonneg;
alter table public.bonus
  add constraint bonus_amounts_nonneg check (
    coalesce(bonus_amount,0) >= 0
    and coalesce(total_sales,0) >= 0
    and coalesce(bonus_sales,0) >= 0
  ) not valid;

-- 6. One open config per location, one open team per location ------------
create unique index if not exists bonus_config_history_one_open
  on public.bonus_config_history (location_id) where effective_to is null;

create unique index if not exists sales_team_one_open
  on public.sales_team (location_id) where valid_to is null;

-- 7. Deleting a user must not destroy sales history ----------------------
alter table public.sales_team drop constraint if exists sales_team_auth_member_fkey;
alter table public.sales_team add constraint sales_team_auth_member_fkey
  foreign key (auth_member) references auth.users(id) on delete set null;

alter table public.individual_bonus drop constraint if exists individual_bonus_staff_id_fkey;
alter table public.individual_bonus add constraint individual_bonus_staff_id_fkey
  foreign key (staff_id) references public.staff(id) on delete restrict;

-- 8. Backfill business_date on legacy rows for reporting parity ----------
update public.individual_bonus set business_date = bonus_date where business_date is null;
