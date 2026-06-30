# HANDOFF — Resonance

## Current State

**Phase:** 4 — Polish and Export (P1 + P2 tasks complete, P3 polish remaining)
**Branch:** main

## What Exists

- `SPEC.md` — full architecture + phase breakdown, ENG CLEARED, benchmark populated
- `TODOS.md` — 3 deferred items (TODO-2 now deferred to Phase 5; TODO-3 renamed)
- `PHASES.md` — Phase 1–3 complete ✅, Phase 4 in progress (architecture locked)
- `vite.config.ts` — Vite + Vitest config
- `src/utils.ts` — shared `pitchHue()`, `annularSector()`, `validateAudioDuration()`, `playbackAngle()`, `stripExtension()`
- `src/dsp/` — all 9 DSP modules, fully unit-tested (54 tests total)
- `src/worker.ts` — orchestrates full DSP pipeline; receives decoded Float32Array from main thread
- `src/main.ts` — drag-and-drop UI, Phase 3 animation, Phase 4 export + playback tracker
- `src/renderer.ts` — Canvas 2D fingerprint renderer + `exportFingerprint()` (2048×2260 with caption)
- `docs/` — this scaffold

## Architecture Ownership

| Area | Status |
|------|--------|
| DSP pipeline (src/dsp/) | Phase 1 — DONE |
| Worker (src/worker.ts) | Phase 1 — DONE |
| Canvas renderer (src/renderer.ts) | Phase 2 — DONE |
| Analysis sequence animations | Phase 3 — DONE |
| Export (captioned PNG) | Phase 4 — DONE (`exportFingerprint()`) |
| Playback tracker | Phase 4 — DONE (overlay canvas, AudioBufferSourceNode) |
| Segment radial gradient | Phase 4 — P3 (evaluate vs existing `ringDepth()`) |
| Color wheel tuning | Phase 4 — P3 (manual evaluation, 10+ songs) |
| Real-time streaming companion | Phase 5 — spec needed before implementation |

## Phase 4 Decisions (locked)

- Export: `exportFingerprint(bars, key, tempo, duration, filename)` → 2048×2260 offscreen canvas
- Companion mode: playback tracker only (no streaming FFT). Re-decode from stored `currentFile`
- Short file detection: main thread, `validateAudioDuration()`, before Worker postMessage
- Stale decode: `currentJobId` stamp in `processFile()` guards stale Worker responses
- DRY: `pitchHue()` + `annularSector()` extracted to `src/utils.ts`

## Flags for the Next Agent

- **Audio decode is in main.ts, NOT the Worker.** `OfflineAudioContext` is unavailable in Web Workers.
- **AudioBuffer is dead after Transferable transfer.** Store `currentFile: File` for re-decode on playback.
- `bars.length === 0` now shows an error — no silent failure. Guard lives in `worker.onmessage`.
- `playBtn.onclick` is reassigned to a "stop" handler while playing — reset to `null` on stop.
- `stopAnimation()` also calls `currentAudioSource?.stop()` — both RAF + audio stop on new drop.
- `exportFingerprint()` creates an offscreen canvas; the display canvas is NOT used for export.
- Geist Mono must be loaded via `FontFace.load()` before any canvas text render (already gated in renderer.ts).
- BPM sub-harmonic possible on synthetic signals; rare with real music.
- TS6 requires explicit `Float64Array<ArrayBuffer>` in function return types.
