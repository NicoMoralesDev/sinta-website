# Results Import Guide

This project imports race history from `data-source/Historia The New Project.xlsx`.

## Current method

- Import is manual and idempotent.
- Script: `scripts/import-results-xlsx.ts`
- Execution:
  - Dry run (default):
    ```bash
    npm run import:results -- --dry-run
    ```
  - Apply:
    ```bash
    npm run import:results -- --apply
    ```

## What the import does

- Reads sheet `Estadisticas`.
- Keeps event-level rows only.
- Ignores summary rows (`Torneo`, `Promedio`) as source of truth.
- Normalizes aliases using `driver_aliases`.
- Stores per-session results with either `position` or `status`.
- Uses round order (`round_number`) per championship/year when no race date exists.
- Persists run metadata into `import_runs`.

## Safety checks

- Dry run reports:
  - Event and result counts.
  - Unknown aliases.
  - Parsing warnings.
- Apply mode fails if unknown aliases exist.
- Upserts are used for idempotency.

## Future update path (deferred)

A future phase can add an authenticated admin endpoint to upload/process new Excel files.
For now, local script import is the supported and documented path.

