-- Bonus system v2: view, orchestrators and retirement of the old pipeline.
-- Applied to csm-staging 2026-09-23. NOT yet applied to production.
--
-- NOTE ON HISTORY: on staging this migration also created a first version of
-- calculate_bonus_for_location_date() that could not be called twice inside one
-- transaction. It was corrected minutes later by 20260923001835. That superseded
-- body is omitted here; the function is created once, correctly, in that next
-- migration. Creating the orchestrators first is safe because plpgsql resolves
-- the call at runtime. Running these files in order gives the same end state.

-- Sale lines net of returns, with the business date in the location's timezone.
create or replace view public.bonus_sale_lines as
select
  sh.sales_history_id,
  sh.order_id,
  o.sales_team_id,
  i.location_id,
  p.bonus_eligible,
  public.bonus_business_date(sh.date_sold, coalesce(nullif(l.timezone,''),'America/Chicago')) as business_date,
  round(
    (coalesce(sh.total_price,0)::numeric / nullif(sh.quantity_sold,0))
    * greatest(
        coalesce(sh.quantity_sold,0)
        - coalesce(
            nullif((select sum(r.quantity) from public.returns r where r.sales_id = sh.sales_history_id), 0),
            coalesce(sh.return_qty, 0)
          ),
        0)
  , 2) as net_value
from public.sales_history sh
join public.orders    o on o.order_id      = sh.order_id
join public.inventory i on i.inventory_id  = sh.inventory_id
join public.products  p on p.product_id    = i.product_id
join public."Locations" l on l.id          = i.location_id;

comment on view public.bonus_sale_lines is
  'Sale lines net of returns. Returned quantity prefers the returns table and falls back to sales_history.return_qty. business_date is the location-local day.';

-- Orchestrator: one location-day at a time, every active location.
create or replace function public.run_daily_bonus(p_business_date date default null)
returns integer
language plpgsql
as $function$
declare
  loc   record;
  n     integer := 0;
  d     date;
begin
  foreach d in array array[coalesce(p_business_date, (now() at time zone 'America/Chicago')::date)]
  loop
    for loc in
      select id, coalesce(nullif(timezone,''),'America/Chicago') as tz
      from public."Locations"
      where coalesce(is_active, true)
    loop
      perform public.calculate_bonus_for_location_date(
        loc.id,
        coalesce(p_business_date, (now() at time zone loc.tz)::date)
      );
      n := n + 1;
    end loop;
  end loop;
  return n;
end;
$function$;

-- Explicit recalculation for a past day, e.g. after a refund or a void.
create or replace function public.recalculate_bonus_for_date(
  p_location_id bigint, p_business_date date
) returns void language sql as $function$
  select public.calculate_bonus_for_location_date(p_location_id, p_business_date);
$function$;

-- The old pipeline must never run again.
drop function if exists public.trigger_distribute_individual_bonus() cascade;

create or replace function public.calculate_team_bonus_daily() returns void language plpgsql as $function$
begin
  raise exception 'calculate_team_bonus_daily() is retired. Use run_daily_bonus() or calculate_bonus_for_location_date().';
end; $function$;

create or replace function public.distribute_individual_bonus_daily() returns void language plpgsql as $function$
begin
  raise exception 'distribute_individual_bonus_daily() is retired. Use run_daily_bonus() or calculate_bonus_for_location_date().';
end; $function$;

create or replace function public.update_bonus_totalsales() returns void language plpgsql as $function$
begin
  raise exception 'update_bonus_totalsales() is retired. Use run_daily_bonus() or calculate_bonus_for_location_date().';
end; $function$;

-- These are nightly jobs, not client endpoints.
revoke execute on function public.run_daily_bonus(date)                from anon, authenticated;
revoke execute on function public.recalculate_bonus_for_date(bigint, date) from anon, authenticated;
revoke execute on function public.calculate_team_bonus_daily()         from anon, authenticated;
revoke execute on function public.distribute_individual_bonus_daily()  from anon, authenticated;
revoke execute on function public.update_bonus_totalsales()            from anon, authenticated;
