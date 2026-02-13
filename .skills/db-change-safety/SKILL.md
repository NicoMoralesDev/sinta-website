---
name: db-change-safety
description: Use when working with SQL, migrations, schema changes, or data operations. Enforce preview-first, scoped changes, rollback planning, and explicit approval for production or data-modifying operations.
---

## Core rules

- Never execute or propose running data-modifying SQL (INSERT, UPDATE, DELETE, MERGE, TRUNCATE, DROP, ALTER) unless:
  1. Explicitly requested by the user, and
  2. Scope is clearly defined (env/db, tables, rows), and
  3. A safe plan is provided (preview + rollback).

- Prefer read-only queries (SELECT) by default.

## Checklist (before any data-modifying operation)

1. Confirm scope

- Which environment (dev/stage/prod)?
- Which database, schema, tables?
- Which rows (exact predicate)?

2. Provide a preview first

- Provide a SELECT that shows exactly which rows will be affected.
- Include counts and a small sample.

3. Ensure safeguards

- Always use a WHERE clause (or equivalent safeguards).
- Avoid unbounded updates/deletes.

4. Plan reversibility

- Prefer running inside a transaction when supported.
- Provide an explicit rollback plan.
- Recommend backup/snapshot if impact could be risky.

5. Production gate

- Never run data-modifying operations in production unless explicitly requested and approved, and only with rollback.

## Migrations

- Prefer migration tooling already used in the repo (Flyway/Liquibase/etc.).
- Name migrations consistently.
- Keep migrations small and reversible when possible.

## File references (optional)

- Postgres-specific notes:
  - `references/postgres-checklist.md`
- Migration conventions:
  - `references/flyway-conventions.md`
- Example preview-first SQL:
  - `assets/example-preview.sql`
- Example JSON schema or payloads relevant to DB changes:
  - `assets/example-schema.json`
