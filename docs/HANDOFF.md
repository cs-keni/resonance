# HANDOFF — Resonance

## Current State

**Phase:** 2 — Fingerprint Renderer (in progress)
**Branch:** main

## What Exists

- `SPEC.md` — full architecture + phase breakdown, ENG CLEARED, benchmark populated
- `TODOS.md` — 3 deferred items (all post-Phase 2)
- `CONTRAST-MAP.md` — visual differentiation from Chronicle, Flux, Kinotype
- `PHASES.md` — Phase 1 complete ✅, Phase 2 in progress
- `vite.config.ts` — Vite + Vitest config
- `src/dsp/` — all 9 DSP modules, fully implemented and unit-tested (34 tests)
- `src/worker.ts` — orchestrates full DSP pipeline; receives decoded Float32Array from main thread
- `src/main.ts` — drag-and-drop UI, AudioContext decode, calls `drawFingerprint`, save PNG button
- `src/renderer.ts` — Canvas 2D fingerprint renderer (4 rings + center glyph, 2048×2048 export)
- `docs/` — this scaffold

## Architecture Ownership

| Area | Status |
|------|--------|
| DSP pipeline (src/dsp/) | Phase 1 — DONE |
| Worker (src/worker.ts) | Phase 1 — DONE |
| Canvas renderer (src/renderer.ts) | Phase 2 — scaffolded, rings implemented |
| Analysis sequence animations | Phase 3 — not started (run /plan-design-review first) |
| Export | Phase 4 — not started (canvas.toDataURL wired in Phase 2 main.ts) |

## Pending Before Phase 3

- Run `/plan-design-review` on the 60-second animation sequence
- Phase 2 song quality tests pass (10+ songs, energy peaks visible, genres distinguishable)

## Pending Before Phase 4

- Real-time companion mode architecture spec (TODOS.md TODO-2)

## Flags for the Next Agent

- **Audio decode is in main.ts, NOT the Worker.** `OfflineAudioContext` is unavailable in Web Workers. Main thread decodes via `AudioContext.decodeAudioData`, closes the context, transfers the `Float32Array` as a Transferable to the Worker.
- `barAggregation(bpm=0)` returns `[]` — guard is in place
- `centroid(silence)` returns `0` — guard is in place
- Geist Mono must be loaded via `FontFace.load()` before any canvas render (Phase 2)
- BPM can return the sub-harmonic on pathological signals; rare in practice with real music
- TS6 requires explicit `Float64Array<ArrayBuffer>` in function return types — unparameterized defaults to `<ArrayBufferLike>` which is not assignable to `<ArrayBuffer>`
- Worker posts `{ bars, key, tempo, duration }` — types in `src/dsp/barAggregation.ts` (`BarData`)
