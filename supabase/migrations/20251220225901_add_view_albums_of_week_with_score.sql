-- View: albums_of_week_with_score
create or replace view public.albums_of_week_with_score as
select
  a.id as album_week_id,
  a.week_start_date,
  a.title,
  a.artist,
  a.spotify_id,
  a.spotify_url,
  a.cover_url,

  count(v.id) as votes_total,

  sum(case when v.rating = 1 then 1 else 0 end) as hits,
  sum(case when v.rating = 0 then 1 else 0 end) as okays,
  sum(case when v.rating = -1 then 1 else 0 end) as flops,

  avg(v.rating)::numeric(4,2) as avg_rating,

  case
    when count(v.id) = 0 then null
    when avg(v.rating) >= 0.5 then 'hit'
    when avg(v.rating) <= -0.5 then 'niete'
    else 'ok'
  end as final_rating
from public.albums_of_week a
left join public.votes v
  on v.album_week_id = a.id
group by
  a.id,
  a.week_start_date,
  a.title,
  a.artist,
  a.spotify_id,
  a.spotify_url,
  a.cover_url;

-- Permissions (für publishable/anon read)
grant select on public.albums_of_week_with_score to anon;
