---
phase: 01
slug: results-contract-ordering-and-championship-metadata
status: draft
nyquist_compliant: false
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
| **Quick run command** | `./node_modules/.bin/vitest run tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/results-page.flow.spec.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30-90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `./node_modules/.bin/vitest run tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/results-page.flow.spec.ts`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green, or the parser-fixture gap must be documented explicitly
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | DATA-01 | unit + repository | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | DATA-02 | service + integration | `./node_modules/.bin/vitest run tests/admin-event-results-preserve.spec.ts tests/history-parser.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | DATA-03 | repository + route | `./node_modules/.bin/vitest run tests/history-repository.spec.ts tests/history-api.spec.ts tests/results-page.flow.spec.ts` | ✅ partial / ❌ W0 expansion | ⬜ pending |
| 01-02-02 | 02 | 1 | DATA-04 | repository + route | `./node_modules/.bin/vitest run tests/championship-organizer.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/admin-event-results-contract.spec.ts` — canonical field validation, duplicate prevention, and shared DTO mapping
- [ ] `tests/admin-event-results-preserve.spec.ts` — replace-all save behavior that preserves untouched persisted cells and legacy omissions
- [ ] `tests/championship-organizer.spec.ts` — organizer persistence and retrieval through admin/public contracts
- [ ] `tests/history-repository.spec.ts` — expand coverage to assert points-first ordering and race-only aggregate filtering
- [ ] `tests/history-api.spec.ts` and `tests/results-page.flow.spec.ts` — expand coverage to assert canonical field exposure
- [ ] `tests/history-parser.spec.ts` fixture replacement or documented exception — current parser test depends on a non-committed workbook

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CLI import widening for canonical fields, if included in Phase 1 | DATA-02 | Current repo lacks a committed canonical workbook sample for fully automated end-to-end import verification | Run the widened import against a representative workbook in a controlled local environment and confirm the resulting rows expose `QS`/`QF`/`P` correctly without dropping legacy data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
