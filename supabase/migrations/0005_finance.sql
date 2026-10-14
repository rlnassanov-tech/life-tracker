-- 0005: финансы — категории (с бюджетами), операции (расход/доход) в разных валютах

-- Основная валюта пользователя: в ней бюджеты и главные графики
alter table public.profiles add column currency text not null default 'KZT'
  check (currency in ('KZT', 'USD', 'EUR', 'RUB'));
grant update (currency) on public.profiles to authenticated;

create table public.fin_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  icon text not null default '📦',
  color text not null default '#64748b',
  kind text not null check (kind in ('expense', 'income')),
  monthly_budget numeric(14, 2) check (monthly_budget is null or monthly_budget > 0),
  archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  kind text not null check (kind in ('expense', 'income')),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'KZT' check (currency in ('KZT', 'USD', 'EUR', 'RUB')),
  date date not null,
  note text,
  created_at timestamptz not null default now(),
  -- как в sessions: операцию можно привязать только к своей категории
  foreign key (category_id, user_id) references public.fin_categories (id, user_id) on delete cascade
);

create index transactions_user_date on public.transactions (user_id, date);
create index fin_categories_user on public.fin_categories (user_id, kind, sort_order);

alter table public.fin_categories enable row level security;
alter table public.transactions enable row level security;

create policy "own fin categories" on public.fin_categories
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own transactions" on public.transactions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.fin_categories, public.transactions to authenticated;

-- ============ Стартовые категории ============
create function public.seed_fin_categories(uid uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.fin_categories (user_id, name, icon, color, kind, sort_order) values
    (uid, 'Еда',         '🍔', '#f97316', 'expense', 0),
    (uid, 'Кафе',        '☕', '#eab308', 'expense', 1),
    (uid, 'Транспорт',   '🚕', '#3b82f6', 'expense', 2),
    (uid, 'Дом',         '🏠', '#14b8a6', 'expense', 3),
    (uid, 'Связь',       '📱', '#6366f1', 'expense', 4),
    (uid, 'Учёба',       '📚', '#a855f7', 'expense', 5),
    (uid, 'Здоровье',    '💊', '#ef4444', 'expense', 6),
    (uid, 'Одежда',      '👕', '#ec4899', 'expense', 7),
    (uid, 'Развлечения', '🎮', '#84cc16', 'expense', 8),
    (uid, 'Подарки',     '🎁', '#f43f5e', 'expense', 9),
    (uid, 'Другое',      '📦', '#64748b', 'expense', 10),
    (uid, 'Стипендия',   '🎓', '#22c55e', 'income', 0),
    (uid, 'Работа',      '💼', '#10b981', 'income', 1),
    (uid, 'Фриланс',     '💻', '#06b6d4', 'income', 2),
    (uid, 'Подарки',     '🎁', '#f43f5e', 'income', 3),
    (uid, 'Другое',      '💰', '#64748b', 'income', 4);
$$;

revoke execute on function public.seed_fin_categories(uuid) from public, anon, authenticated;

-- Новым пользователям — сразу при регистрации (дополняем триггер из 0001)
create or replace function public.handle_new_user()
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

  perform public.seed_fin_categories(new.id);
  return new;
end;
$$;

-- Уже существующим пользователям
select public.seed_fin_categories(id) from public.profiles;
