---
phase: 04
slug: event-results-share-image
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-02
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/results-page.flow.spec.ts` |
| **Full suite command** | `npx vitest run tests/history-share-image-route.spec.ts tests/results-page.flow.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts && npm run typecheck` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific command from the verification map below
- **After every plan wave:** Run `npx vitest run tests/history-share-image-route.spec.ts tests/results-page.flow.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts && npm run typecheck`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SHARE-02 | unit/flow | `npx vitest run tests/results-page.flow.spec.ts` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | SHARE-01, SHARE-02 | route | `npx vitest run tests/history-share-image-route.spec.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | SHARE-01 | flow | `npx vitest run tests/results-page.flow.spec.ts` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 2 | SHARE-02 | flow | `npx vitest run tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/history-share-image-route.spec.ts` — route contract coverage for success, validation, not-found, cache headers, and parity-critical content
- [ ] Shared route/image fixture helpers inline in the spec or extracted locally if duplication becomes noisy
- [ ] Route test subject under `app/api/v1/results/events/[id]/image/route.ts`

*Existing infrastructure covers the rest of the phase. No framework installation is required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Image remains readable in messaging-style mobile sharing contexts | SHARE-01, SHARE-02 | Server markup tests do not prove compressed-image readability | Generate a real event image, open it at narrow/mobile width, and compare legibility against the target WhatsApp-style use case |
| Generated image matches the same event table shown on `/results` | SHARE-02 | Visual parity across page and image is higher-signal than markup-only checks | Open one real event on `/results`, open its generated image, and compare session columns, participant order, labels, and total driver count |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
