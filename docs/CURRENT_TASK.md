# Current Task — Resonance

## Active: Phase 4 — Polish and Export (P3 remaining)

**Status:** Phase 4 P1 and P2 complete. All new helpers extracted, tested, export wired, playback tracker live. P3 (optional polish) tasks remain.

**Phase 4 complete:**
- [x] T1: `currentFile: File | null` stored for re-decode on play and export filename
- [x] T2: `currentJobId` stamp guards stale Worker responses on rapid file drops
- [x] T3: `bars.length === 0` guard in `worker.onmessage` — shows error instead of silent 60s black screen
- [x] T4: Short file detection (`validateAudioDuration(< 30s)`) on main thread before Worker postMessage
- [x] T5: `stopAnimation()` extended to also stop `currentAudioSource`
- [x] T6: DRY extraction to `src/utils.ts` (`pitchHue`, `annularSector`, `validateAudioDuration`, `playbackAngle`, `stripExtension`)
- [x] T7: `src/utils.test.ts` — 20 Vitest unit tests for pure helpers (54 total)
- [x] T8: `exportFingerprint()` in `renderer.ts` — 2048×2260 offscreen canvas with song/key/tempo/duration caption
- [x] T9: Save button downloads `{songname}_resonance.png` via `exportFingerprint()`
- [x] T10: Song title (extension stripped) shown in stats below fingerprint
- [x] T11: Playback tracker — "play" button re-decodes from `currentFile`, overlay canvas with white radial line at `playbackAngle(audioCtx.currentTime, duration)`

**Phase 4 P3 (optional polish):**
- [ ] T12: Segment radial gradient — evaluate whether per-segment gradient adds visual value vs. existing `ringDepth()` per-ring gradient
- [ ] T13: Color wheel evaluation on 10+ diverse songs — confirm fifth-apart delta is ~210°, update TODOS.md
- [ ] T14: Update TODOS.md — add file size/duration policy TODO (D11); rename TODO-3 to "collision smoke test" (D12)

**Next: browser test Phase 4 golden path**
- [ ] Drop a real song → watch 60s animation → fingerprint appears with stats
- [ ] Click "save PNG" → verify 2048×2260 download with caption
- [ ] Click "play" → verify white radial line sweeps the fingerprint
- [ ] Drop a second song mid-analysis → verify clean cancellation

**Phase 2 deferred quality tests (still pending):**
- [ ] Song quality test: 4-chorus pop song → ≥3 visible energy peaks in Ring 3
- [ ] Two songs a perfect fifth apart → visibly different dominant hues in Ring 1
- [ ] Classical piano vs. metal → distinguishable at a glance
- [ ] 10+ diverse songs tested
