# Results Import Guide

This project imports race history from the local workbook `data-source/Historia The New Project.xlsx`.

## Current method

The supported import flow is still the local workbook script in `scripts/import-results-xlsx.ts`.

- Import is manual.
- Import is idempotent.
- The default workbook path is `data-source/Historia The New Project.xlsx`.

Run it with:

```bash
npm run import:results -- --dry-run
npm run import:results -- --apply
```

Use `--dry-run` first to inspect counts, warnings, and unknown aliases before any write is attempted.

## What the import does

- Reads the `Estadisticas` sheet from the workbook.
- Keeps event-level rows only.
- Ignores `Torneo` and `Promedio` summary rows as source data.
- Normalizes aliases through `driver_aliases`.
- Persists per-session results with either `position` or `status`.
- Falls back to championship round order when no race date is available.
- Stores run metadata in `import_runs`.

## Safety checks

- Dry-run reports event counts, result counts, parsing warnings, and unknown aliases.
- `--apply` fails if unknown aliases are present.
- Database writes use upserts so repeated runs remain idempotent.

## Verification limits

`tests/history-parser.spec.ts` depends on the local workbook at `data-source/Historia The New Project.xlsx`. On a fresh checkout, that file is usually missing, so the spec fails until the workbook is restored locally.

`npm run test:db` is also conditional. It only works when all of the following are true:

- A valid `.env` file is present.
- Network access to the configured database is available.
- The wrapper script enables `RUN_DB_INTEGRATION_TESTS=1`.

Because of those prerequisites, maintainers should treat the focused Vitest subset plus manual documentation review as the reliable Phase 5 verification gate, not a clean full-suite run on a fresh checkout.

## Deferred note

An authenticated upload workflow is still deferred. For now, the local workbook script remains the only supported import path.
