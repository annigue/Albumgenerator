-- participants table
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  email text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.participants enable row level security;

-- Jeder darf Teilnehmer-Liste lesen (nur Name reicht für Dropdown)
create policy "participants_select_public"
on public.participants
for select
to anon, authenticated
using (true);

-- Jeder darf sich selbst hinzufügen (Name + optional Email)
create policy "participants_insert_public"
on public.participants
for insert
to anon, authenticated
with check (
  length(trim(name)) >= 1
);
