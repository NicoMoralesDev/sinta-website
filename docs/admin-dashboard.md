# Admin Dashboard V1

## Overview

Admin UI is available at `/admin` and is protected by internal users stored in `users` with role lookup in `roles`.

- Roles: `owner`, `editor`
- First login requires password change (`must_change_password=true`)
- Admin API responses include `Cache-Control: no-store`
- In development, writes default to dry-run when `ADMIN_DEV_DRY_RUN=1`

## Required env vars

- `ADMIN_SESSION_SECRET`
- `ADMIN_PASSWORD_PEPPER`
- `ADMIN_DEV_DRY_RUN` (`1` by default in development)
- `ADMIN_ENABLE_IN_DEV` (`1` enables UI/API in development)
- `ADMIN_BOOTSTRAP_USERNAME`
- `ADMIN_BOOTSTRAP_PASSWORD`

Legacy compatibility:
- `ADMIN_BOOTSTRAP_EMAIL` is still accepted as fallback in the bootstrap script.

## Bootstrap owner

```bash
npm run bootstrap:admin
```

Behavior:
- Creates the owner only if `username_normalized` does not exist.
- Returns JSON with `created: true|false`.

## Revert policy

- `editor`: latest change per entity only.
- `owner`: latest or target audit id within the last 10 versions per entity.

Revertable entity types:
- `championship`
- `event`
- `driver`
- `event_results`

## Dev dry-run behavior

When dry-run is active:
- Write endpoints still validate payloads and permissions.
- Responses include `dryRun: true` plus any validation warnings.
- No database mutation is applied.

## Canonical event results editor

The event results grid is driven by backend `fieldOrder` and `fieldLabels`, not by hardcoded frontend columns. The canonical stored fields are:

- `QS` (`qs`)
- `S` (`s`)
- `QF` (`qf`)
- `F` (`f`)
- `P` (`p`)

The default admin contract currently resolves to:

- `fieldOrder: ["qs", "s", "qf", "f", "p"]`
- `fieldLabels.qs = "Qualy Sprint"`
- `fieldLabels.s = championship primary-session label`
- `fieldLabels.qf = "Qualy Final"`
- `fieldLabels.f = championship secondary-session label`
- `fieldLabels.p = "Points"`

Validation rules match the shipped editor:

- Race cells accept positive integers or `DNF` / `DNQ` / `DSQ` / `ABSENT`.
- Points accept whole numbers >= 0.
- Invalid cells are rejected before save.

Save semantics are patch-based rather than row-replace-by-default:

- Partial saves preserve untouched persisted cells for the same driver and event.
- Only dirty cells are serialized back to the API.
- An explicit clear sends an inactive empty tombstone for that canonical cell.
- Omitted cells are left untouched instead of wiping the whole driver row.

This means the admin workflow supports the full five-column canonical model. Championship labels can rename the displayed `S` and `F` columns, but the stored contract remains `qs/s/qf/f/p`.

## Championship organizer metadata

`organizerName` is an optional championship field in both the create and update payloads.

- Blank input is trimmed and normalized to `null`.
- Non-empty input is trimmed before it is sent.
- The field is available in the existing create flow and in the inline update flow.

Use this field for the organizer or league name associated with a championship. It is championship metadata, not event-level metadata.

## Global live stream fields

`/admin/live-stream` supports a single global live broadcast configuration:

- `eventId`: optional event reference used for hero context labels
- `streamVideoId`: YouTube URL or direct video ID (`11` chars); persisted as the canonical video ID
- `streamStartAt`: start datetime (admin inputs ART via `datetime-local` and backend stores UTC)
- `streamEndAt`: end datetime (same conversion rules as start)
- `streamOverrideMode`:
  - `auto`: show only inside `[start - 30m, end]`
  - `force_on`: always show if a video is configured
  - `force_off`: never show

If an event date is detected within the next 24 hours, the admin UI suggests auto-filling `streamStartAt` and `streamEndAt` in ART.
