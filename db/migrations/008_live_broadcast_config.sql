-- Global live broadcast configuration (single row).
-- Replaces per-event stream editing UX with a centralized admin control.

create table if not exists live_broadcast_config (
  id smallint primary key,
  event_id uuid null references events(id) on delete set null,
  stream_video_id text null,
  stream_start_at timestamptz null,
  stream_end_at timestamptz null,
  stream_override_mode text not null default 'auto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'live_broadcast_config_singleton_check'
      and conrelid = 'live_broadcast_config'::regclass
  ) then
    alter table live_broadcast_config
      add constraint live_broadcast_config_singleton_check
      check (id = 1);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'live_broadcast_config_override_mode_check'
      and conrelid = 'live_broadcast_config'::regclass
  ) then
    alter table live_broadcast_config
      add constraint live_broadcast_config_override_mode_check
      check (stream_override_mode in ('auto', 'force_on', 'force_off'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'live_broadcast_config_video_id_check'
      and conrelid = 'live_broadcast_config'::regclass
  ) then
    alter table live_broadcast_config
      add constraint live_broadcast_config_video_id_check
      check (
        stream_video_id is null
        or stream_video_id ~ '^[A-Za-z0-9_-]{11}$'
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'live_broadcast_config_window_pair_check'
      and conrelid = 'live_broadcast_config'::regclass
  ) then
    alter table live_broadcast_config
      add constraint live_broadcast_config_window_pair_check
      check (
        (stream_start_at is null and stream_end_at is null)
        or (stream_start_at is not null and stream_end_at is not null)
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'live_broadcast_config_window_order_check'
      and conrelid = 'live_broadcast_config'::regclass
  ) then
    alter table live_broadcast_config
      add constraint live_broadcast_config_window_order_check
      check (
        stream_start_at is null
        or stream_end_at is null
        or stream_end_at > stream_start_at
      );
  end if;
end
$$;

insert into live_broadcast_config (id)
values (1)
on conflict (id) do nothing;

create index if not exists idx_live_broadcast_config_event_id
  on live_broadcast_config(event_id);
