# Results Model

## Canonical fields

The stored field order is `qs`, `s`, `qf`, `f`, `p`, matching `CANONICAL_RESULT_FIELDS` in `lib/server/history/types.ts`.

Public and admin surfaces present the same contract with uppercase labels: `QS`, `S`, `QF`, `F`, `P`. Championships still control the display labels for sprint and final, so `s` and `f` can render with championship-specific names while the stored keys stay canonical.

## Display and ordering rules

Event participants are ordered by points first. When legacy rows do not include canonical points, the fallback order is final-race position and then driver name.

Visible columns follow the same canonical order. Sparse historical events omit missing columns instead of fabricating `QS`, `QF`, or `P` cells that do not exist in storage.

## Organizer metadata

`organizerName` is optional championship-level metadata. When present, the `/results` championship context renders it next to the selected championship label, and the current championship card uses the same field when no championship filter is active.

Blank organizer values are normalized to `null`, so maintainers should treat the field as optional metadata rather than required copy.

## Share-image route

The share-image route contract is `/api/v1/results/events/:eventId/image`.

Supported query parameters:

- `driver=<slug>` filters the image to the selected driver within that event.
- `lang=en` switches labels and date formatting to English.

The generated image stays aligned with the public event card for the visible canonical columns, participant set, and participant order. That means canonical ordering, sparse historical column omission, and the active driver filter stay aligned with the `/results` page instead of using a separate export-only model. The shipped route also responds with `Cache-Control: public, s-maxage=120, stale-while-revalidate=600`.

## Verification limits

`tests/history-parser.spec.ts` depends on `data-source/Historia The New Project.xlsx`, so `npm run test` is not a clean fresh-checkout gate unless that workbook exists locally.

`npm run test:db` is environment-dependent. It only applies when `.env` is configured with a reachable database and any integration-test preconditions used by the current setup are available.

The focused Vitest suite can confirm the canonical contract, championship organizer behavior on `/results`, and share-image route behavior, but visual/image correctness still needs manual review after changes to `/results` or `/api/v1/results/events/:eventId/image`.
