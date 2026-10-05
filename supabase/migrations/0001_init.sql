-- 0001: профили, направления, записи (сессии) + RLS + стартовые направления

-- ============ profiles ============
-- Одна строка на пользователя. id совпадает с auth.users.id
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  water_goal_ml int not null default 2000,
  steps_goal int not null default 8000,
  created_at timestamptz not null default now()
);

-- ============ directions ============
create table public.directions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color text not null default '#3b82f6',
  icon text not null default '⭐',
  type text not null default 'general' check (type in ('general', 'university')),
  archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  -- нужно для составного внешнего ключа из sessions (см. ниже)
  unique (id, user_id)
);

-- Не больше одного направления «университет» на пользователя
create unique index directions_one_university on public.directions (user_id) where type = 'university';
create index directions_user on public.directions (user_id, sort_order);

-- ============ sessions ============
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  direction_id uuid not null,
  date date not null default current_date,
  duration_min int not null check (duration_min > 0 and duration_min <= 1440),
  title text,
  note text,
  created_at timestamptz not null default now(),
  -- Составной ключ: запись можно привязать только к СВОЕМУ направлению
  foreign key (direction_id, user_id) references public.directions (id, user_id) on delete cascade
);

create index sessions_user_date on public.sessions (user_id, date);
create index sessions_direction_date on public.sessions (direction_id, date);

-- ============ Row Level Security ============
-- Включённый RLS = по умолчанию нельзя ничего. Политики ниже разрешают
-- работать только со своими строками. (select auth.uid()) — так Postgres
-- вычисляет id один раз на запрос, а не на каждую строку.
alter table public.profiles enable row level security;
alter table public.directions enable row level security;
alter table public.sessions enable row level security;

create policy "own profile: read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own directions" on public.directions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own sessions" on public.sessions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.directions, public.sessions to authenticated;

-- ============ Новый пользователь ============
-- Когда в auth.users появляется человек, создаём ему профиль и стартовые направления.
-- security definer — функция работает с правами владельца, иначе RLS не дал бы вставить.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);

  insert into public.directions (user_id, name, icon, color, type, sort_order) values
    (new.id, 'Универ',     '🎓', '#3b82f6', 'university', 0),
    (new.id, 'Языки',      '🗣️', '#22c55e', 'general',    1),
    (new.id, 'Пианино',    '🎹', '#a855f7', 'general',    2),
    (new.id, 'Вайбкодинг', '💻', '#f97316', 'general',    3);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
