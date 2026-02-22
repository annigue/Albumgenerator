-- Pick a random "Album der Woche" every Friday 00:00 (Europe/Berlin)
-- Requires pg_cron extension
create extension if not exists pg_cron;

-- Function: pick random active suggestion not used before
create or replace function public.pick_album_of_week()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  berlin_now timestamp;
  week_date date;
begin
  berlin_now := (now() at time zone 'Europe/Berlin');
  week_date := berlin_now::date;

  -- Do nothing if album already set for this date
  if exists (
    select 1 from public.albums_of_week a
    where a.week_start_date = week_date
  ) then
    return;
  end if;

  -- Insert one random active suggestion that wasn't used before
  insert into public.albums_of_week
    (week_start_date, spotify_id, title, artist, spotify_url, cover_url)
  select
    week_date,
    s.spotify_id,
    s.title,
    s.artist,
    s.spotify_url,
    s.cover_url
  from public.suggestions s
  where s.is_active is true
    and not exists (
      select 1 from public.albums_of_week a
      where a.spotify_id = s.spotify_id
    )
  order by random()
  limit 1;
end;
$$;

-- Trigger: if a new suggestion arrives and no album is set for the week,
-- pick immediately (useful when suggestions are empty at cron time)
create or replace function public.pick_album_of_week_on_suggestion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.pick_album_of_week();
  return new;
end;
$$;

drop trigger if exists trg_pick_album_on_suggestion on public.suggestions;
create trigger trg_pick_album_on_suggestion
after insert on public.suggestions
for each row
execute function public.pick_album_of_week_on_suggestion();

-- (Re)create cron job: daily at 20:00
select cron.unschedule('pick_album_of_week_daily_2000_berlin');
select cron.schedule(
  'pick_album_of_week_daily_2000_berlin',
  '0 20 * * *',
  $$select public.pick_album_of_week();$$
);
