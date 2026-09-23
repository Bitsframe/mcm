-- Fix the warehouse figures in dashboard_stats.
--
-- Three things were wrong, and they compounded into a card that contradicted
-- itself ("28,655 items stocked · 23,958 out of stock" — the second number was
-- counted inside the first):
--
--   1. stocked_items counted EVERY non-archived inventory row, including the
--      ones with no stock. It was a row count, not a stocked count. Of 28,766
--      rows, only 4,697 actually hold stock.
--   2. products counted every row in `products`, archived included: 1,626 where
--      the Products page lists the 355 active ones. Two different "totals" for
--      the same catalogue.
--   3. Neither respected what the rest of the app means by those words.
--
-- Units, so the next reader does not have to re-derive them: `products` counts
-- the catalogue; `stocked_items` and `out_of_stock` count product-at-location
-- rows, so they sum to the location's inventory line count, not to `products`.
create or replace function public.dashboard_stats(p_location_ids bigint[])
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with month_start as (select date_trunc('month', now()) as ts),
  sales as (
    select
      coalesce(sum(sh.total_price), 0) as revenue_total,
      coalesce(sum(sh.total_price) filter (where sh.created_at >= (select ts from month_start)), 0) as revenue_month,
      count(*) filter (where sh.created_at >= (select ts from month_start)) as orders_month
    from sales_history sh
    where sh.inventory_id in (select inventory_id from inventory where location_id = any(p_location_ids))
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
      (select count(*) from products where coalesce(archived, false) = false) as products,
      count(*) filter (where coalesce(quantity, 0) > 0) as stocked_items,
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
