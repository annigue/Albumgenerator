-- Extensions
create extension if not exists "pgcrypto";

-- =========================
-- Tables
-- =========================

-- 1) Vorschläge (Pool)
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  spotify_id text not null,
  spotify_url text,
  cover_url text,

  title text not null,
  artist text,
  suggested_by text,      -- optional: name/handle
  note text,              -- optional
  is_active boolean not null default true
);

create unique index if not exists suggestions_spotify_id_uq
  on public.suggestions (spotify_id);

-- 2) Album der Woche (Historie)
create table if not exists public.albums_of_week (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  week_start_date date not null,
  spotify_id text not null,
  title text not null,
  artist text,
  spotify_url text,
  cover_url text
);

create unique index if not exists albums_of_week_week_uq
  on public.albums_of_week (week_start_date);

-- 3) Votes
-- rating: 1=Hit, 0=geht in Ordnung, -1=Niete
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  album_week_id uuid not null references public.albums_of_week(id) on delete cascade,
  voter text not null,
  rating smallint not null check (rating in (-1, 0, 1)),
  comment text
);

create unique index if not exists votes_unique_voter_per_album
  on public.votes (album_week_id, voter);

-- =========================
-- RLS + Policies
-- =========================

-- Wir aktivieren RLS überall.
alter table public.suggestions enable row level security;
alter table public.albums_of_week enable row level security;
alter table public.votes enable row level security;

-- Fürs Frontend erlauben wir erstmal nur LESEN (SELECT) für "anon".
-- Schreiboperationen laufen über deinen Server mit service_role (bypasst RLS).
create policy "read suggestions (anon)"
on public.suggestions
for select
to anon
using (true);

create policy "read albums_of_week (anon)"
on public.albums_of_week
for select
to anon
using (true);

create policy "read votes (anon)"
on public.votes
for select
to anon
using (true);
