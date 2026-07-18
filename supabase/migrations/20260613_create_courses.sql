-- Courses module: recorded courses organised into sections -> lessons.
-- Access model: tier-gated eligibility + per-user "choose N" credits.
--   * A course is eligible when the user's tier rank >= courses.min_tier.
--   * If requires_credit = true, the user must spend a course credit to unlock
--     it (recorded in course_enrollments). Annual members get a credit balance
--     (see lib/entitlements.ts). Admins bypass everything.
-- Videos are external embeds (YouTube / Vimeo) stored as a URL per lesson.

create extension if not exists "pgcrypto";

-- Courses ---------------------------------------------------------------------
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  min_tier smallint not null default 3,       -- default: annual only
  requires_credit boolean not null default true,
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sections (modules) within a course -----------------------------------------
create table if not exists course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Lessons within a section ----------------------------------------------------
create table if not exists course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  section_id uuid references course_sections(id) on delete cascade,
  title text not null,
  description text,
  video_url text,                             -- external embed (YouTube/Vimeo)
  duration text,                              -- free-form, e.g. "12:30"
  attachment_url text,                        -- optional downloadable resource
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Per-user unlocked courses (credit redemptions) ------------------------------
create table if not exists course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists idx_course_sections_course on course_sections(course_id);
create index if not exists idx_course_lessons_course on course_lessons(course_id);
create index if not exists idx_course_lessons_section on course_lessons(section_id);
create index if not exists idx_course_enrollments_user on course_enrollments(user_id);

-- updated_at trigger for courses
create or replace function set_courses_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_courses_updated_at on courses;
create trigger trg_courses_updated_at
  before update on courses
  for each row execute function set_courses_updated_at();

-- RLS -------------------------------------------------------------------------
-- Reads of course metadata are safe for any authenticated user (video URLs are
-- only ever returned by the gated API route, never selected directly by the
-- client). Writes and enrollment go through service-role API routes.
alter table courses enable row level security;
alter table course_sections enable row level security;
alter table course_lessons enable row level security;
alter table course_enrollments enable row level security;

drop policy if exists "courses readable by authenticated" on courses;
create policy "courses readable by authenticated" on courses
  for select using (auth.role() = 'authenticated');

drop policy if exists "sections readable by authenticated" on course_sections;
create policy "sections readable by authenticated" on course_sections
  for select using (auth.role() = 'authenticated');

-- NOTE: lessons carry video_url; the client never selects this table directly.
-- Only the service-role API (which strips video_url when access is denied)
-- reads it, so no SELECT policy is granted to regular users.

drop policy if exists "enrollments readable by owner" on course_enrollments;
create policy "enrollments readable by owner" on course_enrollments
  for select using (auth.uid() = user_id);
