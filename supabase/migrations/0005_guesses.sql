-- Wrong guesses no longer end a prompt: the player keeps guessing until a valid
-- answer, the timer, or giving up. `misses` counts wrong guesses on the current
-- prompt (capped by the game server so answers can't be brute-forced).
alter table public.runs add column misses smallint not null default 0;
alter table public.turns add column misses smallint not null default 0;
