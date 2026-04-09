-- Allow one-decimal points while preserving integer-only race positions.

alter table event_results
  drop constraint if exists event_results_position_check;

alter table event_results
  alter column position type numeric(6, 1)
  using position::numeric(6, 1);

alter table event_results
  add constraint event_results_position_check
  check (
    position is null
    or (
      session_kind = 'p'
      and position >= 0
    )
    or (
      session_kind <> 'p'
      and position > 0
      and position = trunc(position)
    )
  );
