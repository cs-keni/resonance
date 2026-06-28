# Resonance — Phases

## Phase 1 — Audio Pipeline (Weeks 1–6)

Goal: raw audio in → `{ bars, key, tempo, duration }` out of the Worker. No visuals beyond an RMS bar chart sanity check.

### Scaffold
- [ ] `npm create vite@latest . -- --template vanilla-ts`
- [ ] Install fft.js (`npm install fft.js`)
- [ ] Install Vitest (`npm install -D vitest`)
- [ ] Configure Vitest in `vite.config.ts`

### File Input
- [ ] Drag-and-drop + file picker on main thread
- [ ] File bytes transferred to Worker as Transferable

### Web Worker
- [ ] `src/worker.ts` — receives file bytes, runs pipeline, posts `{ bars, key, tempo, duration }`
- [ ] `OfflineAudioContext` decode inside Worker (float32 buffer never crosses Worker boundary)

### DSP Modules (`src/dsp/`)
- [ ] `fft.ts` — fft.js wrapper, 2048-point forward transform, Hann window
- [ ] `chromagram.ts` — 12-bin pitch class profile from FFT magnitudes
- [ ] `rms.ts` — per-window RMS energy
- [ ] `centroid.ts` — spectral centroid (weighted mean of bins); NaN guard on silence → return 0
- [ ] `onset.ts` — per-frame onset strength (sum of positive spectral flux)
- [ ] `bpm.ts` — BPM via autocorrelation of onset strength function
- [ ] `beats.ts` — dynamic-programming beat tracker: onset strength + BPM → beat timestamps
- [ ] `key.ts` — Krumhansl-Schmuckler on time-averaged chromagram; returns `{ key, confidence }`
- [ ] `barAggregation.ts` — group beats into bars; BPM=0 guard → return []

### Unit Tests (Vitest)
- [ ] 440Hz sine wave → chromagram A4 bin dominant
- [ ] 120BPM click track → detected BPM within ±2% of 120
- [ ] Pure C major scale → K-S returns "C major", high confidence
- [ ] Uniform chromagram → key returned as "unclear"
- [ ] `barAggregation(bpm=0)` → returns [], no divide-by-zero
- [ ] `centroid(silence)` → returns 0, not NaN

### Validation
- [ ] Performance benchmark: 3-min MP3 and 10-min FLAC through the Worker; document wall time in SPEC.md
- [ ] First visual: rough RMS bar chart on a `<canvas>` confirms the pipeline is working end-to-end

---

## Phase 2 — Fingerprint Renderer (Weeks 7–11)

Goal: bar-level data → a static, printable circular fingerprint on canvas.

- [ ] Canvas renderer scaffolded (`src/renderer.ts`)
- [ ] Ring 1: pitch class → hue mapping (K-S color wheel), one segment per bar
- [ ] Ring 2: onset density → opacity/saturation per segment (fixed inner/outer radius)
- [ ] Ring 3: RMS energy → radial extension as a continuous line
- [ ] Ring 4: spectral centroid → brightness/saturation per segment
- [ ] Center glyph: key + BPM via `fillText` in Geist Mono (FontFace.load() gate before render)
- [ ] Near-black background (#0C0C10), inter-ring gaps, subtle radial gradient per segment
- [ ] Lightweight export: `canvas.toDataURL('image/png')` at 2048×2048 (no caption yet)
- [ ] Song quality test — pass criteria:
  - [ ] 4-chorus pop song → ≥3 visible energy peaks in Ring 3
  - [ ] Two songs a perfect fifth apart → visibly different dominant hues in Ring 1
  - [ ] Classical piano vs. metal → distinguishable at a glance
- [ ] 10+ diverse songs tested

> **Before Phase 3:** run `/plan-design-review` on the animation sequence design.

---

## Phase 3 — Analysis Sequence (Weeks 12–16)

Goal: the 60-second visual experience while the fingerprint builds.

- [ ] Waveform draw animation (0s–5s): full-song waveform traces itself across the screen
- [ ] Frequency decomposition animation (5s–15s): waveform splits into stacked frequency bands
- [ ] Chromagram fill animation (15s–30s): 12×N grid fills color by color, ~10 rows/second
- [ ] Ring 1 assembly animation (30s–45s): innermost ring draws clockwise, segment by segment
- [ ] Rings 2–4 assembly animation (45s–55s): outer rings draw simultaneously, expanding outward
- [ ] Glyph fade-in (55s–60s): analysis overlay fades, center glyph fades in
- [ ] All animations driven by `requestAnimationFrame`, decoupled from Worker analysis timeline
- [ ] Worker posts progress messages so animations stay in sync without blocking on analysis

---

## Phase 4 — Polish and Export (Weeks 17–22)

Goal: ship-quality product.

- [ ] Full export: 2048×2048 PNG with song name, key, tempo caption below image
- [ ] Segment radial gradient (subtle, adds depth to rings)
- [ ] Color wheel tuning: refine pitch-class-to-hue mapping based on diverse song evaluation
- [ ] Error handling: corrupted file, unsupported format, silent file, short file (<30s)
- [ ] Real-time companion: white radial line moves clockwise as song plays (architecture spec in TODOS.md first)
- [ ] Song name + duration displayed below fingerprint
- [ ] TODO-3: uniqueness guarantee validation (same-genre song pairs)

> **Before Phase 4:** write real-time companion mode architecture spec (see TODOS.md TODO-2).

---

## Phase 5 — Depth (Months 6+)

- [ ] Fingerprint gallery (IndexedDB, last 12, thumbnails)
- [ ] Comparison view (two fingerprints side by side)
- [ ] Shareable link (URL hash encodes bar-level features, not audio)
- [ ] Ensemble mode (full album as concentric sub-rings)
- [ ] AI genre label (YAMNet / MusiCNN via TensorFlow.js)
