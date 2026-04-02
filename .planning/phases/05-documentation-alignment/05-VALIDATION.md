---
phase: 05
slug: documentation-alignment
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-02
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts tests/championship-organizer.spec.ts tests/history-repository.spec.ts` |
| **Conditional full suite command** | `npm run test && npm run typecheck && npm run lint` (only after restoring `data-source/Historia The New Project.xlsx` and any environment needed by optional DB coverage) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint` plus the smallest relevant Vitest subset for the doc section being updated
- **After every plan wave:** Run `npx vitest run tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts tests/championship-organizer.spec.ts tests/history-repository.spec.ts && npm run typecheck && npm run lint`
- **Before `$gsd-verify-work`:** Focused suite plus `npm run typecheck` and `npm run lint` must be green; run `npm run test` only when the workbook fixture and any optional DB prerequisites are available
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DOC-01 | smoke + manual doc review | `npm run lint && npx vitest run tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | DOC-02 | contract + manual doc review | `npx vitest run tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts tests/championship-organizer.spec.ts tests/history-repository.spec.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | DOC-01 | admin workflow + manual doc review | `npx vitest run tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | DOC-02 | import workflow + manual doc review | `npx vitest run tests/history-repository.spec.ts && rg -n "Historia The New Project.xlsx|Verification limits|npm run test:db|RUN_DB_INTEGRATION_TESTS=1" docs/data-import.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `docs/results-model.md` — new maintainer reference for the canonical results contract and share-image flow
- [ ] `README.md` runtime/workflow index refresh — migrations, route inventory, cache semantics, and doc links
- [ ] `docs/admin-dashboard.md` update — organizer metadata, five-column results grid, partial-save semantics, dry-run note
- [ ] `docs/data-import.md` update — workbook path prerequisite and parser-test limitation
- [ ] No docs-lint or link-check command exists; verification is behavior-backed plus manual review
- [ ] `tests/history-parser.spec.ts` and `npm run test:db` stay outside the default runnable gate because they require local workbook and environment prerequisites

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Maintainer docs reflect current runtime setup and workflow descriptions | DOC-01 | Automated tests validate behavior, not the prose accuracy of each maintainer-facing instruction | Read `README.md`, `docs/admin-dashboard.md`, and `docs/data-import.md` after updates and compare them against the current runtime, admin workflow, and verification commands |
| Results-model and share-image documentation is accurate and discoverable | DOC-02 | The suite proves the contract but not whether the docs present it clearly for maintainers | Read `docs/results-model.md` and linked README sections, then confirm canonical fields, ordering, organizer metadata, share-image route examples, and verification limits are all documented and internally consistent |

---

## Validation Sign-Off

- [x] All four Phase 05 tasks have a default runnable `<automated>` verify or Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] Default validation commands exclude the fresh-checkout parser-fixture dependency
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
