# DB query hygiene

- Avoid N+1 queries (batch, join, prefetch).
- Paginate large result sets.
- Add indexes only with a clear query pattern.
- Use `EXPLAIN` in non-prod for slow queries.
