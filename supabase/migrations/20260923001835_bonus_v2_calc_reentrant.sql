-- Bonus system v2: the calculation. Idempotent, date-scoped, exact to the cent.
-- Applied to csm-staging 2026-09-23. NOT yet applied to production.
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
begin
  perform pg_advisory_xact_lock(hashtext('bonus:' || p_location_id || ':' || p_business_date));

  -- Re-callable inside one transaction.
  drop table if exists _teams;
  drop table if exists _participants;

  -- Step 2: the config that was actually in force on that business date.
  select bch.* into cfg
  from public.bonus_config_history bch
  where bch.location_id = p_location_id
    and bch.effective_from <= p_business_date
    and (bch.effective_to is null or bch.effective_to > p_business_date)
  order by bch.effective_from desc, bch.id desc
  limit 1;

  -- Steps 3 and 4: net sales for the day, and the eligible slice of them.
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

    -- Step 5: the pool comes from ELIGIBLE sales, never from total sales.
    if v_eligible_flag then
      if upper(cfg.flat_percentage) = 'FLAT' then
        v_pool := round(cfg.value, 2);
      else
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

  -- Step 6: split the pool across the teams that sold eligible items that day.
  -- Largest remainder, so team pools sum exactly to the clinic pool.
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

  -- Step 7: participants per team, each person exactly once.
  create temp table _participants on commit drop as
  with base as (
    select t.sales_team_id, t.pool_cents, st.auth_member, st.location_id as team_location
    from _teams t
    join public.sales_team st on st.id = t.sales_team_id
  ),
  staff_members as (
    -- members[] restricted to staff actually assigned to this clinic
    select distinct b.sales_team_id, b.pool_cents,
           'staff:' || s.id::text as member_key, s.id as staff_id,
           null::uuid as auth_member, s.profile_id
    from base b
    join public.sales_team st on st.id = b.sales_team_id
    cross join lateral unnest(coalesce(st.members, '{}'::bigint[])) as m(staff_id)
    join public.staff s on s.id = m.staff_id
    where b.team_location = any (s.location_id)
  ),
  seller as (
    -- the logged-in seller, unless a staff row above already is that person
    select b.sales_team_id, b.pool_cents,
           'user:' || b.auth_member::text as member_key,
           null::bigint as staff_id, b.auth_member, null::uuid as profile_id
    from base b
    where b.auth_member is not null
      and not exists (
        select 1 from staff_members sm
        where sm.sales_team_id = b.sales_team_id
          and sm.profile_id    = b.auth_member
      )
  ),
  everyone as (
    select sales_team_id, pool_cents, member_key, staff_id, auth_member from staff_members
    union all
    select sales_team_id, pool_cents, member_key, staff_id, auth_member from seller
  )
  select e.*,
         count(*)      over (partition by e.sales_team_id) as n,
         row_number()  over (partition by e.sales_team_id order by e.member_key) as rn
  from everyone e;

  update public.sales_team_bonus_daily d
     set participating_staff = x.n
  from (select sales_team_id, max(n) as n from _participants group by 1) x
  where d.sales_team_id = x.sales_team_id and d.business_date = p_business_date;

  -- Retire payout rows that no longer belong to this day's result.
  update public.individual_bonus ib
     set superseded_at = now()
  where ib.bonus_date = p_business_date
    and ib.superseded_at is null
    and ib.sales_team_id in (
      select st.id from public.sales_team st where st.location_id = p_location_id
    )
    and (
      ib.calc_version = 1
      or not exists (
        select 1 from _participants pp
        where pp.sales_team_id = ib.sales_team_id
          and pp.member_key    = ib.member_key
      )
    );

  -- Divide each team pool equally, remainder spread one cent at a time in
  -- member_key order, so the shares sum exactly to the team pool.
  insert into public.individual_bonus
    (staff_id, sales_team_id, bonus, bonus_date, business_date, auth_member,
     calc_version, created_at)
  select pp.staff_id, pp.sales_team_id,
         ((pp.pool_cents / pp.n) + case when pp.rn <= pp.pool_cents % pp.n then 1 else 0 end)::numeric / 100,
         p_business_date, p_business_date, pp.auth_member,
         2, now()
  from _participants pp
  on conflict (sales_team_id, bonus_date, member_key)
    where calc_version = 2 and superseded_at is null
  do update set bonus      = excluded.bonus,
                created_at = now();

  drop table if exists _teams;
  drop table if exists _participants;
end;
$function$;

revoke execute on function public.calculate_bonus_for_location_date(bigint, date) from anon, authenticated;
