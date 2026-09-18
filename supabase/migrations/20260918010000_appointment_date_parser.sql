-- Appoinments.date_and_time is not a date. It is text shaped
--   "<location_id>|DD-MM-YYYY - h:mm AM"
-- with day-first dates, a pipe-prefixed location id, some rows holding the
-- literal string 'NULL', and rows matching no shape at all.
--
-- Comparing it as a string — left(date_and_time, 10) >= '2026-09-18' — looks
-- plausible and is meaningless: it compares the location prefix, so every row
-- whose id starts with a high digit counts as "upcoming". That reported 468
-- upcoming appointments where there are 66, and 89 awaiting approval where
-- there are 5.
--
-- Parse it in one place. Unparseable rows return null and drop out of date
-- filters rather than landing in an arbitrary bucket.
create or replace function public.appointment_date(p_raw text)
returns date
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_raw ~ '\d{2}-\d{2}-\d{4}'
      then to_date(substring(p_raw from '\d{2}-\d{2}-\d{4}'), 'DD-MM-YYYY')
  end;
$$;

grant execute on function public.appointment_date(text) to authenticated, service_role;
