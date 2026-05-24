-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'family')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Recipes
create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  emoji text default '🍽️',
  category text check (category in ('breakfast','lunch','dinner','dessert','vegetarian','snack')),
  cook_time_minutes integer,
  servings integer default 4,
  calories_per_serving integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  ingredients jsonb default '[]',
  steps jsonb default '[]',
  tags text[] default '{}',
  is_public boolean default true,
  likes_count integer default 0,
  created_at timestamptz default now()
);

alter table public.recipes enable row level security;
create policy "Anyone can view public recipes" on public.recipes for select using (is_public = true or auth.uid() = user_id);
create policy "Users can insert own recipes" on public.recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on public.recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes for delete using (auth.uid() = user_id);

-- Recipe likes
create table public.recipe_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, recipe_id)
);
alter table public.recipe_likes enable row level security;
create policy "Users can manage own likes" on public.recipe_likes using (auth.uid() = user_id);
create policy "Anyone can view likes" on public.recipe_likes for select using (true);

-- Saved recipes
create table public.saved_recipes (
  user_id uuid references public.profiles(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, recipe_id)
);
alter table public.saved_recipes enable row level security;
create policy "Users can manage own saves" on public.saved_recipes using (auth.uid() = user_id);

-- Macro logs
create table public.macro_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  logged_at date default current_date,
  food_name text not null,
  calories integer not null,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  fiber_g numeric default 0,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  created_at timestamptz default now()
);
alter table public.macro_logs enable row level security;
create policy "Users can manage own logs" on public.macro_logs using (auth.uid() = user_id);

-- Macro targets
create table public.macro_targets (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  calories integer default 2000,
  protein_g integer default 100,
  carbs_g integer default 250,
  fat_g integer default 65,
  fiber_g integer default 25,
  updated_at timestamptz default now()
);
alter table public.macro_targets enable row level security;
create policy "Users can manage own targets" on public.macro_targets using (auth.uid() = user_id);

-- Meal plan
create table public.meal_plan (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  plan_date date not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  recipe_id uuid references public.recipes(id) on delete set null,
  custom_meal_name text,
  created_at timestamptz default now(),
  unique (user_id, plan_date, meal_type)
);
alter table public.meal_plan enable row level security;
create policy "Users can manage own meal plan" on public.meal_plan using (auth.uid() = user_id);

-- Seed some sample recipes
insert into public.recipes (user_id, title, emoji, category, cook_time_minutes, servings, calories_per_serving, protein_g, carbs_g, fat_g, ingredients, steps, tags, likes_count) values
  ('00000000-0000-0000-0000-000000000000', 'Spaghetti Carbonara', '🍝', 'dinner', 30, 4, 620, 28, 68, 24,
   '[{"qty":"200g","name":"Spaghetti"},{"qty":"150g","name":"Pancetta"},{"qty":"3","name":"Eggs"},{"qty":"100g","name":"Pecorino Romano"}]',
   '[{"step":"Boil salted water and cook pasta al dente."},{"step":"Fry pancetta until crispy."},{"step":"Whisk eggs with cheese and pepper."},{"step":"Combine off heat, toss with pasta water to make silky sauce."}]',
   '{"Italian","pasta","quick"}', 234),
  ('00000000-0000-0000-0000-000000000000', 'Blueberry Pancakes', '🥞', 'breakfast', 20, 4, 380, 10, 55, 12,
   '[{"qty":"2 cups","name":"Flour"},{"qty":"1 cup","name":"Blueberries"},{"qty":"2","name":"Eggs"},{"qty":"1.5 cups","name":"Milk"}]',
   '[{"step":"Mix dry ingredients."},{"step":"Whisk wet ingredients separately."},{"step":"Fold together, add blueberries."},{"step":"Cook on buttered griddle until golden."}]',
   '{"breakfast","sweet","berries"}', 312);
