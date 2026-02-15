-- Future compatibility for real race dates.
-- Current ordering still relies on season_year + round_number.

alter table events
  add column if not exists event_date date null;

create index if not exists idx_events_event_date
  on events(event_date);
