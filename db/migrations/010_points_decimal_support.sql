-- Allow one-decimal points while preserving integer-only race positions.

drop view if exists v_driver_stats;
drop view if exists v_event_highlights;

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

create view v_driver_stats as
select
  d.id as driver_id,
  d.slug as driver_slug,
  d.canonical_name,
  c.season_year,
  c.id as championship_id,
  c.slug as championship_slug,
  c.name as championship_name,
  count(*) filter (where er.position = 1) as wins,
  count(*) filter (where er.position is not null and er.position <= 3) as podiums,
  count(*) filter (where er.position is not null and er.position <= 5) as top_5,
  count(*) filter (where er.position is not null and er.position <= 10) as top_10,
  count(*) filter (where er.position is not null) as completed,
  count(*) filter (where er.status = 'DNF') as dnf,
  count(*) filter (where er.status = 'DNQ') as dnq,
  count(*) filter (where er.status = 'DSQ') as dsq,
  count(*) filter (where er.status = 'ABSENT') as absent
from event_results er
join drivers d on d.id = er.driver_id
join events e on e.id = er.event_id
join championships c on c.id = e.championship_id
where
  er.is_active = true
  and d.is_active = true
  and e.is_active = true
  and c.is_active = true
group by d.id, d.slug, d.canonical_name, c.season_year, c.id, c.slug, c.name;

create view v_event_highlights as
with ranked as (
  select
    e.id as event_id,
    c.season_year,
    c.slug as championship_slug,
    c.name as championship_name,
    e.round_number,
    e.circuit_name,
    d.canonical_name,
    er.position,
    row_number() over (
      partition by e.id
      order by er.position asc nulls last, d.canonical_name asc
    ) as rank_in_event
  from events e
  join championships c on c.id = e.championship_id
  join event_results er on er.event_id = e.id
  join drivers d on d.id = er.driver_id
  where
    er.position is not null
    and e.is_active = true
    and c.is_active = true
    and er.is_active = true
    and d.is_active = true
)
select
  event_id,
  season_year,
  championship_slug,
  championship_name,
  round_number,
  circuit_name,
  canonical_name as best_driver_name,
  position as best_position
from ranked
where rank_in_event = 1;
