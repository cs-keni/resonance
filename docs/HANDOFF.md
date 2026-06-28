# HANDOFF — Resonance

## Current State

**Phase:** 1 — Audio Pipeline (not yet started; scaffold pending)
**Branch:** main
**Last session:** 2026-06-27 — completed /plan-eng-review, all 12 findings resolved, SPEC.md finalized

## What Exists

- `SPEC.md` — full architecture + phase breakdown, ENG CLEARED
- `TODOS.md` — 3 deferred items (all post-Phase 2)
- `CONTRAST-MAP.md` — visual differentiation from Chronicle, Flux, Kinotype
- `PHASES.md` — phase/task breakdown with checkboxes
- `docs/` — this scaffold (AI_CONTEXT, HANDOFF, ENGINEERING_LOG, CURRENT_TASK)
- No application code yet

## Architecture Ownership

| Area | Owner notes |
|------|-------------|
| Worker + DSP pipeline | Not started |
| Canvas renderer | Not started |
| Analysis sequence animations | Not started (Phase 3; run /plan-design-review first) |
| Export | Not started (Phase 4) |

## Pending Before Phase 2

- Phase 1 must be complete and passing Vitest unit tests
- Performance benchmark documented in SPEC.md
- RMS bar chart sanity check passes

## Pending Before Phase 3

- Run `/plan-design-review` on the animation sequence (60-second build experience)
- Phase 2 song quality tests must pass (≥3 chorus energy peaks, genre distinguishability)

## Pending Before Phase 4

- Write real-time companion mode architecture spec (see TODOS.md TODO-2)

## Flags for the Next Agent

- `barAggregation(bpm=0)` must return `[]` — divide-by-zero risk
- `centroid(silence)` must return `0` — NaN risk from zero-energy denominator
- The decoded AudioBuffer must never leave the Worker — only compressed bytes in (Transferable), bar struct out
- Geist Mono must be loaded via `FontFace.load()` and awaited before any canvas render
