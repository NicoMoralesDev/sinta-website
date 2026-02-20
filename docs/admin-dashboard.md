# Admin Dashboard V1

## Overview

Admin UI is available at `/admin` and is protected by internal users stored in `users` with role lookup in `roles`.

- Roles: `owner`, `editor`
- First login requires password change (`must_change_password=true`)
- All admin API endpoints are `no-store`
- In development, writes default to dry-run when `ADMIN_DEV_DRY_RUN=1`

## Required env vars

- `ADMIN_SESSION_SECRET`
- `ADMIN_PASSWORD_PEPPER`
- `ADMIN_DEV_DRY_RUN` (`1` by default in development)
- `ADMIN_ENABLE_IN_DEV` (`1` enables UI/API in development)
- `ADMIN_BOOTSTRAP_USERNAME`
- `ADMIN_BOOTSTRAP_PASSWORD`

Legacy compatibility:
- `ADMIN_BOOTSTRAP_EMAIL` is still accepted as fallback in bootstrap script.

## Bootstrap owner

```bash
npm run bootstrap:admin
```

Behavior:
- Creates owner only if `username_normalized` does not exist.
- Returns JSON with `created: true|false`.

## Revert policy

- `editor`: latest change per entity only.
- `owner`: latest or target audit id within last 10 versions per entity.

Revertable entity types:
- `championship`
- `event`
- `driver`
- `event_results`

## Dev dry-run behavior

When dry-run is active:
- Write endpoints validate payload and permissions.
- Response includes `dryRun: true` and warnings.
- No DB mutation is applied.

## Global live stream fields

`/admin/live-stream` supports a single global live broadcast configuration:

- `eventId`: optional event reference used for Hero context labels.
- `streamVideoId`: YouTube URL or direct video ID (`11` chars); persisted as canonical video ID.
- `streamStartAt`: start datetime (admin inputs ART via `datetime-local` and backend stores UTC).
- `streamEndAt`: end datetime (same conversion rules as start).
- `streamOverrideMode`:
  - `auto`: show only inside `[start - 30m, end]`.
  - `force_on`: always show if video is configured.
  - `force_off`: never show.

If an event date is detected within the next 24 hours, the admin UI suggests auto-filling `streamStartAt` and `streamEndAt` in ART.
