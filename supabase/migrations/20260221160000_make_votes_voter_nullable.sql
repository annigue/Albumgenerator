-- allow votes without legacy "voter" column (we use user_id now)
alter table public.votes
  alter column voter drop not null;
