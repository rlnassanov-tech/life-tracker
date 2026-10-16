-- 0007: свободный дневник — «чем занимался, с какого по какое время», с необязательной меткой

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  tag text check (tag is null or length(trim(tag)) > 0), -- «учёба», «код»… без решётки
  date date not null,                                     -- день начала занятия
  start_time time not null,
  end_time time not null,
  -- Длительность считает база. Конец «раньше» начала по часам — значит, через полночь (+24 ч)
  duration_min int generated always as (
    (extract(epoch from (end_time - start_time)) / 60)::int
      + case when end_time <= start_time then 1440 else 0 end
  ) stored,
  created_at timestamptz not null default now()
);

create index activities_user_date on public.activities (user_id, date, start_time);

alter table public.activities enable row level security;

create policy "own activities" on public.activities
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.activities to authenticated;
