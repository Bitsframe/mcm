-- Bonus v3: the day's pool is divided equally among the staff assigned to that
-- clinic, not among the people recorded on the sale. Sales teams are still
-- recorded for attribution, but they no longer decide who gets paid.
--
--   pool  = bonus-eligible sales x rate
--   share = pool / (staff assigned to that location)
--
-- Applied to csm-staging 2026-09-24. NOT yet applied to production.

alter table public.individual_bonus
  add column if not exists location_id bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.individual_bonus'::regclass and conname = 'individual_bonus_location_id_fkey'
  ) then
    alter table public.individual_bonus
      add constraint individual_bonus_location_id_fkey
      foreign key (location_id) references public."Locations"(id) on delete restrict;
  end if;
end $$;

-- v2 rows only ever existed as test fixtures; the model they belong to is gone.
delete from public.individual_bonus where calc_version = 2;
delete from public.sales_team_bonus_daily;

drop index if exists public.individual_bonus_v2_identity;

create unique index if not exists individual_bonus_v3_identity
  on public.individual_bonus (location_id, bonus_date, member_key)
  where calc_version = 3 and superseded_at is null;


create or replace function public.calculate_bonus_for_location_date(
  p_location_id  bigint,
  p_business_date date
) returns void
language plpgsql
as $function$
declare
  cfg               record;
  v_total_sales     numeric(14,2) := 0;
  v_eligible_sales  numeric(14,2) := 0;
  v_eligible_flag   boolean := false;
  v_pool            numeric(12,2) := 0;
  v_pool_cents      bigint := 0;
  v_staff_count     integer := 0;
