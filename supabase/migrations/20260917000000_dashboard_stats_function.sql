-- Dashboard KPIs in one round trip.
--
-- Aggregating in the client is not an option: PostgREST caps a select at 1000
-- rows, so summing sales_history or inventory over the wire silently truncates
-- (a client-side version read 49M of 249M stock units before this existed).
--
-- p_location_id null means every location the caller can see. sales_history has
-- no location column of its own, so it reaches one through the inventory row it
-- sold.
create or replace function public.dashboard_stats(p_location_id bigint default null)
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
    where p_location_id is null
       or sh.inventory_id in (select inventory_id from inventory where location_id = p_location_id)
  ),
  appts as (
    select
      count(*) as total,
      count(*) filter (where created_at >= (select ts from month_start)) as month,
      count(*) filter (where date_and_time >= to_char(now(), 'YYYY-MM-DD')) as upcoming
    from "Appoinments"
    where p_location_id is null or location_id = p_location_id
  ),
  pats as (
    select
      count(*) as total,
      count(*) filter (where created_at >= (select ts from month_start)) as month
    from allpatients
    where p_location_id is null or locationid = p_location_id
  ),
  wh as (
    select
      (select count(*) from products) as products,
      count(*) as stocked_items,
      count(*) filter (where coalesce(quantity, 0) <= 0) as out_of_stock
    from inventory
    where (p_location_id is null or location_id = p_location_id)
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
    )
  );
$$;

grant execute on function public.dashboard_stats(bigint) to authenticated, service_role;
