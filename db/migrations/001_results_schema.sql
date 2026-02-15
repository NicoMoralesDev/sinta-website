-- Results history schema
-- Run in a controlled environment (Supabase/Postgres).

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'result_status') then
    create type result_status as enum ('DNF', 'DNQ', 'DSQ', 'ABSENT');
  end if;

  if not exists (select 1 from pg_type where typname = 'session_kind') then
    create type session_kind as enum ('primary', 'secondary');
  end if;
end
$$;

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_name text not null unique,
  sort_name text not null,
  country_code text not null,
  country_name_es text not null,
  country_name_en text not null,
  role_es text not null,
  role_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists driver_aliases (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,
  alias_original text not null,
  alias_normalized text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists championships (
  id uuid primary key default gen_random_uuid(),
  season_year int not null check (season_year >= 2000 and season_year <= 2100),
  name text not null,
  slug text not null,
  primary_session_label text not null default 'Sprint',
  secondary_session_label text not null default 'Final',
  created_at timestamptz not null default now(),
  unique (season_year, slug)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references championships(id) on delete cascade,
  round_number int not null check (round_number > 0),
  circuit_name text not null,
  source_sheet text not null,
  source_row int not null check (source_row > 0),
  created_at timestamptz not null default now(),
  unique (championship_id, round_number),
  unique (championship_id, source_row)
);

create table if not exists event_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  driver_id uuid not null references drivers(id) on delete cascade,
  session_kind session_kind not null,
  position int null check (position > 0),
  status result_status null,
  raw_value text not null,
  created_at timestamptz not null default now(),
  unique (event_id, driver_id, session_kind),
  check (
    (position is not null and status is null)
    or
    (position is null and status is not null)
  )
);

create table if not exists import_runs (
  id uuid primary key default gen_random_uuid(),
  source_filename text not null,
  source_sha256 text not null,
  mode text not null check (mode in ('dry-run', 'apply')),
  summary_json jsonb not null default '{}'::jsonb,
  warnings_json jsonb not null default '[]'::jsonb,
  imported_at timestamptz not null default now()
);

create index if not exists idx_event_results_driver_event
  on event_results(driver_id, event_id);

create index if not exists idx_event_results_event
  on event_results(event_id);

create index if not exists idx_events_championship_round
  on events(championship_id, round_number);

create index if not exists idx_championships_year_slug
  on championships(season_year, slug);

create index if not exists idx_driver_aliases_alias_normalized
  on driver_aliases(alias_normalized);

