# Migration conventions (tool-agnostic)

- Keep migrations small and single-purpose.
- Prefer additive changes first:
  - add new column/table/index
  - backfill in controlled batches
  - switch reads/writes
  - then drop old column later (if needed)
- Always consider rollback:
  - can the migration be reversed?
  - if not reversible, state it explicitly and propose mitigation
- Naming:
  - include timestamp / incremental prefix
  - describe intent clearly
