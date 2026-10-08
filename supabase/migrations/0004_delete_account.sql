-- 0004: пользователь может удалить свой аккаунт сам.
-- Удаляем строку в auth.users — все его данные удалятся каскадом (on delete cascade во всех таблицах).
-- security definer — функция работает с правами владельца: обычному пользователю
-- писать в auth.users нельзя, а удалить можно только СЕБЯ (where id = auth.uid()).
create function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
