---
phase: 02
slug: admin-results-and-championship-editing
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-02
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `^3.2.4` |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts tests/championship-organizer.spec.ts tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts tests/championship-organizer.spec.ts tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts`
- **After every plan wave:** Run `npm run typecheck`
- **Before `$gsd-verify-work`:** Full suite must be green, or the known workbook-dependent parser failure must be called out explicitly as unrelated baseline debt.
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 2 | ADMIN-01 | route + unit | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts` | ✅ existing | ⬜ pending |
| 02-01-02 | 01 | 2 | ADMIN-02 | service + route | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts` | ✅ existing | ⬜ pending |
| 02-02-01 | 02 | 3 | ADMIN-01 | render + helper | `./node_modules/.bin/vitest run tests/admin-events-manager.flow.spec.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 3 | ADMIN-03 | render + route | `./node_modules/.bin/vitest run tests/admin-championships-manager.flow.spec.ts tests/championship-organizer.spec.ts` | ❌ W0 / ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/admin-events-manager.flow.spec.ts` — responsive canonical editor render, helper copy, mobile short labels, and dirty-row helper coverage
- [ ] `tests/admin-championships-manager.flow.spec.ts` — organizer field render and optional secondary-metadata coverage
- [ ] widen `tests/admin-event-results-contract.spec.ts` — canonical grid GET contract, points-specific validation, and clear tombstone coverage
- [ ] widen `tests/admin-event-results-preserve.spec.ts` — preserve untouched rows while allowing explicit clears

*Existing infrastructure covers the framework and admin route/service seams; only the missing admin UI-focused specs are Wave 0 additions.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Five-column editor stays readable on narrow screens | ADMIN-01 | Static render tests cannot prove real overflow and scroll behavior | Open `/admin/events`, expand an event, verify desktop shows friendly labels, mobile/narrow viewport falls back to compact headers, and inputs remain readable without chaotic wrapping. |
| First invalid cell is obvious during save | ADMIN-01 / ADMIN-02 | Render tests can cover helper wiring, but not full browser focus/scroll behavior | Enter an invalid race token or invalid points value, click save, verify save is blocked, the first bad cell is focused or clearly surfaced, and no network request commits bad data. |
| Organizer field feels secondary and unobtrusive | ADMIN-03 | This is partly a visual placement judgment | Open `/admin/championships`, confirm `Organizador` is present on create/edit forms but does not visually dominate season, name, or session labels. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
