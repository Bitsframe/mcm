-- Per-page stat tiles.
--
-- Each screen gets the few numbers that belong to it rather than the same
-- company-wide four everywhere: the point of a strip above a table is to answer
-- "what am I looking at" before the rows load.
--
-- Returns bare numbers; labels and formatting live in the component so they stay
-- translatable. Locations are resolved from the signed-in user by the API and
-- passed in — never taken from a query string.
create or replace function public.page_stats(p_page text, p_location_ids bigint[])
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  month_start timestamptz := date_trunc('month', now());
  today_str text := to_char(now(), 'YYYY-MM-DD');
  result jsonb;
begin
  if p_page = 'patients' then
    select jsonb_build_object(
      'total', count(*),
      'month', count(*) filter (where created_at >= month_start),
      'onsite', count(*) filter (where onsite is true),
      'offsite', count(*) filter (where onsite is not true),
      'seen_this_month', count(*) filter (where lastvisit >= month_start)
    ) into result
    from allpatients
    where locationid = any(p_location_ids) and deleted_at is null;

  elsif p_page = 'appointments' then
    select jsonb_build_object(
      'today', count(*) filter (where left(date_and_time, 10) = today_str),
      'upcoming', count(*) filter (where left(date_and_time, 10) >= today_str),
      'month', count(*) filter (where created_at >= month_start),
      'pending', count(*) filter (where "isApproved" is not true and left(date_and_time, 10) >= today_str),
      'new_patients_month', count(*) filter (where created_at >= month_start and new_patient is true)
    ) into result
    from "Appoinments"
    where location_id = any(p_location_ids);

  elsif p_page = 'sales' then
    with scoped as (
      select sh.total_price, sh.created_at
      from sales_history sh
      where sh.inventory_id in (
        select inventory_id from inventory where location_id = any(p_location_ids)
      )
    )
    select jsonb_build_object(
      'revenue_today', coalesce(round(sum(total_price) filter (where created_at::date = current_date)::numeric, 2), 0),
      'revenue_month', coalesce(round(sum(total_price) filter (where created_at >= month_start)::numeric, 2), 0),
      'orders_month', count(*) filter (where created_at >= month_start),
      'avg_sale_month', coalesce(round(avg(total_price) filter (where created_at >= month_start)::numeric, 2), 0)
    ) into result
    from scoped;

  elsif p_page = 'inventory' then
    select jsonb_build_object(
      'stocked_items', count(*),
      'out_of_stock', count(*) filter (where coalesce(quantity, 0) <= 0),
      'low_stock', count(*) filter (where coalesce(quantity, 0) > 0 and coalesce(quantity, 0) < 10),
      'locations', count(distinct location_id)
    ) into result
    from inventory
    where location_id = any(p_location_ids) and coalesce(archived, false) = false;

  elsif p_page = 'warehouse' then
    select jsonb_build_object(
      'products', (select count(*) from products),
      'categories', (select count(*) from categories),
      'stocked_items', (select count(*) from inventory where location_id = any(p_location_ids) and coalesce(archived, false) = false),
      'out_of_stock', (select count(*) from inventory where location_id = any(p_location_ids) and coalesce(archived, false) = false and coalesce(quantity, 0) <= 0)
    ) into result;

  else
    result := '{}'::jsonb;
  end if;

  return coalesce(result, '{}'::jsonb);
end;
$$;

grant execute on function public.page_stats(text, bigint[]) to authenticated, service_role;
