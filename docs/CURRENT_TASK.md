# Current Task — Resonance

## Active: Phase 1 — Validation

**Status:** DSP modules complete. Pending: real-file test + performance benchmark.

**Next immediate steps:**
1. `npm run dev` → drop a real MP3 → verify RMS bar chart renders and stats look correct
2. Performance benchmark: time Worker analysis on 3-min MP3 and 10-min FLAC
3. Write benchmark results to SPEC.md "Measured Performance" section
4. Mark Phase 1 complete in PHASES.md once benchmark passes

**Phase 1 acceptance criteria:**
- Worker receives compressed file bytes, decodes via OfflineAudioContext, processes all DSP modules, posts `{ bars, key, tempo, duration }`
- All 34 Vitest unit tests pass ✓
- Performance benchmark documented in SPEC.md
- RMS bar chart on screen confirms end-to-end pipeline

**Blockers:** None
