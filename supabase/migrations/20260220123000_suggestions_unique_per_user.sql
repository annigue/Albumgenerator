-- allow multiple users to suggest same album, but only once per user
drop index if exists public.suggestions_spotify_id_uq;

create unique index if not exists suggestions_spotify_id_user_id_uq
  on public.suggestions (spotify_id, user_id);
