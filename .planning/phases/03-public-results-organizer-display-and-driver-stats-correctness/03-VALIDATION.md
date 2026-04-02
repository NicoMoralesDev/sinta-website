---
phase: 03
slug: public-results-organizer-display-and-driver-stats-correctness
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-02
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `^3.2.4` |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/results-page.flow.spec.ts tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/driver-profile-page.flow.spec.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/results-page.flow.spec.ts tests/driver-profile-page.flow.spec.ts tests/history-repository.spec.ts`
- **After every plan wave:** Run `npx vitest run tests/results-page.flow.spec.ts tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/driver-profile-page.flow.spec.ts tests/driver-visualizations.spec.ts`
- **Before `$gsd-verify-work`:** Full suite must be green, or the known workbook-fixture blocker in `tests/history-parser.spec.ts` must be called out explicitly as unrelated baseline debt
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | RESULT-01, RESULT-02, RESULT-03 | flow + route | `npx vitest run tests/results-page.flow.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts` | ✅ existing | ⬜ pending |
| 03-01-02 | 01 | 1 | RESULT-04 | flow | `npx vitest run tests/results-page.flow.spec.ts -t organizer` | ✅ extend existing | ⬜ pending |
| 03-02-01 | 02 | 2 | STAT-02 | flow + repository | `npx vitest run tests/driver-profile-page.flow.spec.ts tests/history-repository.spec.ts` | ✅ existing | ⬜ pending |
| 03-02-02 | 02 | 2 | STAT-01 | component/unit | `npx vitest run tests/driver-visualizations.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/driver-visualizations.spec.ts` — direct sparkline-orientation assertions for `STAT-01`
- [ ] extend `tests/driver-profile-page.flow.spec.ts` with mixed `qs` / `s` / `qf` / `f` / `p` event data proving trend and heatmap use only the race result for `STAT-02`
- [ ] extend `tests/results-page.flow.spec.ts` with organizer-rendering assertions for `RESULT-04`

*Existing infrastructure already covers public-results ordering, sparse-column behavior, and repository aggregate correctness.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Organizer text feels contextual without cluttering public results | RESULT-04 | Static render tests can prove presence but not final hierarchy/readability | Open `/results`, switch championships if needed, and verify the organizer appears inline with the championship label or heading without crowding the table. |
| Driver trend still reads intuitively with mixed historical session data | STAT-01, STAT-02 | SVG orientation and final-race filtering can be unit-tested, but overall readability is still a visual judgment | Open `/drivers/[slug]` for a driver with multiple events, confirm the trend chart reflects race finishes only and visually trends upward for better finishes. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
