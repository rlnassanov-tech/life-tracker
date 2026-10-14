-- 0006: баланс — сколько денег у пользователя «сейчас», по каждой валюте.
-- Пользователь вводит сумму вручную (amount) — она верна на момент as_of.
-- Текущий баланс = amount + доходы − расходы по операциям, добавленным ПОСЛЕ as_of.
-- Ввёл заново — отсчёт начинается с нового момента (так исправляются расхождения).

create table public.balances (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  currency text not null check (currency in ('KZT', 'USD', 'EUR', 'RUB')),
  amount numeric(14, 2) not null,
  as_of timestamptz not null default now(),
  primary key (user_id, currency)
);

alter table public.balances enable row level security;

create policy "own balances" on public.balances
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.balances to authenticated;

-- Быстрый поиск операций, добавленных после момента ввода баланса
create index transactions_user_created on public.transactions (user_id, currency, created_at);
