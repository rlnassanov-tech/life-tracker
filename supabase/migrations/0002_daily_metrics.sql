-- 0002: ежедневные показатели — сон, вода, шаги. Одна строка на пользователя в день.

create table public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  -- Сон относится ко дню ПОДЪЁМА: лёг 5-го в 23:30, встал 6-го в 7:00 → строка за 6-е
  sleep_start time,
  sleep_end time,
  -- Часы сна считает сама база. Если подъём «раньше» отбоя по часам — значит, через полночь (+24 ч)
  sleep_hours numeric(4, 2) generated always as (
    case
      when sleep_start is null or sleep_end is null then null
      else round((extract(epoch from (sleep_end - sleep_start)) / 3600
        + case when sleep_end <= sleep_start then 24 else 0 end)::numeric, 2)
    end
  ) stored,
  water_ml int not null default 0 check (water_ml >= 0 and water_ml <= 20000),
  steps int not null default 0 check (steps >= 0 and steps <= 200000),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.daily_metrics enable row level security;

create policy "own metrics" on public.daily_metrics
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.daily_metrics to authenticated;
