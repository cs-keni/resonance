# HANDOFF — Resonance

## Current State

**Phase:** 1 — Audio Pipeline (implemented, tests passing; benchmark + RMS bar chart validation remaining)
**Branch:** main

## What Exists

- `SPEC.md` — full architecture + phase breakdown, ENG CLEARED
- `TODOS.md` — 3 deferred items (all post-Phase 2)
- `CONTRAST-MAP.md` — visual differentiation from Chronicle, Flux, Kinotype
- `PHASES.md` — phase/task breakdown with checkboxes
- `vite.config.ts` — Vite + Vitest config
- `src/dsp/` — all 9 DSP modules, fully implemented and unit-tested (34 tests)
- `src/worker.ts` — orchestrates full pipeline
- `src/main.ts` — drag-and-drop UI, RMS bar chart sanity check
- `docs/` — this scaffold

## Next Steps in Phase 1

- [ ] Run the app locally (`npm run dev`), drop in a real audio file, verify the RMS bar chart appears
- [ ] Performance benchmark: measure Worker analysis time on 3-min MP3 and 10-min FLAC, write results to SPEC.md
- [ ] If benchmark shows >30s on mid-range hardware: evaluate reducing overlap (HOP_SIZE 1024→2048) or WASM FFT

## Architecture Ownership

| Area | Status |
|------|--------|
| DSP pipeline (src/dsp/) | Phase 1 — DONE |
| Worker (src/worker.ts) | Phase 1 — DONE |
| Canvas renderer | Phase 2 — not started |
| Analysis sequence animations | Phase 3 — not started (run /plan-design-review first) |
| Export | Phase 4 — not started |

## Pending Before Phase 2

- Phase 1 benchmark complete and results written to SPEC.md
- RMS bar chart sanity check passes on real audio files

## Pending Before Phase 3

- Run `/plan-design-review` on the 60-second animation sequence
- Phase 2 song quality tests pass

## Pending Before Phase 4

- Real-time companion mode architecture spec (TODOS.md TODO-2)

## Flags for the Next Agent

- `barAggregation(bpm=0)` returns `[]` — guard is in place
- `centroid(silence)` returns `0` — guard is in place
- The decoded AudioBuffer must never leave the Worker — critical invariant
- Geist Mono must be loaded via `FontFace.load()` before any canvas render (Phase 2)
- BPM can return the sub-harmonic on pathological signals; real music onset signals are irregular enough that this is rare in practice
- TS6 requires explicit `Float64Array<ArrayBuffer>` in function return types — unparameterized `Float64Array` defaults to `<ArrayBufferLike>` which is not assignable to `<ArrayBuffer>`
