-- Tier 4 of 4 — one column on a live table.
--
-- orders.encounter_id pointed at the abandoned `encounter` table, dropped in
-- tier 3. It is set on 7 of 21,873 production rows and on none in staging, so
-- this discards seven links and nothing else. Export those seven first if the
-- association means anything:
--
--   select id, encounter_id from orders where encounter_id is not null;
--
-- This is the only statement in the set that touches a table the business
-- still uses, which is why it is last and alone.

begin;

alter table if exists public.orders drop column if exists encounter_id;

commit;
