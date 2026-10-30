-- "Skip question": a prompt passed over without dying. It scores nothing, the
-- knight doesn't advance, and in the Endless Road no Estus flask is spent.
alter table public.turns add column skipped boolean not null default false;
