-- Event live stream metadata for home hero embed.
-- Adds scheduling window + manual override mode.

alter table events
  add column if not exists stream_video_id text null;

alter table events
  add column if not exists stream_start_at timestamptz null;

alter table events
  add column if not exists stream_end_at timestamptz null;

alter table events
  add column if not exists stream_override_mode text not null default 'auto';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_stream_override_mode_check'
      and conrelid = 'events'::regclass
  ) then
    alter table events
      add constraint events_stream_override_mode_check
      check (stream_override_mode in ('auto', 'force_on', 'force_off'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_stream_video_id_check'
      and conrelid = 'events'::regclass
  ) then
    alter table events
      add constraint events_stream_video_id_check
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
    where conname = 'events_stream_window_pair_check'
      and conrelid = 'events'::regclass
  ) then
    alter table events
      add constraint events_stream_window_pair_check
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
    where conname = 'events_stream_window_order_check'
      and conrelid = 'events'::regclass
  ) then
    alter table events
      add constraint events_stream_window_order_check
      check (
        stream_start_at is null
        or stream_end_at is null
        or stream_end_at > stream_start_at
      );
  end if;
end
$$;

create index if not exists idx_events_live_lookup
  on events(stream_override_mode, stream_start_at, stream_end_at)
  where is_active = true and stream_video_id is not null;
