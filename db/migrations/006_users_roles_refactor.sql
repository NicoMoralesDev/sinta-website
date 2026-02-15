-- Normalize admin auth schema to users + roles and generic audit_logs naming.
-- Compatible with databases already migrated through 004/005.

create table if not exists roles (
  code text primary key,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into roles (code, label)
values
  ('owner', 'Owner'),
  ('editor', 'Editor')
on conflict (code) do nothing;

do $$
begin
  if to_regclass('public.users') is null and to_regclass('public.admin_users') is not null then
    execute 'alter table admin_users rename to users';
  end if;
end
$$;

do $$
begin
  if to_regclass('public.audit_logs') is null and to_regclass('public.admin_audit_logs') is not null then
    execute 'alter table admin_audit_logs rename to audit_logs';
  end if;
end
$$;

do $$
begin
  if to_regclass('public.users') is null then
    raise exception 'users table is missing. Apply migration 004 first.';
  end if;
end
$$;

do $$
begin
  if to_regclass('public.audit_logs') is null then
    raise exception 'audit_logs table is missing. Apply migration 004 first.';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'email'
  ) then
    execute 'alter table users rename column email to username';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'email_normalized'
  ) then
    execute 'alter table users rename column email_normalized to username_normalized';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'actor_email'
  ) then
    execute 'alter table audit_logs rename column actor_email to actor_username';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'role' and udt_name = 'admin_role'
  ) then
    execute 'alter table users alter column role type text using role::text';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'users'::regclass
      and conname = 'users_role_fkey'
  ) then
    execute 'alter table users add constraint users_role_fkey foreign key (role) references roles(code)';
  end if;
end
$$;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'admin_users_email_normalized_key') then
    execute 'alter table users rename constraint admin_users_email_normalized_key to users_username_normalized_key';
  elsif exists (select 1 from pg_constraint where conname = 'users_email_normalized_key') then
    execute 'alter table users rename constraint users_email_normalized_key to users_username_normalized_key';
  end if;

  if exists (select 1 from pg_constraint where conname = 'admin_users_created_by_fkey') then
    execute 'alter table users rename constraint admin_users_created_by_fkey to users_created_by_fkey';
  end if;

  if exists (select 1 from pg_constraint where conname = 'admin_audit_logs_actor_user_id_fkey') then
    execute 'alter table audit_logs rename constraint admin_audit_logs_actor_user_id_fkey to audit_logs_actor_user_id_fkey';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_indexes
    where schemaname = 'public' and indexname = 'idx_admin_users_email_normalized'
  ) then
    execute 'alter index idx_admin_users_email_normalized rename to idx_users_username_normalized';
  end if;

  if exists (
    select 1
    from pg_indexes
    where schemaname = 'public' and indexname = 'idx_admin_audit_logs_entity_created'
  ) then
    execute 'alter index idx_admin_audit_logs_entity_created rename to idx_audit_logs_entity_created';
  end if;
end
$$;

do $$
declare
  role_type regtype;
  dependency_count bigint;
begin
  role_type := to_regtype('admin_role');
  if role_type is null then
    return;
  end if;

  select count(*)
    into dependency_count
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  where a.atttypid = role_type
    and a.attnum > 0
    and not a.attisdropped
    and c.relkind in ('r', 'p', 'v', 'm', 'f');

  if dependency_count = 0 then
    execute 'drop type admin_role';
  end if;
end
$$;
