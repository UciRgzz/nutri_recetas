create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  patient_name text not null,
  appointment_date date not null,
  appointment_time text,
  notes text,
  status text not null default 'pendiente' check (status in ('pendiente', 'atendido')),
  created_at timestamptz not null default now()
);

alter table public.appointments enable row level security;

create policy "Users manage own appointments" on public.appointments
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index appointments_user_date_idx on public.appointments (user_id, appointment_date);
