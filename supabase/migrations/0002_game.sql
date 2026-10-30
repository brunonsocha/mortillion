-- Server-side play: every run, turn and achievement is recorded by the `game`
-- Edge Function (service role). Players can read their own rows; nobody can
-- write from the browser. Leaderboards are served by the function too, so no
-- other player's private data is ever exposed.

alter table public.profiles
  add column display_name text check (display_name is null or char_length(display_name) between 2 and 24),
  -- Paid access that never expires (one-time "full version" purchase).
  add column full_access boolean not null default false,
  add column purchased_at timestamptz,
  add column purchase_currency text,
  -- Mirrors auth.users.is_anonymous so leaderboards can filter in one query.
  add column is_anonymous boolean not null default true;

update public.profiles p set is_anonymous = coalesce(u.is_anonymous, false) from auth.users u where u.id = p.id;

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('daily', 'pack', 'endless', 'archive', 'party')),
  pack text,
  -- Day number of the Daily Descent this run belongs to (daily/archive), else the
  -- player's day when the run started.
  day int not null,
  prompt_ids text[] not null,
  seats smallint not null default 1 check (seats between 1 and 6),
  lives smallint,
  -- The prompt being answered and when it was shown (for the 25 s limit).
  cursor int not null default 0,
  seat smallint not null default 0,
  served_at timestamptz,
  points int not null default 0,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- Lets the API embed the player's profile (display name) in leaderboard rows.
alter table public.runs add constraint runs_profile_fk foreign key (user_id) references public.profiles (id) on delete cascade;

create index runs_user_created on public.runs (user_id, created_at desc);
create index runs_daily_board on public.runs (day, points desc) where mode = 'daily' and finished_at is not null;
create index runs_endless_board on public.runs (points desc) where mode = 'endless' and finished_at is not null;
-- One Daily Descent per player per day, enforced by the database itself.
create unique index runs_one_daily on public.runs (user_id, day) where mode = 'daily';

create table public.turns (
  run_id uuid not null references public.runs (id) on delete cascade,
  idx int not null,
  seat smallint not null default 0,
  prompt_id text not null,
  guess text not null default '',
  -- English name of the matched answer, null when rejected or timed out.
  answer text,
  tier smallint not null default 0 check (tier between 0 and 6),
  points int not null default 0,
  created_at timestamptz not null default now(),
  primary key (run_id, idx, seat)
);

create table public.achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.runs enable row level security;
alter table public.turns enable row level security;
alter table public.achievements enable row level security;

create policy "players read their own runs" on public.runs
  for select using (auth.uid() = user_id);

create policy "players read their own turns" on public.turns
  for select using (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()));

create policy "players read their own achievements" on public.achievements
  for select using (auth.uid() = user_id);

-- Anonymous players get a profile too (email is null until they sign in).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_anonymous) values (new.id, new.email, coalesce(new.is_anonymous, false))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Keep profiles in step when an anonymous player links an email or Google.
create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email, is_anonymous = coalesce(new.is_anonymous, false), updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email, is_anonymous on auth.users
  for each row execute procedure public.handle_user_update();
