# Resonance — Phases

## Phase 1 — Audio Pipeline ✅ COMPLETE

Goal: raw audio in → `{ bars, key, tempo, duration }` out of the Worker. No visuals beyond an RMS bar chart sanity check.

### Scaffold
- [x] `npm create vite@latest . -- --template vanilla-ts`
- [x] Install fft.js (`npm install fft.js`)
- [x] Install Vitest (`npm install -D vitest`)
- [x] Configure Vitest in `vite.config.ts`

### File Input
- [x] Drag-and-drop + file picker on main thread
- [x] Audio decoded in main thread via `AudioContext.decodeAudioData`; decoded `Float32Array` transferred to Worker as Transferable (`OfflineAudioContext` is not available in Web Workers)

### Web Worker
- [x] `src/worker.ts` — receives decoded Float32Array samples, runs pipeline, posts `{ bars, key, tempo, duration }`

### DSP Modules (`src/dsp/`)
- [x] `fft.ts` — fft.js wrapper, 2048-point forward transform, Hann window
- [x] `chromagram.ts` — 12-bin pitch class profile from FFT magnitudes
- [x] `rms.ts` — per-window RMS energy
- [x] `centroid.ts` — spectral centroid (weighted mean of bins); NaN guard on silence → return 0
- [x] `onset.ts` — per-frame onset strength (sum of positive spectral flux)
- [x] `bpm.ts` — BPM via autocorrelation of onset strength function
- [x] `beats.ts` — dynamic-programming beat tracker: onset strength + BPM → beat timestamps
- [x] `key.ts` — Krumhansl-Schmuckler on time-averaged chromagram; returns `{ key, confidence }`
- [x] `barAggregation.ts` — group beats into bars; BPM=0 guard → return []

### Unit Tests (Vitest)
- [x] 440Hz sine wave → chromagram A4 bin dominant
- [x] 120BPM click track → detected BPM within ±2% of 120
- [x] Pure C major scale → K-S returns "C major", high confidence
- [x] Uniform chromagram → key returned as "unclear"
- [x] `barAggregation(bpm=0)` → returns [], no divide-by-zero
- [x] `centroid(silence)` → returns 0, not NaN

### Validation
- [x] Performance benchmark: 0.23s for 103s MP3 (~450× real-time). See SPEC.md "Measured Performance".
- [x] First visual: RMS bar chart renders on real audio; confirmed F# major / 104 BPM / 266s / 168 bars on a GD track.

---

## Phase 2 — Fingerprint Renderer (Weeks 7–11)

Goal: bar-level data → a static, printable circular fingerprint on canvas.

- [x] Canvas renderer scaffolded (`src/renderer.ts`)
- [x] Ring 1: pitch class → hue mapping (chromatic color wheel, pc×30°), one segment per bar
- [x] Ring 2: onset density → saturation per segment (fixed inner/outer radius)
- [x] Ring 3: RMS energy → radial extension (no inter-segment gap, continuous profile)
- [x] Ring 4: spectral centroid → brightness/saturation per segment
- [x] Center glyph: key + BPM via `fillText` in Geist Mono (document.fonts.load() gate before render)
- [x] Near-black background (#0C0C10), inter-ring gaps, subtle radial gradient per segment
- [x] Lightweight export: `canvas.toDataURL('image/png')` at 2048×2048 (no caption yet)
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
