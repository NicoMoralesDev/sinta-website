# Retry & timeout patterns

## Rules

- Always set timeouts for outbound network calls.
- Retries must be bounded (max attempts).
- Use exponential backoff (+ jitter if possible).
- Never retry non-idempotent operations unless you have an idempotency key.

## What to document

- timeout value
- retry count
- backoff strategy
- which errors are retryable
