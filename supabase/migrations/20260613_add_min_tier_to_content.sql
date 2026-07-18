-- Tier-based content gating.
--
-- Adds an admin-controllable `min_tier` to gateable content. The value is a
-- tier RANK (see lib/entitlements.ts):
--   0 = any active subscriber (default)
--   2 = "plus" (6-month / semi-annual) and above
--   3 = "premium" (yearly) only
--
-- A user may open an item when their access rank >= the item's min_tier.

-- Workshops: gate live-workshop access and past-workshop recordings.
alter table if exists workshops
  add column if not exists min_tier smallint not null default 0;

-- Downloadable files: gate the premium / bonus file library.
alter table if exists downloadable_files
  add column if not exists min_tier smallint not null default 0;

comment on column workshops.min_tier is
  'Minimum subscription tier rank required to access this workshop (0=all, 2=6-month+, 3=yearly). See lib/entitlements.ts';
comment on column downloadable_files.min_tier is
  'Minimum subscription tier rank required to download this file (0=all, 2=6-month+, 3=yearly). See lib/entitlements.ts';
