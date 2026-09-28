-- The two functions behind the /bonus/staff page. They were created directly
-- against csm-staging when the page was built and never captured here, so
-- production -- and any rebuilt staging -- reports
-- "Could not find the function public.bonus_staff_summary in the schema cache".
--
-- Bodies are as they stand in csm-staging on 2026-09-25. Both depend on the
-- individual_bonus columns added by bonus_v2_schema and bonus_v3, so those
-- migrations must be applied first.
--
-- NOT yet applied to production.

-- One row per staff member: where they work, when they were last paid, and
-- what is still owed. Only live v3 rows count; superseded recalculations and
-- the retired v2 pipeline are excluded so no stale money reaches the screen.
create or replace function public.bonus_staff_summary(
  p_staff_ids    bigint[] default null,
  p_location_ids bigint[] default null,
  p_from         date     default null,
  p_to           date     default null
)
returns table (
  staff_id       bigint,
  full_name      text,
  locations      text[],
  location_ids   bigint[],
  last_paid_date date,
  pending        numeric,
  paid           numeric,
  pending_rows   integer
)
language sql
stable
as $function$
  select s.id,
         s.full_name,
         coalesce(array_agg(distinct l.title) filter (where l.title is not null), '{}'),
         coalesce(array_agg(distinct ib.location_id) filter (where ib.location_id is not null), '{}'),
         max(ib.paid_date) filter (where ib.paid),
         coalesce(sum(ib.bonus) filter (where not ib.paid), 0)::numeric(12,2),
         coalesce(sum(ib.bonus) filter (where ib.paid), 0)::numeric(12,2),
         count(*) filter (where not ib.paid)::integer
  from public.individual_bonus ib
  join public.staff s on s.id = ib.staff_id
  left join public."Locations" l on l.id = ib.location_id
  where ib.calc_version = 3
    and ib.superseded_at is null
    and (p_staff_ids    is null or ib.staff_id    = any (p_staff_ids))
    and (p_location_ids is null or ib.location_id = any (p_location_ids))
    and (p_from is null or ib.bonus_date >= p_from)
    and (p_to   is null or ib.bonus_date <= p_to)
  group by s.id, s.full_name
  order by s.full_name;
$function$;

-- Marks the matching unpaid v3 rows as paid and reports what was settled.
-- paid_date is the Central-time business date, matching the rest of the
-- bonus pipeline.
create or replace function public.bonus_mark_staff_paid(
  p_staff_ids    bigint[],
  p_location_ids bigint[] default null,
  p_from         date     default null,
  p_to           date     default null,
  p_paid_by      uuid     default null
)
returns table (rows_paid integer, amount_paid numeric)
language plpgsql
as $function$
declare
  v_rows integer := 0;
  v_amt  numeric(12,2) := 0;
begin
  if p_staff_ids is null or array_length(p_staff_ids, 1) is null then
    raise exception 'at least one staff member must be given';
  end if;

  with updated as (
    update public.individual_bonus ib
       set paid = true,
           paid_date = (now() at time zone 'America/Chicago')::date,
           paid_by = p_paid_by
     where ib.calc_version = 3
       and ib.superseded_at is null
       and not ib.paid
       and ib.staff_id = any (p_staff_ids)
       and (p_location_ids is null or ib.location_id = any (p_location_ids))
       and (p_from is null or ib.bonus_date >= p_from)
       and (p_to   is null or ib.bonus_date <= p_to)
    returning ib.bonus
  )
  select count(*)::integer, coalesce(sum(bonus), 0)::numeric(12,2)
    into v_rows, v_amt
  from updated;

  rows_paid := v_rows;
  amount_paid := v_amt;
  return next;
end;
$function$;

-- Both are reached only through the service-role client in
-- app/api/bonuses/{staff-summary,staff-pay}; one reads payroll totals and the
-- other moves money, so neither is callable by a signed-in browser.
revoke execute on function public.bonus_staff_summary(bigint[], bigint[], date, date) from anon, authenticated;
revoke execute on function public.bonus_mark_staff_paid(bigint[], bigint[], date, date, uuid) from anon, authenticated;
