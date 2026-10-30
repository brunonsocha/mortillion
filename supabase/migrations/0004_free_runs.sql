-- Marks runs that spent a free run (started without paid access), so the
-- rolling quota counts only those: a lapsed subscriber isn't locked out by
-- runs they played while subscribed.
alter table public.runs add column free boolean not null default false;
create index runs_free_recent on public.runs (user_id, created_at) where free;
