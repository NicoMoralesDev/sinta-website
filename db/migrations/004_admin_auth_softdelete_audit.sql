-- Admin V1: auth/users, soft delete support, audit logs.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type admin_role as enum ('owner', 'editor');
  end if;
end
$$;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null unique,
  password_hash text not null,
  role admin_role not null,
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  failed_attempts int not null default 0,
  locked_until timestamptz null,
  last_login_at timestamptz null,
  created_by uuid null references admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table championships
  add column if not exists is_active boolean not null default true;

alter table championships
  add column if not exists updated_at timestamptz not null default now();

alter table events
  add column if not exists is_active boolean not null default true;

alter table events
  add column if not exists updated_at timestamptz not null default now();

alter table event_results
  add column if not exists is_active boolean not null default true;

alter table event_results
  add column if not exists updated_at timestamptz not null default now();

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references admin_users(id),
  actor_email text not null,
  entity_type text not null,
  entity_id uuid null,
  action text not null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  request_id text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_users_email_normalized
  on admin_users(email_normalized);

create index if not exists idx_admin_audit_logs_entity_created
  on admin_audit_logs(entity_type, entity_id, created_at desc);

create index if not exists idx_championships_active_year_slug
  on championships(is_active, season_year, slug);

create index if not exists idx_events_active_championship_round
  on events(is_active, championship_id, round_number);

create index if not exists idx_event_results_active_event_driver
  on event_results(is_active, event_id, driver_id);
