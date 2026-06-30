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

### Design Decisions (locked in /plan-design-review, 2026-06-28)

**Layout & timing:**
- All phases animate within the fixed center zone: `clamp(300px, 70vmin, 700px)` canvas, centered in viewport. No viewport-spanning waveform.
- Animation timing: wall-clock driven (`performance.now()`). Worker returns all data in ~0.23s (pre-loaded). The 60-second build is a deliberate design choice, not an analysis constraint.
- No "analyzing structure..." intermediate state. Animation begins as soon as the Worker returns (~0.23s after drop). File name shows above canvas zone during the build.
- Stage label: one Geist Mono line below canvas (`font-size: 0.7rem; letter-spacing: 0.12em; color: #444`), updates per phase:
  `reading waveform` → `isolating harmonics` → `mapping pitch field` → `assembling ring 1` → `composing fingerprint` → fades out at 55s.

**Interrupt & error states:**
- User drops a new file mid-animation: hard cut. Cancel all active RAF loops via a cancellation token (AbortController or cancel flag). Replace with new file's sequence.
- Worker error during animation: cancel RAF loops, fade canvas to `#0C0C10` over 0.3s, show existing error UI.

**Inter-phase transitions:**
- Each phase fades its content to `#0C0C10` over 0.3s at phase end, then next phase fades in over 0.2s. 0.5s crossfade per boundary.
- Phase boundaries: 0s, 5s, 15s, 30s, 45s, 55s, 60s.

**Phase visual specs:**

*Phase 1 — Waveform (0s–5s):*
- Single Path2D stroke across the canvas zone, centered vertically.
- 1px line weight. Color: `#dedede` at opacity 0.35.
- Amplitude: ±30% of canvas height. Draws left-to-right over 5s.
- Scientific/oscilloscope aesthetic — not bouncing bars.

*Phase 2 — Frequency decomposition (5s–15s):*
- 8–12 thin Path2D stroke traces stacked vertically within canvas zone, tight gaps between them.
- Same stroke style as Phase 1 (`#dedede`, 1px). Opacity per band: 0.25–0.45 (lower bands slightly more prominent).
- Traces are static amplitude profiles per frequency band — not animated bouncing.
- Appears as stacked oscilloscope lines, not an EQ visualizer.

*Phase 3 — Chromagram fill (15s–30s):*
- 12×N grid (12 pitch classes × N bars). Fills column by column, left to right (time axis).
- Each cell: `hsl(${pitchHue(pc)}, sat%, light%)` at opacity proportional to chromagram weight (0 weight ≈ transparent).
- No grid borders or outlines. Cells are color patches on the dark background.
- Mobile (≤480px): cap at 12×50 columns (time-compressed view).

*Phase 4 — Ring 1 assembly (30s–45s):*
- Draws clockwise from 12 o'clock, one segment per RAF frame.
- Draw rate: N segments / (15s × 60fps) segments per frame. Linear — no per-segment easing.
- Uses the same `hsl(${pitchHue(pc)}, 78%, 54%)` fill as the final renderer.

*Phase 5 — Rings 2–4 assembly (45s–55s):*
- All three outer rings draw simultaneously, each at their own linear rate (N segments / 10s × 60fps).
- Ring 2, 3, 4 visual specs identical to final renderer (`renderer.ts`).

*Phase 6 — Glyph reveal (55s–60s):*
- Rings stay visible (no re-render). Center zone had an `#0C0C10` overlay at opacity 0.8 covering the glyph area.
- Overlay fades from opacity 0.8 → 0 over 5s, revealing the key+BPM Geist Mono glyph.
- No replay of `appear` animation — rings are already in place.
- Stage label fades out as glyph fades in.

**Segment reveal easing:** Linear draw rate for all ring assembly phases.

**Mobile:** Canvas is `clamp(300px, 70vmin, 700px)`. At ≤480px, chromagram caps at 12×50 columns. All other phases scale naturally with the canvas size.

**Skip:** No skip button. The 60-second build is the experience per SPEC.md.

### Implementation Tasks

- [x] Add cancellation token (cancel flag or AbortController) to animation state; wire to `processFile` so new drops hard-cut RAF loops
- [x] Waveform draw (0s–5s): Path2D stroke, 1px, `#dedede` at 0.35 opacity, ±30% height, left-to-right over 5s
- [x] Frequency decomposition (5s–15s): 8–12 stacked thin amplitude traces, same stroke style, 0.25–0.45 opacity per band
- [x] Chromagram fill (15s–30s): 12×N column-by-column, HSL pitch-class colors, opacity = chromagram weight, no borders; 12×50 cap on ≤480px
- [x] Ring 1 assembly (30s–45s): clockwise segment draw, linear rate
- [x] Rings 2–4 assembly (45s–55s): simultaneous draw, linear rate per ring
- [x] Glyph reveal (55s–60s): fade `#0C0C10` overlay opacity 0.8→0 over 5s; stage label crossfades out
- [x] Stage label: Geist Mono below canvas, updates per phase, fades out at 55s
- [x] Inter-phase crossfades: 0.3s fade-out + 0.2s fade-in between each phase pair
- [x] Error path: cancel RAF loops, show existing error UI
- [x] Wall-clock timer via `performance.now()` drives all phase timing

