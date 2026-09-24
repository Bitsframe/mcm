-- Dashboard KPIs across a set of locations.
--
-- Takes an array rather than a single id because the dashboard's default view is
-- "every location this user may see", which is whatever user_locations grants
-- them. The API resolves that list from the signed-in user; this function only
-- aggregates, and is never handed ids straight from a query string.
--
-- Aggregating in the client is not an option: PostgREST caps a select at 1000
-- rows, so summing sales_history or inventory over the wire silently truncates
-- (an earlier client-side version read 49M of 249M stock units).
--
-- sales_history has no location column of its own, so it reaches one through the
-- inventory row it sold.
create or replace function public.dashboard_stats(p_location_ids bigint[])
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with month_start as (
    select date_trunc('month', now()) as ts
  ),
  sales as (
    select
      coalesce(sum(sh.total_price), 0) as revenue_total,
      coalesce(sum(sh.total_price) filter (where sh.created_at >= (select ts from month_start)), 0) as revenue_month,
      count(*) filter (where sh.created_at >= (select ts from month_start)) as orders_month
    from sales_history sh
    where sh.inventory_id in (
      select inventory_id from inventory where location_id = any(p_location_ids)
    )
  ),
  appts as (
    select
      count(*) as total,
      count(*) filter (where created_at >= (select ts from month_start)) as month,
      count(*) filter (where appointment_date(date_and_time) >= current_date) as upcoming
    from "Appoinments"
    where location_id = any(p_location_ids)
  ),
  pats as (
    select
      count(*) as total,
      count(*) filter (where created_at >= (select ts from month_start)) as month
    from allpatients
    where locationid = any(p_location_ids)
  ),
  wh as (
    select
      (select count(*) from products) as products,
      count(*) as stocked_items,
      count(*) filter (where coalesce(quantity, 0) <= 0) as out_of_stock
    from inventory
    where location_id = any(p_location_ids)
      and coalesce(archived, false) = false
  )
  select jsonb_build_object(
    'sales', jsonb_build_object(
      'revenue_month', round((select revenue_month from sales)::numeric, 2),
      'revenue_total', round((select revenue_total from sales)::numeric, 2),
      'orders_month', (select orders_month from sales)
    ),
    'appointments', jsonb_build_object(
      'total', (select total from appts),
      'month', (select month from appts),
      'upcoming', (select upcoming from appts)
    ),
    'patients', jsonb_build_object(
      'total', (select total from pats),
      'month', (select month from pats)
    ),
    'warehouse', jsonb_build_object(
      'products', (select products from wh),
      'stocked_items', (select stocked_items from wh),
      'out_of_stock', (select out_of_stock from wh)
    ),
    'locations_counted', coalesce(array_length(p_location_ids, 1), 0)
  );
$$;

grant execute on function public.dashboard_stats(bigint[]) to authenticated, service_role;
