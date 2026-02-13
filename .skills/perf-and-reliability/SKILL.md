---
name: perf-and-reliability
description: Use when performance, latency, throughput, or reliability matters (hot paths, data-heavy endpoints, background jobs). Provides profiling-first guidance, safe timeout/retry patterns, and anti-pattern checks.
---

## When to use

Use this skill when:

- The task touches hot paths, loops over data, IO-heavy logic, or critical endpoints.
- There are reports of slowness, timeouts, flaky integrations, or scaling concerns.
- You are adding network calls, retries, queues, or concurrency.

## Checklist

1. Measure first (when feasible)

- Identify where time is spent (logs, timers, profiler, query plans).
- Avoid premature micro-optimizations.

2. Common anti-patterns

- N+1 queries / repeated remote calls.
- Recomputing expensive values repeatedly.
- Loading huge datasets when a paginated/filtered query would do.

3. Timeouts & retries

- Add timeouts only when consistent with existing code.
- Retries must be bounded and use backoff/jitter patterns where applicable.
- Avoid retry storms (especially on shared downstreams).

4. Determinism & stability

- Prefer deterministic outputs for the same inputs.
- Handle partial failures explicitly (fallbacks, circuit breakers only if already in stack).

## File references (optional)

- Example patterns:
  - `references/retry-timeout-patterns.md`
  - `references/db-query-hygiene.md`
