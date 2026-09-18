-- Everything the dashboard shows below the headline tiles, in one round trip:
-- the sales trend, what is booked next, stock by location, returns, and what
-- needs a human.
--
-- The 14-day series is dense — days with no sales come back as zero rather than
-- missing, because a bar chart that drops quiet days misstates the trend.
-- Appointment dates go through appointment_date(); see that function for why
-- the raw column cannot be compared as a string.
create or replace function public.dashboard_activity(p_location_ids bigint[])
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with days as (
    select generate_series(current_date - interval '13 days', current_date, interval '1 day')::date as d
  ),
  scoped_inventory as (
    select inventory_id, location_id, quantity, archived
    from inventory where location_id = any(p_location_ids)
  ),
  sales_by_day as (
    select sh.created_at::date as d, sum(sh.total_price) as revenue, count(*) as items
    from sales_history sh
    where sh.inventory_id in (select inventory_id from scoped_inventory)
      and sh.created_at >= current_date - interval '13 days'
    group by 1
  ),
  trend as (
    select jsonb_agg(
      jsonb_build_object(
        'day', to_char(days.d, 'YYYY-MM-DD'),
        'label', to_char(days.d, 'Mon DD'),
        'revenue', round(coalesce(sales_by_day.revenue, 0)::numeric, 2),
        'items', coalesce(sales_by_day.items, 0)
      ) order by days.d
    ) as rows
    from days left join sales_by_day on sales_by_day.d = days.d
  ),
  upcoming as (
    select jsonb_agg(x order by (x->>'sort_key')) as rows
    from (
      select jsonb_build_object(
        'id', a.id,
        'sort_key', to_char(appointment_date(a.date_and_time), 'YYYY-MM-DD'),
        'date', to_char(appointment_date(a.date_and_time), 'Mon DD'),
        'time', nullif(trim(split_part(a.date_and_time, ' - ', 2)), ''),
        'patient', nullif(trim(coalesce(a.first_name, '') || ' ' || coalesce(a.last_name, '')), ''),
        'service', a.service,
        'location', l.title,
        'approved', coalesce(a."isApproved", false)
      ) as x
      from "Appoinments" a
      left join "Locations" l on l.id = a.location_id
      where a.location_id = any(p_location_ids)
        and appointment_date(a.date_and_time) >= current_date
      order by appointment_date(a.date_and_time), a.date_and_time
      limit 6
    ) s
  ),
  stock_by_location as (
    select jsonb_agg(x order by (x->>'out_of_stock')::int desc) as rows
    from (
      select jsonb_build_object(
        'location', l.title,
        'stocked', count(*),
        'out_of_stock', count(*) filter (where coalesce(si.quantity, 0) <= 0),
        'low_stock', count(*) filter (where coalesce(si.quantity, 0) > 0 and coalesce(si.quantity, 0) < 10)
      ) as x
      from scoped_inventory si
      join "Locations" l on l.id = si.location_id
      where coalesce(si.archived, false) = false
      group by l.title
      order by count(*) filter (where coalesce(si.quantity, 0) <= 0) desc
      limit 8
    ) s
  ),
  returns_summary as (
    select jsonb_build_object(
      'total', count(*),
      'quantity', coalesce(sum(r.quantity), 0),
      'this_month', count(*) filter (where r.return_date >= date_trunc('month', now())),
      'latest', max(r.return_date),
      'by_reason', coalesce((
        select jsonb_agg(jsonb_build_object('reason', reason, 'count', n, 'quantity', q) order by n desc)
        from (
          select coalesce(nullif(trim(r2.reason), ''), 'Unspecified') as reason,
                 count(*) as n, coalesce(sum(r2.quantity), 0) as q
          from returns r2
          where r2.inventory_id in (select inventory_id from scoped_inventory)
          group by 1 order by count(*) desc limit 6
        ) t
      ), '[]'::jsonb)
    ) as obj
    from returns r
    where r.inventory_id in (select inventory_id from scoped_inventory)
  ),
  attention as (
    select jsonb_build_object(
      'pending_approvals', (
        select count(*) from "Appoinments"
        where location_id = any(p_location_ids)
          and "isApproved" is not true
          and appointment_date(date_and_time) >= current_date
      ),
      'out_of_stock', (
        select count(*) from scoped_inventory
        where coalesce(archived, false) = false and coalesce(quantity, 0) <= 0
      ),
      'low_stock', (
        select count(*) from scoped_inventory
        where coalesce(archived, false) = false
          and coalesce(quantity, 0) > 0 and coalesce(quantity, 0) < 10
      )
    ) as obj
  )
  select jsonb_build_object(
    'sales_trend', coalesce((select rows from trend), '[]'::jsonb),
    'upcoming', coalesce((select rows from upcoming), '[]'::jsonb),
    'stock_by_location', coalesce((select rows from stock_by_location), '[]'::jsonb),
    'returns', (select obj from returns_summary),
    'attention', (select obj from attention)
  );
$$;

grant execute on function public.dashboard_activity(bigint[]) to authenticated, service_role;