begin
  perform pg_advisory_xact_lock(hashtext('bonus:' || p_location_id || ':' || p_business_date));

  drop table if exists _teams;
  drop table if exists _participants;

  -- The config in force on that business date, never a later one.
  select bch.* into cfg
  from public.bonus_config_history bch
  where bch.location_id = p_location_id
    and bch.effective_from <= p_business_date
    and (bch.effective_to is null or bch.effective_to > p_business_date)
  order by bch.effective_from desc, bch.id desc
  limit 1;

  -- Net-of-returns sales for the day, and the bonus-eligible slice of them.
  select coalesce(sum(sl.net_value), 0),
         coalesce(sum(sl.net_value) filter (where sl.bonus_eligible), 0)
    into v_total_sales, v_eligible_sales
  from public.bonus_sale_lines sl
  where sl.location_id   = p_location_id
    and sl.business_date = p_business_date;

  if cfg.id is null then
    insert into public.bonus (location_id, date, total_sales, bonus_sales,
                              bonus_eligibility, bonus_amount, bonus_config_history_id)
    values (p_location_id, p_business_date, v_total_sales, 0, false, 0, null)
    on conflict (location_id, date) do update
      set total_sales = excluded.total_sales,
          bonus_sales = 0, bonus_eligibility = false, bonus_amount = 0,
          bonus_config_history_id = null;
  else
    v_eligible_flag := v_total_sales >= cfg.bonus_threshold;

    if v_eligible_flag then
      if upper(cfg.flat_percentage) = 'FLAT' then
        v_pool := round(cfg.value, 2);
      else
        -- The rate applies to ELIGIBLE sales, never to total sales.
        v_pool := round(v_eligible_sales * cfg.value / 100.0, 2);
      end if;
    else
      v_pool := 0;
    end if;

    insert into public.bonus (location_id, date, total_sales, bonus_sales,
                              bonus_eligibility, bonus_amount, bonus_config_history_id)
    values (p_location_id, p_business_date, v_total_sales,
            case when v_eligible_flag then v_eligible_sales else 0 end,
            v_eligible_flag, v_pool, cfg.id)
    on conflict (location_id, date) do update
      set total_sales             = excluded.total_sales,
          bonus_sales             = excluded.bonus_sales,
          bonus_eligibility       = excluded.bonus_eligibility,
          bonus_amount            = excluded.bonus_amount,
          bonus_config_history_id = excluded.bonus_config_history_id;
  end if;

  v_pool_cents := (v_pool * 100)::bigint;

  -- Team attribution is still recorded, for reporting only. It no longer
  -- decides who is paid.
  create temp table _teams on commit drop as
  with team_sales as (
    select sl.sales_team_id, sum(sl.net_value) as eligible
    from public.bonus_sale_lines sl
    where sl.location_id   = p_location_id
      and sl.business_date = p_business_date
      and sl.bonus_eligible
      and sl.sales_team_id is not null
    group by sl.sales_team_id
    having sum(sl.net_value) > 0
  ),
  raw as (
    select ts.sales_team_id, ts.eligible,
           (v_pool_cents * ts.eligible) / nullif(sum(ts.eligible) over (), 0) as exact_cents
    from team_sales ts
  ),
  floored as (
    select sales_team_id, eligible,
           floor(exact_cents)::bigint as base_cents,
           exact_cents - floor(exact_cents) as frac
    from raw
  )
  select sales_team_id, eligible,
         base_cents + case
           when row_number() over (order by frac desc, sales_team_id)
                <= v_pool_cents - coalesce(sum(base_cents) over (), 0)
           then 1 else 0 end as pool_cents
  from floored;

  insert into public.sales_team_bonus_daily
    (sales_team_id, location_id, business_date, team_eligible_sales, team_pool,
     participating_staff, bonus_config_history_id, computed_at)
  select t.sales_team_id, p_location_id, p_business_date, t.eligible,
         (t.pool_cents::numeric / 100), 0, cfg.id, now()
  from _teams t
  on conflict (sales_team_id, business_date) do update
    set location_id             = excluded.location_id,
        team_eligible_sales     = excluded.team_eligible_sales,
        team_pool               = excluded.team_pool,
        bonus_config_history_id = excluded.bonus_config_history_id,
        computed_at             = now();

  -- Everyone on the clinic's staff list shares the pool equally.
  create temp table _participants on commit drop as
  select 'staff:' || s.id::text as member_key,
         s.id as staff_id,
         count(*) over ()                            as n,
         row_number() over (order by s.id)           as rn
  from public.staff s
  where p_location_id = any (s.location_id);

  select coalesce(max(n), 0) into v_staff_count from _participants;

  update public.sales_team_bonus_daily d
     set participating_staff = v_staff_count
  where d.location_id = p_location_id and d.business_date = p_business_date;

  -- Retire rows that no longer belong to this clinic-day.
  update public.individual_bonus ib
     set superseded_at = now()
  where ib.bonus_date = p_business_date
    and ib.superseded_at is null
    and (
      ib.location_id = p_location_id
      or ib.sales_team_id in (select st.id from public.sales_team st where st.location_id = p_location_id)
    )
    and (
      ib.calc_version < 3
      or v_pool_cents = 0
      or not exists (select 1 from _participants pp where pp.member_key = ib.member_key)
    );

  if v_pool_cents > 0 and v_staff_count > 0 then
    -- Equal shares, remainder spread one cent at a time in a fixed order, so
    -- the shares add up to the pool exactly.
    insert into public.individual_bonus
      (staff_id, location_id, sales_team_id, bonus, bonus_date, business_date,
       auth_member, calc_version, created_at)
    select pp.staff_id, p_location_id, null,
           ((v_pool_cents / pp.n) + case when pp.rn <= v_pool_cents % pp.n then 1 else 0 end)::numeric / 100,
           p_business_date, p_business_date, null,
           3, now()
    from _participants pp
    on conflict (location_id, bonus_date, member_key)
      where calc_version = 3 and superseded_at is null
    do update set bonus      = excluded.bonus,
                  created_at = now();
  end if;

  drop table if exists _teams;
  drop table if exists _participants;
end;
$function$;

revoke execute on function public.calculate_bonus_for_location_date(bigint, date) from anon, authenticated;
