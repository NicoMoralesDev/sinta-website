# AGENTS.md

This file defines how automated coding agents should work in this repository.
Follow these instructions strictly.

## 1) Language & communication

- Write all code, comments, commit messages, and documentation in **English**.
- Keep explanations concise, technical, and actionable.
- Prefer bullet points and short paragraphs.

## 2) Operating principles

- Make **small, focused changes**. Avoid unrelated refactors.
- Prefer **clarity over cleverness**.
- Minimize diffs: change only what is necessary to fulfill the task.
- If requirements are ambiguous, choose the **simplest reasonable interpretation** and document assumptions in the PR/summary.
- Prefer **maintainability** and **correctness** over micro-optimizations.

## 3) Version-aware work (skill)

When changing or using any technology, library, framework, CLI, or cloud service:

- Follow the skill: `.skills/version-aware-implementation/`.

## 4) Agent workflow (Plan → Review → Execute)

When you receive a task, follow this workflow:

1. **Plan**
   - Propose a short plan (3–8 bullets).
   - Identify impacted files/modules.
   - Call out risks, trade-offs, and any assumptions.
   - Include a brief note on which docs/sources will be used for version-specific work.

2. **Plan review**
   - Re-read the plan and check it for completeness and safety (tests, edge cases, backward compatibility).

3. **Approval gate**
   - If the task is non-trivial, risky, or touches critical areas (auth, payments, production config, migrations, data changes),
     **request explicit user approval** before making broad or invasive changes.
   - If approval is not feasible in the current workflow, proceed only with the **lowest-risk subset** and clearly state what was deferred.

4. **Execute**
   - Implement the plan with minimal surface area.
   - Add/adjust tests and documentation as needed.

5. **Self-review (mandatory)**
   - Before presenting results, perform a quick self-review:
     - Look for bugs, missing edge cases, and inconsistent behavior.
     - Check naming, readability, and style consistency.
     - Ensure no secrets or sensitive info were introduced.
     - Ensure tests/lint/build steps are satisfied (or provide manual verification steps).
     - Verify that version-specific usage matches the relevant documentation.

## 5) Repo safety rules (DO / DO NOT)

### DO

- Follow existing code style and patterns in the codebase.
- Reuse existing utilities/components before creating new ones.
- Add or update tests when behavior changes.
- Update documentation when you change public behavior or developer workflows.

### DO NOT

- Do not commit secrets, tokens, credentials, or private keys.
- Do not change generated files unless the task explicitly requires it.
- Do not introduce new dependencies without strong justification.
- Do not perform large-scale formatting changes (e.g., whole-file reformat) unless requested.

## 6) Engineering standards (simplicity & design)

- Keep code **simple** and avoid over-engineering.
- Prefer **clarity and maintainability** over clever abstractions.
- Apply **DRY** thoughtfully:
  - Reuse code when it reduces duplication _without_ creating premature abstractions.
  - Avoid “utility dumping grounds” that become hard to maintain.
- Prefer **single responsibility**:
  - Avoid overly large functions/classes/modules.
  - Extract well-named helpers when logic becomes dense or multi-purpose.
- Avoid common anti-patterns:
  - Hidden side effects, god objects, excessive static state, tight coupling, duplicated logic, and uncontrolled global config.
- Prefer explicit interfaces and clear boundaries between layers (where applicable).

## 7) Code style & quality

- Maintain consistent naming, structure, and conventions already used in this repo.
- Avoid dead code and commented-out code.
- Prefer explicit error handling and meaningful error messages.
- Add comments only when necessary to explain _why_, not _what_.
- Make edge cases explicit (null/undefined, empty inputs, failures, timeouts).

## 8) Testing & validation (Definition of Done)

Before considering a task complete:

- Run the most relevant tests and linters for the affected area.
- Ensure the project builds successfully (when applicable).
- Ensure no new warnings or lint errors are introduced.
- If tests are not available, add a minimal test or provide a manual verification note.

## 9) Documentation expectations

Update docs when you:

- Change runtime behavior, public APIs, config, environment variables, or CLI usage.
- Add new endpoints, features, or workflows.
- Modify onboarding or local dev setup.

Documentation should be concise, practical, and in English.

## 10) Database work (skill)

For any SQL, migrations, schema changes, or data operations:

- Follow the skill: `.skills/db-change-safety/`.

## 11) Security & privacy (essentials)

- Never log sensitive data (tokens, passwords, PII).
- Prefer secure defaults.
- Follow the extended skill when working on auth, inputs, secrets, or security-sensitive code:
  - `.skills/secure-coding-baseline/`.

## 12) Performance & reliability (essentials)

- Avoid obvious inefficiencies (unnecessary network calls, repeated computations, N+1 patterns).
- Follow the extended skill when performance, reliability, or load is a concern:
  - `.skills/perf-and-reliability/`.

## 13) When blocked

If you cannot proceed due to missing information:

- State exactly what is missing and why it blocks progress.
- Propose a default approach with trade-offs.
- Provide a minimal safe implementation or a stub where appropriate.

## 14) Output format for agent summaries

When you finish work, provide:

- **Summary**: what changed (1–5 bullets)
- **Files changed**: list of files touched
- **Verification**: commands run + results (or manual steps)
- **Notes**: assumptions, risks, follow-ups
