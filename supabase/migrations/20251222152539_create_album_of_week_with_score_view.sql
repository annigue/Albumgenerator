create or replace view public.album_of_week_with_score as
select
  a.id,
  a.week_start_date,
  a.spotify_id,
  a.spotify_url,
  a.cover_url,
  a.title,
  a.artist,

  count(v.id) as votes_total,
  sum(case when v.rating = 1 then 1 else 0 end) as hits,
  sum(case when v.rating = 0 then 1 else 0 end) as okays,
  sum(case when v.rating = -1 then 1 else 0 end) as flops,

  case
    when count(v.id) = 0 then 'KEINE STIMMEN'
    when sum(case when v.rating = 1 then 1 else 0 end) >= greatest(
      sum(case when v.rating = 0 then 1 else 0 end),
      sum(case when v.rating = -1 then 1 else 0 end)
    ) then 'Hit'
    when sum(case when v.rating = 0 then 1 else 0 end) >= greatest(
      sum(case when v.rating = 1 then 1 else 0 end),
      sum(case when v.rating = -1 then 1 else 0 end)
    ) then 'Geht in Ordnung'
    else 'Niete'
  end as final_rating
from public.albums_of_week a
left join public.votes v on v.album_week_id = a.id
group by a.id;
