# Current Task — Resonance

## Active: Phase 3 — Complete ✅ / Phase 4 Planning

**Status:** Phase 3 animation sequence fully implemented. All T1–T11 tasks done. Needs browser testing.

**Phase 3 tasks — ALL COMPLETE:**
- [x] T1: Cancellation token — `rafCancel` flag, `stopAnimation()`, wired to `processFile` and `renderDropZone`
- [x] T2: Waveform draw (0–5s): single stroke, `bar.rms` ±30% height, left-to-right
- [x] T3: Frequency bands (5–15s): 8 stacked traces, pitch-class groups
- [x] T4: Chromagram fill (15–30s): 12×N column-by-column, HSL colors, opacity = weight; mobile 12×50 cap
- [x] T5: Ring 1 assembly (30–45s): clockwise linear draw
- [x] T6: Rings 2–4 assembly (45–55s) + glyph reveal (55–60s)
- [x] T7: Stage label below canvas (Geist Mono 0.7rem `#444`, fades at 55s)
- [x] T8: Inter-phase crossfades (0.3s out + 0.2s in)
- [x] T9: Wall-clock timer via `performance.now()`
- [x] T10: Mobile chromagram cap 12×50 on ≤480px
- [x] T11: Error path (hard cut RAF + show error UI)

**Next: browser test Phase 3, then Phase 2 song quality tests**
- [ ] Drop a real song, watch full 60-second sequence
- [ ] Verify stage labels update per phase
- [ ] Verify new drop mid-animation hard-cuts cleanly
- [ ] Phase 2 deferred: 4-chorus pop, fifth-apart songs, classical vs metal

**Phase 2 deferred (do after Phase 3 browser-tested):**
- [ ] Song quality test: 4-chorus pop song → ≥3 visible energy peaks in Ring 3
- [ ] Two songs a perfect fifth apart → visibly different dominant hues in Ring 1
- [ ] Classical piano vs. metal → distinguishable at a glance
- [ ] 10+ diverse songs tested
