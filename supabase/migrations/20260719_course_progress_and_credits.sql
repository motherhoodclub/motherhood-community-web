-- Course progress tracking + admin-granted bonus course credits.

-- Per-user completed lessons ("library" model: no scoring, just done/not-done).
create table if not exists course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  lesson_id uuid not null references course_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists idx_course_progress_user_course on course_progress(user_id, course_id);

alter table course_progress enable row level security;

drop policy if exists "progress readable by owner" on course_progress;
create policy "progress readable by owner" on course_progress
  for select using (auth.uid() = user_id);

-- Extra course credits an admin can grant a user on top of their plan's
-- allowance (see lib/entitlements.ts / lib/courses.ts).
alter table if exists user_profiles
  add column if not exists bonus_course_credits integer not null default 0;
