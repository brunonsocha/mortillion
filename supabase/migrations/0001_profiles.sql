-- One row per player. Subscription fields are written only by the Stripe
-- webhook (service role); players can read their own row and nothing else.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  -- Stripe subscription status: active, trialing, past_due, canceled, …
  subscription_status text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "players read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- No insert/update/delete policies: only the service role may write.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
