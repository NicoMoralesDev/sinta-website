# PostgreSQL safety checklist

## Before changes

- Confirm environment (dev/stage/prod) and database.
- Identify table sizes and indexes (`\d+`, stats if available).
- Confirm expected row counts.

## Preview-first pattern

- Always provide:
  - `SELECT ... WHERE ... LIMIT 100;`
  - `SELECT COUNT(*) ... WHERE ...;`

## Lock / performance awareness

- Beware of long-running transactions.
- For index creation on large tables, consider `CREATE INDEX CONCURRENTLY` (with its constraints).
- Avoid `ALTER TABLE` on hot tables without understanding lock behavior.

## Verification

- Explain the expected query plan when relevant (use `EXPLAIN` / `EXPLAIN ANALYZE` in non-prod).
