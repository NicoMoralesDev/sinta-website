# Version detection checklist

## Java

- Build tool:
  - Maven: `pom.xml`, `.mvn/wrapper/maven-wrapper.properties`
  - Gradle: `build.gradle(.kts)`, `gradle/wrapper/gradle-wrapper.properties`
- Java runtime:
  - `maven-compiler-plugin` / `source` / `target`
  - `toolchains.xml` (if present)
  - CI config (GitHub Actions, etc.)
- Framework versions:
  - Spring Boot: `spring-boot-starter-parent` or dependency management BOM

## Node

- Node runtime:
  - `package.json` -> `engines.node`
  - `.nvmrc`, `.node-version`, `.tool-versions` (asdf)
- Package manager:
  - `package-lock.json` (npm)
  - `pnpm-lock.yaml` (pnpm)
  - `yarn.lock` (yarn)
- Framework versions:
  - dependencies in `package.json` + lockfile for exact resolved versions

## Python

- `pyproject.toml` (Poetry / PEP 621 / tools)
- `poetry.lock` / `requirements.txt` / `requirements.lock`
- Python runtime:
  - `requires-python` in `pyproject.toml`
  - `.python-version` (pyenv), `.tool-versions` (asdf)

## Infra / tooling

- Docker images: `FROM ...:<tag>` in `Dockerfile`
- Terraform providers: `required_providers` + version constraints
- GitHub Actions:
  - `uses: actions/...@vX`
  - language setup actions versions (java/node/python)
