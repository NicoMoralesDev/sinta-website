-- Canonical results contract: widen session kinds, preserve legacy rows, and add championship organizer metadata.

alter table event_results
  drop constraint if exists event_results_position_check;

alter table event_results
  drop constraint if exists event_results_check;

create type session_kind_v2 as enum ('qs', 's', 'qf', 'f', 'p');

alter table event_results
  alter column session_kind type session_kind_v2
  using (
    case
      when session_kind::text = 'primary' then 's'
      when session_kind::text = 'secondary' then 'f'
      else session_kind::text
    end
  )::session_kind_v2;

drop type session_kind;

alter type session_kind_v2 rename to session_kind;

alter table event_results
  add constraint event_results_position_check
  check (
    position is null
    or position > 0
    or (session_kind = 'p' and position = 0)
  );

alter table event_results
  add constraint event_results_check
  check (
    (position is not null and status is null)
    or
    (position is null and status is not null)
  );

alter table championships
  add column if not exists organizer_name text;
