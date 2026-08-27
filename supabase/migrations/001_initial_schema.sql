create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  age integer not null check (age > 0 and age <= 120),
  sex text not null check (sex in ('M', 'F')),
  current_weight numeric(6,2) not null check (current_weight > 0),
  ideal_weight numeric(6,2),
  height_cm numeric(6,2) not null check (height_cm > 0),
  created_at timestamptz not null default now()
);

create table public.diets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  calories integer not null check (calories > 0),
  calculation_method text not null,
  carbs_pct numeric(5,2) not null check (carbs_pct >= 0 and carbs_pct <= 100),
  protein_pct numeric(5,2) not null check (protein_pct >= 0 and protein_pct <= 100),
  fat_pct numeric(5,2) not null check (fat_pct >= 0 and fat_pct <= 100),
  created_at timestamptz not null default now()
);

create table public.diet_meals (
  id uuid primary key default gen_random_uuid(),
  diet_id uuid not null references public.diets(id) on delete cascade,
  name text not null,
  meal_order integer not null,
  created_at timestamptz not null default now()
);

create table public.diet_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.diet_meals(id) on delete cascade,
  preparation_name text not null,
  food_name text not null,
  grams numeric(8,2) not null default 0,
  equivalent numeric(8,2) not null default 0,
  unit text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.diets enable row level security;
alter table public.diet_meals enable row level security;
alter table public.diet_ingredients enable row level security;

create policy "Users manage own profile" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own patients" on public.patients
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own diets" on public.diets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage meals from own diets" on public.diet_meals
for all using (exists (select 1 from public.diets where diets.id = diet_meals.diet_id and diets.user_id = auth.uid()))
with check (exists (select 1 from public.diets where diets.id = diet_meals.diet_id and diets.user_id = auth.uid()));

create policy "Users manage ingredients from own meals" on public.diet_ingredients
for all using (exists (
  select 1 from public.diet_meals
  join public.diets on diets.id = diet_meals.diet_id
  where diet_meals.id = diet_ingredients.meal_id and diets.user_id = auth.uid()
))
with check (exists (
  select 1 from public.diet_meals
  join public.diets on diets.id = diet_meals.diet_id
  where diet_meals.id = diet_ingredients.meal_id and diets.user_id = auth.uid()
));