---

## Phase 4 — Polish and Export (Weeks 17–22)

Goal: ship-quality product.

### Architecture Decisions (locked in /plan-eng-review, 2026-06-29)

- Export canvas: `exportFingerprint()` creates a separate 2048×2260 offscreen canvas for download. Display canvas stays 2048×2048 unchanged.
- Caption spec: song name (extension stripped, max 60 chars + ellipsis) at 36px Geist Mono `#dedede`; key / tempo / duration at 28px `#555`; centered; 106px margin below Ring 4.
- Companion mode: playback tracker only (white radial line, no streaming FFT). Re-decode from stored `currentFile: File` on play button click. Overlay transparent canvas stacked above fingerprint via `position: absolute`. TODO-2 real-time streaming deferred to Phase 5.
- Short file detection: main thread after `AudioContext.decodeAudioData`, before Worker postMessage. `if (audioBuffer.duration < 30) → showError(...)`.
- Job ID stamp: `let currentJobId = 0`; increment on each `processFile()`; guard stale Worker responses with `if (jobId !== currentJobId) return`.
- Cancellation: `stopAnimation()` extended to also call `currentAudioSource?.stop()`. Overlay RAF loop reuses same `cancelled` flag pattern.
- DRY: `pitchHue()` and `annularSector()` extracted to `src/utils.ts`; imported by `main.ts`, `renderer.ts`, and `exportFingerprint()`.
- Tests: pure helpers extracted (`validateAudioDuration`, `playbackAngle`, `buildExportCaption`) with Vitest unit tests. DOM-coupled paths rely on browser testing.
- Color wheel: chromatic (`pc × 30°`) is correct. Songs a perfect fifth apart (7 semitones) differ by ~210° on the chromatic wheel — large and visually obvious. TODOS.md corrected.

### Implementation Tasks

- [x] **T1 (P1)** — `src/utils.ts` — Extract `pitchHue()` and `annularSector()` to shared utils
- [x] **T2 (P1)** — `src/main.ts:414` — Guard `bars.length === 0` in worker.onmessage → `showError()`
- [x] **T3 (P1)** — `src/main.ts` — Add job ID stamp to `processFile()` to prevent stale decode race
- [x] **T4 (P1)** — `src/main.ts:83` — Detect short file (<30s) before Worker postMessage
- [x] **T5 (P1)** — `src/main.ts:9` — Extend `stopAnimation()` to stop `AudioBufferSourceNode`
- [x] **T6 (P2)** — `src/utils.test.ts` — Pure helpers + 20 Vitest unit tests (54 total)
- [x] **T7 (P2)** — `src/main.ts` — `let currentFile: File|null`; store in `processFile()`
- [x] **T8 (P2)** — `src/renderer.ts` — Implement `exportFingerprint(bars, key, tempo, filename)` — 2048×2260
- [x] **T9 (P2)** — `src/main.ts:382` — Update save button to call `exportFingerprint()` instead of display canvas
- [x] **T10 (P2)** — `src/main.ts` — Show song name (no extension) in stats DOM line
- [x] **T11 (P2)** — `src/main.ts` — Playback tracker: play button, re-decode, overlay canvas, RAF loop, `onended` cleanup
- [x] **T12 (P3)** — `src/renderer.ts` — `segmentHighlight()`: 9% white overlay on center 44% of each segment's angular span; applied to Rings 1, 2, 4 (Ring 3 excluded — continuous profile)
- [x] **T13 (P3)** — Manual + `TODOS.md` — Color wheel evaluation; fifth-apart delta corrected to ~210° in TODOS.md
- [x] **T14 (P3)** — `TODOS.md` — Add file size/duration policy TODO; rename TODO-3 to "collision smoke test"
- [x] **T15 (P3)** — `docs/` + `PHASES.md` — Updated HANDOFF.md, CURRENT_TASK.md, AI_CONTEXT.md

> **Companion mode gate resolved:** Real-time streaming analysis (TODO-2) is deferred to Phase 5. Phase 4 implements the playback tracker (simple) only. The companion mode architecture spec is now a Phase 5 prerequisite, not Phase 4.

---

## Phase 5 — Depth (Months 6+)

- [ ] Fingerprint gallery (IndexedDB, last 12, thumbnails)
- [ ] Comparison view (two fingerprints side by side)
- [ ] Shareable link (URL hash encodes bar-level features, not audio)
- [ ] Ensemble mode (full album as concentric sub-rings)
- [ ] AI genre label (YAMNet / MusiCNN via TensorFlow.js)

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | CLEAR (PLAN) | 10 findings, all folded via D8/D9/D10 |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 2 | CLEAR (PLAN) | 15 tasks (5 P1, 6 P2, 4 P3), 2 critical gaps resolved |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score: 2/10 → 8/10, 11 decisions made |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**CODEX:** Stale-decode race (T3), bars=[] silent failure (T2), color wheel spec error (T13) — all folded.

**VERDICT:** ENG + DESIGN CLEARED — Phase 4 architecture locked (10 decisions, D1–D10). 15 implementation tasks ready.

NO UNRESOLVED DECISIONS
