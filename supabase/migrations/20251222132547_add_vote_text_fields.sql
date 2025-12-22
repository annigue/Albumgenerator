alter table public.votes
  add column if not exists favorite_song text,
  add column if not exists favorite_lyric text,
  add column if not exists worst_song text;
