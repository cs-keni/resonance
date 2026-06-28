# Current Task — Resonance

## Active: Phase 2 — Fingerprint Renderer

**Status:** Phase 1 complete. Starting canvas renderer.

**Phase 1 exit criteria — all met:**
- 34/34 Vitest unit tests pass ✓
- Real-file validation: F# major / 104 BPM / 266s / 168 bars on a GD MP3 ✓
- Benchmark: 0.23s for 103s audio (~450× real-time), no optimization needed ✓
- Architecture bug fixed: `OfflineAudioContext` unavailable in Workers → decoding moved to main thread via `AudioContext` ✓

**Phase 2 entry point:**
1. Scaffold `src/renderer.ts` — Canvas 2D renderer
2. Ring 1: pitch class → hue (Krumhansl-Schmuckler color wheel), one segment per bar
3. Ring 2: onset density → opacity/saturation per segment
4. Ring 3: RMS energy → radial extension as continuous line
5. Ring 4: spectral centroid → brightness/saturation per segment
6. Center glyph: key + BPM via `fillText`, Geist Mono loaded via `FontFace.load()` gate
7. Export: `canvas.toDataURL('image/png')` at 2048×2048

**Blockers:** None
