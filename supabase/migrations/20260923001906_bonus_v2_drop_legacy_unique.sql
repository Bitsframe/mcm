-- The legacy identity never worked: it is NULLS DISTINCT, so every seller row
-- (staff_id IS NULL) bypassed it, which is how 1,462 duplicate groups formed.
-- It is also incompatible with superseding rows instead of deleting them.
-- Replaced by individual_bonus_v2_identity. No rows are removed.
-- Applied to csm-staging 2026-09-23. NOT yet applied to production.
alter table public.individual_bonus drop constraint if exists individual_bonus_unique;

create index if not exists individual_bonus_staff_team_date_idx
  on public.individual_bonus (staff_id, sales_team_id, bonus_date);
