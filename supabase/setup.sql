-- TeaStash Supabase setup
-- Run this once in the Supabase SQL Editor.

create table if not exists public.teas (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  brand text,
  tea_type text not null check (tea_type in ('matcha', 'sencha', 'genmaicha', 'houjicha', 'oolong', 'blackTea', 'puerh', 'other')),
  net_weight_g numeric not null check (net_weight_g >= 0),
  remaining_g numeric not null check (remaining_g >= 0),
  purchase_date date,
  opened_date date,
  unopened_expiry_date date,
  opened_expiry_date date,
  storage_location text,
  notes text,
  image_data_url text,
  tin_color text,
  sort_order numeric not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table if not exists public.usage_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  tea_id text not null,
  date date not null,
  time text not null check (time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  grams_used numeric not null check (grams_used > 0),
  purpose text not null check (purpose in ('usucha', 'koicha', 'latte', 'dessert', 'other')),
  notes text,
  remaining_after numeric not null check (remaining_after >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, tea_id) references public.teas (user_id, id) on delete cascade
);

create table if not exists public.drink_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date date not null,
  time text not null check (time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  name text,
  drink_type text not null check (
    drink_type in (
      'tea',
      'greenTea',
      'oolongTea',
      'blackTea',
      'milkTea',
      'powderedTea',
      'coffee',
      'espresso',
      'latte',
      'homemade',
      'energyDrink',
      'other'
    )
  ),
  size text not null check (size in ('small', 'medium', 'large', 'custom')),
  caffeine_mg numeric not null default 0 check (caffeine_mg >= 0),
  spend_amount numeric not null default 0 check (spend_amount >= 0),
  sugar_g numeric not null default 0 check (sugar_g >= 0),
  homemade boolean not null default false,
  brewing_details text,
  notes text,
  image_data_url text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table if not exists public.sync_tombstones (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  entity text not null check (entity in ('tea', 'usage_record')),
  item_id text not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create index if not exists teas_user_updated_idx on public.teas (user_id, updated_at desc);
create index if not exists usage_records_user_updated_idx on public.usage_records (user_id, updated_at desc);
create index if not exists usage_records_user_tea_idx on public.usage_records (user_id, tea_id);
create index if not exists drink_records_user_date_idx on public.drink_records (user_id, date desc, time desc);
create index if not exists drink_records_user_updated_idx on public.drink_records (user_id, updated_at desc);
create index if not exists sync_tombstones_user_updated_idx on public.sync_tombstones (user_id, updated_at desc);

grant select, insert, update, delete on public.teas to authenticated;
grant select, insert, update, delete on public.usage_records to authenticated;
grant select, insert, update, delete on public.drink_records to authenticated;
grant select, insert, update, delete on public.sync_tombstones to authenticated;

alter table public.teas enable row level security;
alter table public.usage_records enable row level security;
alter table public.drink_records enable row level security;
alter table public.sync_tombstones enable row level security;

drop policy if exists "Users can read their own teas" on public.teas;
create policy "Users can read their own teas"
on public.teas for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own teas" on public.teas;
create policy "Users can insert their own teas"
on public.teas for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own teas" on public.teas;
create policy "Users can update their own teas"
on public.teas for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own teas" on public.teas;
create policy "Users can delete their own teas"
on public.teas for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own usage records" on public.usage_records;
create policy "Users can read their own usage records"
on public.usage_records for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own usage records" on public.usage_records;
create policy "Users can insert their own usage records"
on public.usage_records for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own usage records" on public.usage_records;
create policy "Users can update their own usage records"
on public.usage_records for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own usage records" on public.usage_records;
create policy "Users can delete their own usage records"
on public.usage_records for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own drink records" on public.drink_records;
create policy "Users can read their own drink records"
on public.drink_records for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own drink records" on public.drink_records;
create policy "Users can insert their own drink records"
on public.drink_records for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own drink records" on public.drink_records;
create policy "Users can update their own drink records"
on public.drink_records for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own drink records" on public.drink_records;
create policy "Users can delete their own drink records"
on public.drink_records for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own tombstones" on public.sync_tombstones;
create policy "Users can read their own tombstones"
on public.sync_tombstones for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own tombstones" on public.sync_tombstones;
create policy "Users can insert their own tombstones"
on public.sync_tombstones for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tombstones" on public.sync_tombstones;
create policy "Users can update their own tombstones"
on public.sync_tombstones for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tombstones" on public.sync_tombstones;
create policy "Users can delete their own tombstones"
on public.sync_tombstones for delete
to authenticated
using ((select auth.uid()) = user_id);
