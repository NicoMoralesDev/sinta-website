---
name: version-aware-implementation
description: Use when implementing or modifying anything that depends on specific versions (libraries, frameworks, CLIs, cloud services). Detect exact versions in the repo, consult official docs for those versions, and document assumptions.
---

## When to use

Use this skill when the task involves:

- Adding/changing dependencies, build tooling, framework configuration, or runtime behavior.
- CLI commands (Docker, Terraform, AWS, npm/pnpm/yarn, pip/poetry, etc.).
- Cloud services (AWS, GCP, Azure) where keys/behavior can change by version/feature.
- Any case where "I think the command is X" would be risky.

## Procedure

1. Identify versions (source of truth in the repo)

- Java: `pom.xml`, `build.gradle(.kts)`, Maven/Gradle wrapper, plugin versions.
- Node: `package.json` + lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`), `engines`, `.nvmrc`.
- Python: `pyproject.toml`, `requirements*.txt`, `poetry.lock`, `pip-tools` outputs.
- Infrastructure: `Dockerfile`, `docker-compose.yml`, Terraform provider versions, GitHub Actions versions.

2. Use official docs for the closest matching version

- Prefer official docs / primary sources.
- If exact version docs are not available, choose the nearest compatible doc and state assumptions.

3. Implement using a safe pattern

- Prefer backwards-compatible usage and feature detection when possible.
- Minimize surface area: smallest change that solves the task.

4. Record what you relied on
   In the final summary, include:

- Detected version(s).
- Any assumption (if docs didn’t match exactly).
- Verification steps.

## File references (optional)

- See language-specific checklists:
  - `references/java-version-detection.md`
  - `references/node-version-detection.md`
  - `references/python-version-detection.md`
- Curated links:
  - `references/links.txt`
