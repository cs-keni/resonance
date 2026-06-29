# Current Task — Resonance

## Active: Phase 2 — Fingerprint Renderer

**Status:** Canvas renderer scaffolded and rings implemented. Testing in progress.

**Phase 2 progress:**
- [x] Scaffold `src/renderer.ts` — Canvas 2D renderer
- [x] Ring 1: pitch class → hue (chromatic color wheel, pc×30°), one segment per bar
- [x] Ring 2: onset density → saturation per segment
- [x] Ring 3: RMS energy → radial extension (no inter-segment gap, continuous profile)
- [x] Ring 4: spectral centroid → brightness per segment
- [x] Center glyph: key + BPM via `fillText`, Geist Mono loaded via `document.fonts.load()` gate
- [x] Export: `canvas.toDataURL('image/png')` wired to "save png" button
- [x] Subtle radial depth gradient overlay on each ring
- [x] Fingerprint fade-in animation on result view

**Remaining (Phase 2 completion criteria):**
- [ ] Song quality test: 4-chorus pop → ≥3 visible Ring 3 energy peaks
- [ ] Two songs a perfect fifth apart → visibly different dominant hues in Ring 1
- [ ] Classical piano vs. metal → distinguishable at a glance
- [ ] 10+ diverse songs tested

**Blockers:** None
