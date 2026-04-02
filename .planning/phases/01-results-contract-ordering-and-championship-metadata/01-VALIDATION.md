---
phase: 01
slug: results-contract-ordering-and-championship-metadata
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-02
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `^3.2.4` |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `Use the task-level automated command from the per-task verification map; Phase 1 quick feedback is split across doc/rg checks, one DB integration spec, the admin Vitest group, and the history Vitest group.` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15-120 seconds depending on the task group (`rg`/docs < 5s, focused Vitest groups ~15-60s, DB integration spec can approach ~120s) |

---

## Sampling Rate

- **After every task commit:** Run that task's exact `<automated>` command from the verification map. Do not substitute the history-only command for admin, docs, or DB-backed tasks.
- **After Plan 00:** Run the three `rg` doc/scaffold commands from `01-00-01`, `01-00-02`, and `01-00-03`.
- **After Plan 01:** Run `RUN_DB_INTEGRATION_TESTS=1 node --env-file=.env ./node_modules/vitest/vitest.mjs run tests/results-contract-migration.spec.ts` and `rg -n "CANONICAL_RESULT_FIELDS|type CanonicalResultField|organizerName|primary\" \\| \"secondary" lib/server/history/types.ts lib/server/admin/types.ts`.
- **After Plan 02:** Run `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts tests/championship-organizer.spec.ts`.
- **After Plan 03:** Run `./node_modules/.bin/vitest run tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/results-page.flow.spec.ts`.
- **After every plan wave:** Re-run the completed plans' quick-feedback commands, then run `npm test` if time permits or before phase verification.
- **Before `$gsd-verify-work`:** Full suite must be green, or the parser-fixture gap must be documented explicitly
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-00-01 | 00 | 1 | DATA-01, DATA-02, DATA-04 | Wave 0 scaffold | `rg -n "RUN_DB_INTEGRATION_TESTS|organizerName|primary|secondary|preserve|canonical" tests/results-contract-migration.spec.ts tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts tests/championship-organizer.spec.ts` | ❌ pre-W0 | ⬜ pending |
| 01-00-02 | 00 | 1 | DATA-03 | Wave 0 scaffold | `rg -n "points|organizerName|qs|qf|session order|race-only|canonical" tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/results-page.flow.spec.ts` | ✅ partial / ❌ W0 expansion | ⬜ pending |
| 01-00-03 | 00 | 1 | DATA-02 | docs | `rg -n "documented exception|save-path|history-parser\\.spec\\.ts" .planning/phases/01-results-contract-ordering-and-championship-metadata/01-RESEARCH.md .planning/phases/01-results-contract-ordering-and-championship-metadata/01-VALIDATION.md` | ✅ docs | ⬜ pending |
| 01-01-01 | 01 | 2 | DATA-01 | db integration + contract | `RUN_DB_INTEGRATION_TESTS=1 node --env-file=.env ./node_modules/vitest/vitest.mjs run tests/results-contract-migration.spec.ts` | ❌ W0 until 01-00 lands | ⬜ pending |
| 01-01-02 | 01 | 2 | DATA-04 | contract | `rg -n "CANONICAL_RESULT_FIELDS|type CanonicalResultField|organizerName|primary\" \\| \"secondary" lib/server/history/types.ts lib/server/admin/types.ts` | ❌ W0 until 01-00 lands | ⬜ pending |
| 01-02-01 | 02 | 3 | DATA-01, DATA-02 | service + integration | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts` | ❌ W0 until 01-00 lands | ⬜ pending |
| 01-02-02 | 02 | 3 | DATA-04 | repository + route | `./node_modules/.bin/vitest run tests/championship-organizer.spec.ts` | ❌ W0 until 01-00 lands | ⬜ pending |
| 01-03-01 | 03 | 3 | DATA-03 | repository | `./node_modules/.bin/vitest run tests/history-repository.spec.ts` | ✅ partial / ❌ W0 expansion | ⬜ pending |
| 01-03-02 | 03 | 3 | DATA-03, DATA-04 | route + page flow | `./node_modules/.bin/vitest run tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/results-page.flow.spec.ts` | ✅ partial / ❌ W0 expansion | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/admin-event-results-contract.spec.ts` — canonical field validation, duplicate prevention, and shared DTO mapping
- [ ] `tests/admin-event-results-preserve.spec.ts` — replace-all save behavior that preserves untouched persisted cells and legacy omissions
- [ ] `tests/championship-organizer.spec.ts` — organizer persistence and retrieval through admin/public contracts
- [ ] `tests/results-contract-migration.spec.ts` — schema-level migration verification for enum remap, points-safe constraint, and `organizer_name`
- [ ] `tests/history-repository.spec.ts` — expand coverage to assert points-first ordering and race-only aggregate filtering
- [ ] `tests/history-api.spec.ts`, `tests/history-api-v2.spec.ts`, and `tests/results-page.flow.spec.ts` — expand coverage to assert canonical field exposure, consumer ordering, and championship organizer payload compatibility
- [ ] Documented exception for `tests/history-parser.spec.ts` — canonical CLI import widening stays out of Phase 1 until a committed workbook fixture exists

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Canonical CLI import widening for `QS`/`QF`/`P` | DATA-02 | Explicitly deferred from Phase 1 because the repo lacks a committed canonical workbook fixture; save-path coverage remains automated | Do not treat parser/import work as a Phase 1 execution blocker. Revisit only when a representative workbook is committed or its column mapping is evidence-backed. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
