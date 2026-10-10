-- EXISTING DATABASE ONLY: schools/profiles UUID schema.
-- Run ONLY after reviewing current existing tables; this is the migration matching the existing database.
-- Supabase SQL Editor: existing DB migration, October 2026.
-- KEEP existing public.schools, public.profiles, public.google_connections unchanged.
-- Confirmed schools.id uuid, schools.name text, schools.public_id bigint.
-- All NEW tables use uuid school_id references public.schools(id).
-- This migration does NOT create users, overwrite existing tables or delete data.

begin;
create extension if not exists btree_gist;

create table if not exists public.booking_types (
 id bigint generated always as identity primary key,
 school_id uuid not null references public.schools(id), name text not null,
 sort_order integer not null default 0, is_active boolean not null default true,
 unique(school_id,name), unique(school_id,id)
);
create table if not exists public.booking_resources (
 id bigint generated always as identity primary key,
 school_id uuid not null references public.schools(id), type_id bigint not null,
 name text not null, description text, sort_order integer not null default 0,
 is_active boolean not null default true,
 foreign key(school_id,type_id) references public.booking_types(school_id,id),
 unique(school_id,id), unique(school_id,type_id,name)
);
create table if not exists public.booking_periods (
 id bigint generated always as identity primary key,
 school_id uuid not null references public.schools(id), label text not null,
 start_time time not null, end_time time not null, sort_order integer not null default 0,
 is_active boolean not null default true,
 check(start_time<end_time), unique(school_id,id)
);
create table if not exists public.booking_regular_schedules (
 id bigint generated always as identity primary key,
 school_id uuid not null references public.schools(id),
 resource_id bigint not null, period_id bigint not null,
 weekday smallint not null check(weekday between 0 and 6), -- JS weekday Sunday=0
 label text not null, valid_from date not null, valid_until date,
 check(valid_until is null or valid_from < valid_until),
 foreign key(school_id,resource_id) references public.booking_resources(school_id,id),
 foreign key(school_id,period_id) references public.booking_periods(school_id,id),
 exclude using gist(resource_id with =,period_id with =,weekday with =,
   daterange(valid_from,valid_until,'[)') with &&)
);
create table if not exists public.booking_reservations (
 id bigint generated always as identity primary key,
 school_id uuid not null references public.schools(id),
 resource_id bigint not null, period_id bigint not null,
 reservation_date date not null, label text not null,
 status text not null default 'confirmed' check(status in ('pending','confirmed','cancelled')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now(),
 foreign key(school_id,resource_id) references public.booking_resources(school_id,id),
 foreign key(school_id,period_id) references public.booking_periods(school_id,id)
);
create unique index if not exists booking_reserved_slot_unique
 on public.booking_reservations(resource_id,reservation_date,period_id)
 where status in ('pending','confirmed');
-- Daily plan categories: history-safe, half-open validity interval
create table if not exists public.daily_categories (
 id bigint generated always as identity primary key, school_id uuid not null references public.schools(id),
 category_code text not null, unique(school_id,category_code), unique(school_id,id)
);
create table if not exists public.daily_category_versions (
 id bigint generated always as identity primary key,
 school_id uuid not null, category_id bigint not null,
 category_name text not null, sort_order integer not null default 0,
 valid_from date not null, valid_until date,
 check(valid_until is null or valid_from < valid_until),
 foreign key(school_id,category_id) references public.daily_categories(school_id,id),
 unique(school_id,id),
 exclude using gist(category_id with =,daterange(valid_from,valid_until,'[)') with &&)
);
create table if not exists public.daily_plans (
 id bigint generated always as identity primary key,
 school_id uuid not null references public.schools(id), plan_date date not null,
 title text, created_at timestamptz not null default now(), unique(school_id,plan_date),unique(school_id,id)
);
create table if not exists public.daily_plan_items (
 id bigint generated always as identity primary key,
 school_id uuid not null,plan_id bigint not null,
 category_version_id bigint not null,
 title text,content text not null,sort_order integer not null default 0,
 foreign key(school_id,plan_id) references public.daily_plans(school_id,id),
 foreign key(school_id,category_version_id) references public.daily_category_versions(school_id,id)
);
create index if not exists booking_regular_lookup on public.booking_regular_schedules(school_id,resource_id,weekday);
create index if not exists booking_date_lookup on public.booking_reservations(school_id,reservation_date);

-- Default deny for browser roles: RLS enabled, no new public policies.
alter table public.booking_types enable row level security;
alter table public.booking_resources enable row level security;
alter table public.booking_periods enable row level security;
alter table public.booking_regular_schedules enable row level security;
alter table public.booking_reservations enable row level security;
alter table public.daily_categories enable row level security;
alter table public.daily_category_versions enable row level security;
alter table public.daily_plans enable row level security;
alter table public.daily_plan_items enable row level security;

commit;

-- IMPORTANT: Read APIs may use Express server-side secret key ONLY.
-- IMPORTANT: write endpoints MUST require authentication and school-scoped permission.
-- IMPORTANT: DB constraints prevent duplicate direct reservations and overlapping regular rules;
-- cross-table regular-vs-one-time collision must be checked transactionally before enabling writes.
-- IMPORTANT: daily_category_versions.valid_until is EXCLUSIVE: ending 2026-10-10
-- means visible through 2026-10-09 only. Preserve old version rows.
