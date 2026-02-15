---
name: planning-and-verification
description: Use for non-trivial tasks requiring design decisions, multi-file changes, security/performance considerations, data migrations, or high uncertainty. Apply a 4-step plan-review-verify-refine process and output only the final answer unless asked for internal steps.
---

# Skill: Planning & Verification (Step-1-to-4)

## When to use
Use this process when at least one is true:
- The task requires design/architecture decisions
- The change spans multiple files/modules
- Security, auth, payments, or user data is involved
- Performance or scalability is a concern
- The requirements are ambiguous or have high uncertainty
- The domain is fast-changing (framework docs, APIs, pricing, policies)

## Output policy
- Follow the steps internally by default.
- Only print Step 1–4 if the user asks for it, or if the task is exploratory and benefits from transparency.

## Template

Question: [Your question]

Step 1: Provide your initial answer
- Give a best-effort plan/answer.
- State assumptions explicitly.

Step 2: List potential errors or gaps in your answer
- Enumerate risks, missing info, edge cases, and unknowns.

Step 3: For each potential error, verify using factual reasoning
- If stable domain: verify by logic, constraints, invariants, or local repo facts.
- If fast-changing domain: verify with official docs/sources and cite them.

Step 4: Provide corrected final answer
- Deliver the refined plan/answer.
- For dev tasks include: scope, implementation steps, tests, rollout/rollback, and validation checklist.

## Dev-focused add-on checklist (use in Step 4)
- API changes: backward compatibility, versioning, error contract
- Data changes: migrations, idempotency, rollback plan
- Security: authz/authn, secrets handling, rate limits
- Observability: logs/metrics/traces, alerting considerations
- Testing: unit/integration/e2e, edge cases, negative tests
