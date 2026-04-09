# Results Model

## Canonical fields

The stored field order is `qs`, `s`, `qf`, `f`, `p`, matching `CANONICAL_RESULT_FIELDS` in `lib/server/history/types.ts`.

Public and admin surfaces still share the same canonical stored fields, but the public presentation now splits labels by viewport:

- Small screens use compact labels such as `QS`, `S`, `QF`, `F`, and `PTS`.
- Larger screens expand those labels to readable text (`Qualy Sprint`, `Sprint`, `Qualy Final`, `Final`, `Points`/`Puntos`) and can wrap them onto two lines when needed.

Championships still control the display labels for sprint and final, so `s` and `f` can render with championship-specific names while the stored keys stay canonical.

## Display and ordering rules

Event participants are ordered by points first. When legacy rows do not include canonical points, the fallback order is final-race position and then driver name.

Visible columns follow the same canonical order. Sparse historical events omit missing columns instead of fabricating `QS`, `QF`, or `P` cells that do not exist in storage.

Points cells render raw numeric totals such as `25` or `18.5`, not `P25`. They also use a dedicated neutral points style instead of reusing the finishing-position winner/podium palette.

## Organizer metadata

`organizerName` is optional championship-level metadata. When present, the `/results` championship context renders it next to the selected championship label, and the current championship card uses the same field when no championship filter is active.

Blank organizer values are normalized to `null`, so maintainers should treat the field as optional metadata rather than required copy.

## Share flow

The share-image route contract is `/api/v1/results/events/:eventId/image`.

Supported query parameters:

- `driver=<slug>` filters the image to the selected driver within that event.
- `lang=en` switches labels and date formatting to English.

Public result cards now trigger a client share action instead of navigating directly to the image URL. On browsers that support the Web Share API with file payloads, the UI fetches the PNG and shares it as an image file. When file sharing is unavailable, it falls back to URL sharing or opening the image directly.

The generated image still stays aligned with the public event card for the visible canonical columns, participant set, participant order, and points semantics. That means canonical ordering, sparse historical column omission, raw numeric points values, and the active driver filter stay aligned with the `/results` page instead of using a separate export-only model. The route responds with `Cache-Control: public, s-maxage=120, stale-while-revalidate=600`.

## Verification limits

`tests/history-parser.spec.ts` depends on `data-source/Historia The New Project.xlsx`, so `npm run test` is not a clean fresh-checkout gate unless that workbook exists locally.

`npm run test:db` is environment-dependent. It only applies when `.env` is configured with a reachable database and any integration-test preconditions used by the current setup are available.

The focused Vitest suite can confirm the canonical contract, championship organizer behavior on `/results`, and share-image route behavior, but visual/image correctness still needs manual review after changes to `/results` or `/api/v1/results/events/:eventId/image`.
