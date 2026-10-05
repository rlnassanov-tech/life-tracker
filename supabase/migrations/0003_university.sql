-- 0003: универ — предметы, посещаемость пар, оценки

create table public.uni_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

-- Отметка о паре. За день по предмету может быть несколько пар — поэтому без уникальности
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null,
  date date not null,
  attended boolean not null,
  created_at timestamptz not null default now(),
  -- как в sessions: привязать можно только к своему предмету
  foreign key (subject_id, user_id) references public.uni_subjects (id, user_id) on delete cascade
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null,
  date date not null,
  grade numeric(5, 2) not null check (grade >= 0 and grade <= 100),
  kind text not null default 'other' check (kind in ('srs', 'rk', 'exam', 'lab', 'test', 'homework', 'other')),
  note text,
  created_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.uni_subjects (id, user_id) on delete cascade
);

create index attendance_subject on public.attendance (subject_id, date);
create index grades_subject on public.grades (subject_id, date);

alter table public.uni_subjects enable row level security;
alter table public.attendance enable row level security;
alter table public.grades enable row level security;

create policy "own subjects" on public.uni_subjects
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own attendance" on public.attendance
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own grades" on public.grades
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.uni_subjects, public.attendance, public.grades to authenticated;
