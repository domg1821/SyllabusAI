-- ─── PHASE 1: SyllabusAI Schema ────────────────────────────────────────────────
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE / on conflict do nothing)


-- ─── profiles ──────────────────────────────────────────────────────────────────
-- One row per auth user. Auto-created by trigger on sign-up.
-- is_pro is the authoritative Pro flag — set by Stripe webhook only.

create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  is_pro              boolean not null default false,
  stripe_customer_id  text,
  created_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: owner can read"   on public.profiles;
drop policy if exists "profiles: owner can update" on public.profiles;

create policy "profiles: owner can read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner can update"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow users to insert their own profile row.
-- Needed for users created before the handle_new_user trigger was deployed.
drop policy if exists "profiles: owner can insert" on public.profiles;
create policy "profiles: owner can insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Track how many free analyses a user has consumed.
-- Server-enforced in /api/analyze; client reads this for display only.
alter table public.profiles
  add column if not exists analysis_count integer not null default 0;

-- Trigger: auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── courses ───────────────────────────────────────────────────────────────────
-- One row per saved course per user.
-- All structured data stored as JSONB so the TypeScript shapes map directly.

create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null default '',
  code          text not null default '',
  course_info   jsonb not null default '{}',
  items         jsonb not null default '[]',
  study_plan    jsonb not null default '[]',
  weekly_topics jsonb,
  grades        jsonb not null default '[]',
  raw_text      text,           -- stored for Phase 8 (syllabus rescan)
  created_at    timestamptz not null default now()
);

alter table public.courses enable row level security;

drop policy if exists "courses: owner full access" on public.courses;

create policy "courses: owner full access"
  on public.courses for all
  using (auth.uid() = user_id);


-- ─── practice_sessions ─────────────────────────────────────────────────────────
-- One row per completed practice test.
-- Used in Phase 3 (spaced repetition / score history).

create table if not exists public.practice_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  course_id       uuid references public.courses(id) on delete set null,
  topic           text not null default '',
  difficulty      text not null default 'medium',
  question_type   text not null default 'mixed',
  score           integer,              -- null for SA-only tests
  total_questions integer not null default 0,
  correct_count   integer not null default 0,
  mc_count        integer not null default 0,
  questions       jsonb not null default '[]',
  user_answers    jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

alter table public.practice_sessions enable row level security;

drop policy if exists "practice_sessions: owner full access" on public.practice_sessions;

create policy "practice_sessions: owner full access"
  on public.practice_sessions for all
  using (auth.uid() = user_id);
