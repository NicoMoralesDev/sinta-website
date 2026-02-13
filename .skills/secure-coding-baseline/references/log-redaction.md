# Log redaction guidance

- Never log:
  - passwords, access tokens, refresh tokens, API keys
  - full authorization headers
  - full payment data
  - sensitive PII (national IDs, full addresses if unnecessary)
- Prefer:
  - hashing/partial masking (e.g., last 4)
  - structured logging with explicit allowed fields
- Error messages:
  - avoid leaking internal state or secrets
