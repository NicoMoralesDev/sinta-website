---
name: secure-coding-baseline
description: Use when touching authentication/authorization, handling external inputs, secrets, tokens, PII/logging, or any security-sensitive code paths. Provides a practical checklist and safe defaults.
---

## When to use

Use this skill when the task involves:

- AuthN/AuthZ, session/JWT, roles/permissions.
- Any endpoint that consumes user input (HTTP, queues, files, webhooks).
- Secrets (API keys, tokens), config, env vars.
- Logging, telemetry, error reporting where sensitive data could leak.

## Checklist

1. Inputs

- Validate types and bounds (length, format, allowed set).
- Sanitize where appropriate (especially if data reaches SQL, shells, templates).
- Reject invalid inputs with clear errors.

2. Secrets

- Never hardcode secrets.
- Prefer least privilege in example configs.
- Avoid printing env/config values in logs.

3. AuthZ

- Enforce authorization server-side.
- Default-deny: explicit allow rules.
- Avoid relying on client claims without verification.

4. Logging & privacy

- Redact tokens/passwords/PII from logs and error messages.
- Be careful with request/response logging middleware.

5. Dependencies

- Prefer existing dependencies.
- If adding one is unavoidable, justify and keep scope minimal.

## File references (optional)

- Threat modeling / quick questions:
  - `references/auth-checklist.md`
  - `references/log-redaction.md`
