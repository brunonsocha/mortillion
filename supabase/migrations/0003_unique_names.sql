-- Leaderboard names are unique (ignoring case) so nobody can impersonate
-- another player. Existing duplicates keep the oldest; later ones are cleared.
update public.profiles p set display_name = null
where display_name is not null
  and exists (
    select 1 from public.profiles q
    where lower(q.display_name) = lower(p.display_name) and q.updated_at < p.updated_at
  );

create unique index profiles_display_name_unique on public.profiles (lower(display_name)) where display_name is not null;
