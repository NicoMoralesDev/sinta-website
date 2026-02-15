# Future Features and Activation Conditions

This document lists potential features that are intentionally deferred.
Each item includes a concrete trigger so we only implement it when the benefit is clear.

## Candidate features

| Feature | Why it is useful | Activation condition | Prerequisites |
| --- | --- | --- | --- |
| Redis/Upstash read cache | Reduces repeated DB reads on hot endpoints. | P95 API latency > 350 ms for 7+ consecutive days, or sustained traffic spikes causing DB CPU pressure. | Baseline endpoint metrics and cache key strategy. |
| Materialized leaderboard views | Speeds up heavy aggregate queries for standings and history snapshots. | Aggregated queries exceed 250 ms P95 under normal load, or query cost grows significantly after new seasons are loaded. | Refresh policy (cron/manual), fallback to base tables. |
| Authenticated admin import endpoint | Allows non-CLI updates of race history files. | At least two maintainers need self-service uploads and import frequency increases (weekly or more). | Auth model, file validation, staging preview flow, audit trail. |
| Real event dates backfill | Enables accurate chronology and time-based analytics. | Source files consistently include reliable event date fields. | Date parsing/mapping rules and backfill migration plan. |
| Driver comparison page | Improves discoverability and storytelling for fan-facing UX. | Repeated user demand for side-by-side comparisons (wins, podiums, pace trend). | Stable profile data contracts and chart polish pass. |
| Shareable highlight cards | Better social sharing from results and driver profiles. | Product goal includes growth through social channels. | OG image generation route and share metadata templates. |
| Notifications/webhook for new imports | Improves operational visibility after updates. | Multiple environments or teammates require import status visibility. | Import lifecycle events and notification destination (email/Slack/Discord). |

## Review cadence

- Revisit this list after each competition season import.
- Promote only items that meet trigger conditions and have clear owner capacity.
