-- Align DB schema with app auth flow (users, participants, votes, suggestions)

-- =========================
-- participants
-- =========================
alter table public.participants
  add column if not exists user_id uuid,
  add column if not exists display_name text;

-- backfill display_name from legacy "name" (only if column exists)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'participants'
      and column_name = 'name'
  ) then
    execute 'update public.participants set display_name = name where display_name is null and name is not null';
  end if;
end $$;

-- ensure unique user_id for upserts
create unique index if not exists participants_user_id_uq
  on public.participants (user_id);

-- RLS policies (replace legacy public policies)
drop policy if exists "participants_select_public" on public.participants;
drop policy if exists "participants_insert_public" on public.participants;
drop policy if exists "participants_select_own" on public.participants;
drop policy if exists "participants_insert_own" on public.participants;
drop policy if exists "participants_update_own" on public.participants;

create policy "participants_select_own"
on public.participants
for select
to authenticated
using (auth.uid() = user_id);

create policy "participants_insert_own"
on public.participants
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "participants_update_own"
on public.participants
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================
-- votes
-- =========================
alter table public.votes
  add column if not exists user_id uuid;

-- unique per album + user
create unique index if not exists votes_unique_user_per_album
  on public.votes (album_week_id, user_id);

drop policy if exists "read votes (anon)" on public.votes;
drop policy if exists "votes_insert_own" on public.votes;
drop policy if exists "votes_update_own" on public.votes;

create policy "read votes (anon)"
on public.votes
for select
to anon, authenticated
using (true);

create policy "votes_insert_own"
on public.votes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "votes_update_own"
on public.votes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================
-- suggestions
-- =========================
alter table public.suggestions
  add column if not exists user_id uuid,
  add column if not exists reason text,
  add column if not exists favorite_song text,
  add column if not exists favorite_lyric text,
  add column if not exists worst_song text;

drop policy if exists "read suggestions (anon)" on public.suggestions;
drop policy if exists "suggestions_insert_own" on public.suggestions;
drop policy if exists "suggestions_update_own" on public.suggestions;

create policy "read suggestions (anon)"
on public.suggestions
for select
to anon, authenticated
using (true);

create policy "suggestions_insert_own"
on public.suggestions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "suggestions_update_own"
on public.suggestions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
